import { SourceLoc } from "./source";

export enum TokKind {
  EOS,
  Sign,
  String,
  Number,
  Identifier,
  Keyword,
  Bool,
  Null,
  Undef
}

export class Sign {
  static Plus = "+";
  static Minus = "-";
  static Star = "*";
  static Slash = "/";
  static Modulo = "%";
  static Pow = "**";
  static LE = "<=";
  static GE = ">=";
  static LT = "<";
  static GT = ">";
  static Eq = "==";
  static NotEq = "!=";
  static ParenL = "(";
  static ParenR = ")";
  static BraceL = "{";
  static BraceR = "}";
  static BracketL = "[";
  static BracketR = "]";
  static Colon = ":";
  static Dot = ".";
  static Comma = ",";
  static And = "&&";
  static Or = "||";
  static Not = "!";
  static Cond = "?";
  static Assign = "=";
}

const precedence = new Map(
  Object.entries({
    "**": 15,
    "+": 13,
    "-": 13,
    "*": 14,
    "/": 14,
    "%": 14,
    "<=": 11,
    ">=": 11,
    "<": 11,
    ">": 11,
    "==": 10,
    "!=": 10,
    "&&": 6,
    "||": 5
  })
);
export function pcd(s: string) {
  if (precedence.has(s)) return precedence.get(s)!;
  return -1;
}
export function isAssocR(s: string) {
  return s === "**";
}
export function isBin(s: string) {
  return precedence.has(s);
}

export class Keyword {
  static If = "if";
  static Elf = "elf";
  static For = "for";
  static In = "in";
  static Else = "else";
}

const keywords = new Set(["if", "elf", "for", "in", "else"]);
export function isKeyword(id: string) {
  return keywords.has(id);
}

// prettier-ignore
const sign1 = new Set(['+', '-', '*', '/', '%', '<', '>', '=', '(', ')', '{','}', '[', ']', '?', ":", ',', '.', '!']);
const sign2 = new Set(["**", "<=", ">=", "==", "!=", "&&", "||"]);
export function isSign1(c: string) {
  return sign1.has(c);
}
export function isSign2(c: string) {
  return sign2.has(c);
}

export class Token {
  kind: TokKind;
  loc: SourceLoc;
  prevSpaceCount: number;
  isFirstTokInLine: boolean;
  value: string;

  constructor(kind: TokKind, loc: SourceLoc) {
    this.kind = kind;
    this.loc = loc;
    this.prevSpaceCount = 0;
    this.isFirstTokInLine = false;
    this.value = "";
  }

  matchSign(s: string) {
    return this.kind === TokKind.Sign && this.value === s;
  }

  matchKeyword(k: string) {
    return this.kind === TokKind.Keyword && this.value === k;
  }

  isBinOP() {
    return this.isSign() && isBin(this.value);
  }

  pcd() {
    return pcd(this.value);
  }

  isAssocR() {
    return this.isBinOP() && isAssocR(this.value);
  }

  isStr() {
    return this.kind === TokKind.String;
  }

  isId() {
    return this.kind === TokKind.Identifier;
  }

  isSign() {
    return this.kind === TokKind.Sign;
  }

  isKeyword() {
    return this.kind === TokKind.Keyword;
  }

  static newId(loc: SourceLoc, value: string) {
    const tok = new Token(TokKind.Identifier, loc);
    tok.value = value;
    return tok;
  }

  static newKw(loc: SourceLoc, value: string) {
    const tok = new Token(TokKind.Keyword, loc);
    tok.value = value;
    return tok;
  }

  static newNum(loc: SourceLoc, value: string) {
    const tok = new Token(TokKind.Number, loc);
    tok.value = value;
    return tok;
  }

  static newStr(loc: SourceLoc, value: string) {
    const tok = new Token(TokKind.String, loc);
    tok.value = value;
    return tok;
  }

  static newSign(loc: SourceLoc, value: string) {
    const tok = new Token(TokKind.Sign, loc);
    tok.value = value;
    return tok;
  }

  static newBool(loc: SourceLoc, value: string) {
    const tok = new Token(TokKind.Bool, loc);
    tok.value = value;
    return tok;
  }

  static newNull(loc: SourceLoc) {
    const tok = new Token(TokKind.Null, loc);
    tok.value = "null";
    return tok;
  }

  static newUndef(loc: SourceLoc) {
    const tok = new Token(TokKind.Undef, loc);
    tok.value = "undefined";
    return tok;
  }
}
