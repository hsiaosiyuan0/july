import { Source, Lexer, TokKind } from "../src";

function newLexer(code: string) {
  const src = new Source(code);
  const lexer = new Lexer(src);
  return lexer;
}

test(`id and keyword`, () => {
  const code = `
  div
    if
    true false null undefined
  `;

  const lexer = newLexer(code);
  let tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Identifier);
  expect(tok.value).toBe("div");
  expect(tok.isFirstTokInLine).toBeTruthy();
  expect(lexer.isNewlineAhead).toBeTruthy();
  expect(tok.prevSpaceCount).toBe(2);

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Keyword);
  expect(tok.value).toBe("if");
  expect(tok.isFirstTokInLine).toBeTruthy();
  expect(tok.prevSpaceCount).toBe(4);

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Bool);
  expect(tok.value).toBe("true");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Bool);
  expect(tok.value).toBe("false");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Null);

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Undef);
});

test("number", () => {
  const code = `
  1 0. 1.0 1e1 1e-1 1e+10 -1
  `;

  const lexer = newLexer(code);
  let tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Number);
  expect(tok.value).toBe("1");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Number);
  expect(tok.value).toBe("0.");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Number);
  expect(tok.value).toBe("1.0");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Number);
  expect(tok.value).toBe("1e1");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Number);
  expect(tok.value).toBe("1e-1");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Number);
  expect(tok.value).toBe("1e+10");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Sign);
  expect(tok.value).toBe("-");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Number);
  expect(tok.value).toBe("1");
});

test("string", () => {
  const code = `
  'str' "str" "str\\n" '\\u1F600' "\\x61"
  `;

  const lexer = newLexer(code);
  let tok = lexer.next();
  expect(tok.kind).toBe(TokKind.String);
  expect(tok.value).toBe("str");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.String);
  expect(tok.value).toBe("str");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.String);
  expect(tok.value).toBe("str\\n");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.String);
  expect(tok.value).toBe("\\u1F600");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.String);
  expect(tok.value).toBe("\\x61");
});

test("sign", () => {
  const code = `
  = >= <= + - &&
  `;

  const lexer = newLexer(code);
  let tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Sign);
  expect(tok.value).toBe("=");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Sign);
  expect(tok.value).toBe(">=");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Sign);
  expect(tok.value).toBe("<=");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Sign);
  expect(tok.value).toBe("+");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Sign);
  expect(tok.value).toBe("-");

  tok = lexer.next();
  expect(tok.kind).toBe(TokKind.Sign);
  expect(tok.value).toBe("&&");
});
