import { Source, Lexer } from "../src/lexer";
import { Parser } from "../src/parser";

function newParser(code: string) {
  const src = new Source(code);
  const lexer = new Lexer(src);
  const parser = new Parser(lexer);
  return parser;
}

test(`tag statement`, () => {
  const code = `
    div id="app"
    `;

  const parser = newParser(code);
  parser.parseTagStmt();
});

test(`expr test`, () => {
  const code = `
      1 + 2 ** 3 ** 4
      `;

  const parser = newParser(code);
  parser.parseExpr();
});

test(`expr attr`, () => {
  const code = `
    div data-test={1 + 2 * 3}
        `;

  const parser = newParser(code);
  parser.parseTagStmt();
});

test(`tag children`, () => {
  const code = `
div
  p
    a
      "text content in a"
          `;

  const parser = newParser(code);
  parser.parseStmt();
});

test(`inline text tag`, () => {
  const code = `
a "text content in a"
            `;

  const parser = newParser(code);
  parser.parseStmt();
});

test(`if stmt`, () => {
  const code = `
if a.visible > 1
  a class="green"
elf a.disabled
  a class="gray"
else
  "a is invisible"
`;

  const parser = newParser(code);
  parser.parseIfStmt();
});

test(`if stmt`, () => {
  const code = `
for k, v in items
  a {v}
else
  span "no item"
  `;

  const parser = newParser(code);
  parser.parseForStmt();
});
