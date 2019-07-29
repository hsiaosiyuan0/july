import { Source, EOL, SourceLoc, Position, EOF } from "./source";
import { Token, isKeyword, TokKind, isSign1, isSign2 } from "./token";

export class Lexer {
  src: Source;
  prevSpaceCount: number;
  isFirstTokInLine: boolean;

  constructor(src: Source) {
    this.src = src;
    this.prevSpaceCount = 0;
    this.isFirstTokInLine = false;
  }

  get pos() {
    return new Position(this.src.ofst, this.src.line, this.src.col);
  }

  get loc() {
    const loc = new SourceLoc();
    loc.start = this.pos;
    return loc;
  }

  next(): Token {
    this.skipWhitespace();
    if (this.aheadIsIdStart()) return this.readId();
    if (this.aheadIsNumericStart()) return this.readNumeric();
    if (this.aheadIsStringStart()) return this.readString();
    if (this.aheadIsEos()) return new Token(TokKind.EOS, this.loc);
    return this.readSign();
  }

  aheadIsEos() {
    return EOF === this.src.peek();
  }

  finTok(tok: Token) {
    tok.loc.end = this.pos;
    tok.prevSpaceCount = this.prevSpaceCount;
    tok.isFirstTokInLine = this.isFirstTokInLine;
    this.prevSpaceCount = 0;
    this.isFirstTokInLine = false;
    return tok;
  }

  aheadIsIdStart() {
    return isIdStart(this.src.peek());
  }

  readId() {
    const loc = this.loc;
    const cs = [];
    while (true) {
      let c = this.src.peek();
      if (isIdPart(c)) {
        cs.push(this.src.read());
      } else break;
    }
    const name = cs.join("");
    if (isKeyword(name)) {
      return this.finTok(Token.newKw(loc, name));
    } else if (name === "true" || name === "false") {
      return this.finTok(Token.newBool(loc, name));
    } else if (name === "null") {
      return this.finTok(Token.newNull(loc));
    } else if (name === "undefined") {
      return this.finTok(Token.newUndef(loc));
    }
    return this.finTok(Token.newId(loc, name));
  }

  aheadIsNumericStart() {
    return isDigit(this.src.peek());
  }

  readDecimalDigits() {
    const cs = [];
    while (true) {
      let c = this.src.peek();
      if (isDigit(c)) {
        cs.push(this.src.read());
      } else break;
    }
    return cs.join("");
  }

  readExponent() {
    const cs = [];
    // consume `e` or `E`
    cs.push(this.src.read());
    const sign = this.src.peek();
    if (sign === "+" || sign === "-") {
      cs.push(this.src.read());
    }
    const ds = this.readDecimalDigits();
    if (ds.length === 0) this.raiseErr();
    cs.push(ds);
    return cs.join("");
  }

  readDecimalIntPart() {
    const c = this.src.read();
    if (c === "0") {
      return c;
    }
    return c + this.readDecimalDigits();
  }

  testAhead(c: string) {
    return c === this.src.peek();
  }

  testAheadOr(c1: string, c2: string) {
    const nc = this.src.peek();
    return c1 === nc || c2 === nc;
  }

  readDecimal() {
    let c = this.src.peek();
    const cs = [];
    const fra = c === ".";
    if (isDigit(c)) cs.push(this.readDecimalIntPart());

    if (this.testAhead(".")) {
      cs.push(this.src.read());
      const ds = this.readDecimalDigits();
      if (ds.length === 0 && fra) this.raiseErr();
      cs.push(ds);
    }

    if (this.testAheadOr("e", "E")) {
      cs.push(this.readExponent());
    }
    return cs.join("");
  }

  readHex() {
    // consume `0x` or `0X`
    const cs = [this.src.read(), this.src.read()];
    const ds = [];
    while (true) {
      let c = this.src.peek();
      if (isHexDigit(c)) {
        ds.push(this.src.read());
      } else break;
    }
    if (ds.length === 0) this.raiseErr();
    cs.push(ds.join(""));
    return cs.join("");
  }

