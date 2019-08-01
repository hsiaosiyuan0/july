import {
  Codegen,
  Symtab,
  Parser,
  Source,
  Lexer,
  BindingResolver
} from "july-compiler";
import types from "@babel/types";
import babel from "@babel/core";
import template from "@babel/template";

type Context = { types: typeof types };

export function compile(code: string, bindResolver: BindingResolver) {
  const src = new Source(code);
  const lexer = new Lexer(src);
  const parser = new Parser(lexer);
  const prog = parser.parseProg();
  const symtab = new Symtab(bindResolver);
  symtab.visitProg(prog);
  const codegen = new Codegen(prog, symtab);
  return codegen.jsAst();
}

export default function(b: Context) {
  const t = b.types;
  let importJuly = false;
  return {
    visitor: {
      TaggedTemplateExpression(
        path: babel.NodePath<types.TaggedTemplateExpression>
      ) {
        const matchTag =
          t.isIdentifier(path.node.tag) && /july?/.test(path.node.tag.name);
        if (!matchTag) return;

        const code = path.node.quasi.quasis[0].value.raw;
        path.replaceWith(compile(code, name => path.scope.hasBinding(name)));

        importJuly = true;
      },
      Program: {
        exit(path: babel.NodePath<types.Program>) {
          if (!importJuly) return;

          const fn = template`import { Runtime as july } from "july";`;
          (path as any).unshiftContainer("body", fn());
        }
      }
    }
  };
}
