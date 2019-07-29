import { SourceLoc } from "./source";

export enum TokKind {
  EOS,
  Sign,
  String,
  Number,
  Identifier,
  Keyword
}

export class Sign {
  static Plus = "+";
  static Minus = "-";
  static Star = "*";
  static Slash = "/";
  static Modulo = "%";
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
  static Cond = "?";
  static Assign = "=";
}

export class Keyword {
  static If = "if";
  static Elf = "elf";
  static For = "for";
  static Else = "else";
}

export class Token {
  type: TokKind;
  value: string;
  loc: SourceLoc;

  constructor(type: TokKind, value: string, loc: SourceLoc) {
    this.type = type;
    this.value = value;
    this.loc = loc;
  }
}
