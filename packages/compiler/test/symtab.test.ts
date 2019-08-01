import { Source, Lexer, Parser, Symtab } from "../src";

function newParser(code: string) {
  const src = new Source(code);
  const lexer = new Lexer(src);
  const parser = new Parser(lexer);
  return parser;
}

test(`tag statement`, () => {
  const code = `
for k, v in items
  div {k}
  div {v1}
  `;

  const parser = newParser(code);
  const node = parser.parseProg();
  const symtab = new Symtab(() => true);
  symtab.visitProg(node);
});