  readNumeric() {
    const loc = this.loc;
    let isHex = false;
    let value = "";

    const c2 = this.src.peek(2);
    isHex = c2 === "0x" || c2 === "0X";

    if (isHex) value = this.readHex();
    else value = this.readDecimal();

    return this.finTok(Token.newNum(loc, value));
  }

  aheadIsStringStart() {
    let c = this.src.peek();
    return c == "'" || c == '"';
  }

  readUnicodeEscapeSeq() {
    const cs = [];
    for (let i = 0; i < 4; i++) {
      let c = this.src.read();
      if (isHexDigit(c)) cs.push(c);
      else this.raiseErr();
    }
    return cs.join("");
  }

  readStringEscapeSeq() {
    // consume `\`
    const cs = [this.src.read()];
    let c = this.src.read();
    if (isSingleEscapeCh(c)) {
      cs.push(c);
    } else if (c === "x") {
      cs.push(c);
      for (let i = 0; i < 2; i++) {
        c = this.src.read();
        if (isHexDigit(c)) cs.push(c);
        else this.raiseErr();
      }
    } else if (c === "u") {
      cs.push(c);
      cs.push(this.readUnicodeEscapeSeq());
    } else {
      this.raiseErr();
    }
    return cs.join("");
  }

  readString() {
    const loc = this.loc;
    const term = this.src.read();
    const cs = [];
    while (true) {
      let c = this.src.peek();
      if (c === term) {
        this.src.read();
        break;
      } else if (c === "\\") {
        cs.push(this.readStringEscapeSeq());
      } else {
        cs.push(this.src.read());
      }
    }
    return this.finTok(Token.newStr(loc, cs.join("")));
  }

  readSign() {
    const loc = this.loc;
    const c2 = this.src.peek(2);
    if (isSign2(c2)) {
      this.src.read(2);
      return this.finTok(Token.newSign(loc, c2));
    }
    const c1 = this.src.peek();
    if (isSign1(c1)) {
      this.src.read();
      return this.finTok(Token.newSign(loc, c1));
    }
    this.raiseErr();
    throw new Error("unreachable");
  }

  skipComment() {
    const c2 = this.src.peek(2);
    if (c2 !== "//") return;
    this.src.read(2);
    while (true) {
      if (isNewline(this.src.read())) break;
    }
  }

  skipWhitespace() {
    while (true) {
      let c = this.src.peek();
      if (isSpace(c)) {
        this.src.read();
        this.prevSpaceCount++;
      } else if (isNewline(c)) {
        this.src.read();
        this.isFirstTokInLine = true;
      } else if (c === "/") {
        this.skipComment();
      } else if (c === "\t") {
        this.src.read();
      } else {
        break;
      }
    }
  }

  errMsg() {
    const line = this.src.line;
    const col = this.src.col;
    return `Unexpected char at line: ${line} column: ${col}`;
  }

  raiseErr() {
    throw new LexerError(this.errMsg());
  }
}

export function isSpace(c: string) {
  return c == " ";
}

export function isNewline(c: string) {
  return c == EOL;
}

export function isSpaceOrTab(c: string) {
  return isSpace(c) || c == "\t";
}

export function isWhitespace(c: string) {
  return isSpace(c) || isNewline(c) || c == "\t";
}

export function isLetter(c: string) {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

export function isIdStart(c: string) {
  return isLetter(c) || c == "_";
}

export function isDigit(c: string) {
  return c >= "0" && c <= "9";
}

export function isHexDigit(c: string) {
  return isDigit(c) || (c >= "a" && c <= "f") || (c >= "A" && c <= "F");
}

export function isIdPart(c: string) {
  return isIdStart(c) || isDigit(c);
}

// prettier-ignore
const singleEscapeChs = new Set(["'", '"', "\\", "b", "f", "n", "r", "t", "v", "0"]);
export function isSingleEscapeCh(c: string) {
  return singleEscapeChs.has(c);
}

export class LexerError extends Error {}

export * from "./source";
export * from "./token";
