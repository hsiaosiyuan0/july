import { Source, Lexer } from "../src/lexer";
import { Parser } from "../src/parser";
import { Codegen, Symtab } from "../src";
import util from "util";

const log = function(stuff: any) {
  if ("codegen" in process.env) util.inspect(stuff, true, null);
};

function newParser(code: string) {
  const src = new Source(code);
  const lexer = new Lexer(src);
  const parser = new Parser(lexer);
  return parser;
}

test(`tag statement`, () => {
  const code = `
div id="app"
  for stu in students
    for k, v in stu
      div {k + ' ' + v}
  else
    span "no student"
    `;

  const parser = newParser(code);
  const prog = parser.parseProg();
  log(prog);

  const symtab = new Symtab(() => true);
  symtab.visitProg(prog);
  const codegen = new Codegen(prog, symtab);
  const out = codegen.gen();
  log(out.code);
});
