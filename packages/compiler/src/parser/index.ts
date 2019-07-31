import { Lexer, isIdPart, Sign, TokKind, Token, Keyword } from "../lexer";
import {
  Node,
  TagStatement,
  Identifier,
  TagAttr,
  TagAttrName,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
  UndefinedLiteral,
  Expression,
  CallExpression,
  MemberExpression,
  ParenExpression,
  UnaryExpression,
  BinaryExpression,
  TernaryExpression,
  TextTagStatement,
  Prog,
  IfStatement,
  BlockStatement,
  ForStatement
} from "./ast";

export class Parser {
  lexer: Lexer;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
  }

  finNode<T extends Node>(node: T) {
    node.loc.end = this.lexer.pos;
    return node;
  }

  parseIdentifier() {
    const tok = this.lexer.next();
    if (!tok.isId()) this.raiseErr(tok);
    const node = new Identifier(tok.loc, tok.value);
    return this.finNode(node);
  }

  parseBinExpr(left: Expression, p: number = 0) {
    let ahead = this.lexer.peek();
    while (ahead.isBinOP() && ahead.pcd() >= p) {
      let op = this.lexer.next();
      let rhs = this.parseAtom();
      ahead = this.lexer.peek();
      while ((ahead.isBinOP() && ahead.pcd() > op.pcd()) || ahead.isAssocR()) {
        rhs = this.parseBinExpr(rhs, ahead.pcd());
        ahead = this.lexer.peek();
      }
      left = new BinaryExpression(op.loc.clone(), op, left, rhs);
    }
    return this.finNode(left);
  }

  parseTernaryExpr(test: Expression): Expression {
    this.nextMustSign(Sign.Cond);
    const cons = this.parseExpr();
    this.nextMustSign(Sign.Colon);
    const alt = this.parseExpr();
    return this.finNode(
      new TernaryExpression(test.loc.clone(), test, cons, alt)
    );
  }

  parseExpr() {
    const left = this.parseAtom();
    const tok = this.lexer.peek();
    if (tok.matchSign(Sign.Cond)) return this.parseTernaryExpr(left);
    return this.parseBinExpr(left, 0);
  }

  raiseErr(tok: Token) {
    const line = tok.loc.start.line;
    const col = tok.loc.start.column;
    throw new Error(`Unexpected tok at line: ${line} column: ${col}`);
  }

  raiseIndentErr(tok: Token) {
    const line = tok.loc.start.line;
    const col = tok.loc.start.column;
    throw new Error(`Unexpected indent at line: ${line} column: ${col}`);
  }

  parseAtom(): Expression {
    const tok = this.lexer.next();
    switch (tok.kind) {
      case TokKind.String:
        return new StringLiteral(tok.loc, tok.value);
      case TokKind.Number:
        return new NumberLiteral(tok.loc, tok.value);
      case TokKind.Bool:
        return new BooleanLiteral(tok.loc, tok.value);
      case TokKind.Null:
        return new NullLiteral(tok.loc, tok.value);
      case TokKind.Undef:
        return new UndefinedLiteral(tok.loc, tok.value);
      case TokKind.Identifier: {
        let node: Expression = new Identifier(tok.loc, tok.value);
        while (true) {
          let ahead = this.lexer.peek();
          if (ahead.matchSign(Sign.ParenL)) {
            node = this.parseCallExpr(node);
          } else if (ahead.matchSign(Sign.Dot)) {
            node = this.parseMember(node);
          } else if (ahead.matchSign(Sign.BracketL)) {
            node = this.parseMemberComputed(node);
          } else break;
        }
        return node;
      }
      case TokKind.Sign: {
        if (tok.matchSign(Sign.ParenL)) {
          return this.parseParenExpr();
        } else if (tok.matchSign(Sign.Minus) || tok.matchSign(Sign.Not)) {
          return this.parseUnaryExpr();
        }
      }
    }
    this.raiseErr(tok);
    throw new Error("unreachable");
  }

  nextMustSign(s: string) {
    const tok = this.lexer.next();
    const ok = tok.kind === TokKind.Sign && tok.value === s;
    if (!ok) this.raiseErr(tok);
    return tok;
  }

  nextMustKeyword(k: string) {
    const tok = this.lexer.next();
    const ok = tok.kind === TokKind.Keyword && tok.value === k;
    if (!ok) this.raiseErr(tok);
    return tok;
  }

  aheadIsSign(s: string) {
    const tok = this.lexer.peek();
    return tok.kind === TokKind.Sign && tok.value === s;
  }

  parseArgs() {
    const args: Expression[] = [];
    this.nextMustSign(Sign.ParenL);
    while (true) {
      args.push(this.parseExpr());
      if (this.aheadIsSign(Sign.Comma)) {
        this.lexer.next();
      } else break;
    }
    this.nextMustSign(Sign.ParenR);
    return args;
  }

  parseCallExpr(callee: Expression) {
    const node = new CallExpression(callee.loc.clone(), callee, []);
    node.args = this.parseArgs();
    return this.finNode(node);
  }

  parseMember(object: Expression) {
    this.nextMustSign(Sign.Dot);
    const prop = this.parseIdentifier();
    const node = new MemberExpression(object.loc.clone(), object, prop, false);
    return this.finNode(node);
  }

  parseMemberComputed(object: Expression) {
    this.nextMustSign(Sign.BracketL);
    const prop = this.parseExpr();
    const node = new MemberExpression(object.loc.clone(), object, prop, true);
    return this.finNode(node);
  }

  parseParenExpr() {
    this.nextMustSign(Sign.ParenL);
    const expr = this.parseExpr();
    this.nextMustSign(Sign.ParenR);
    const node = new ParenExpression(expr.loc.clone(), expr);
    return this.finNode(node);
  }

  parseUnaryExpr() {
    const op = this.lexer.next();
    const arg = this.parseExpr();
    const node = new UnaryExpression(op.loc.clone(), op, arg);
    return this.finNode(node);
  }

  aheadIsEos() {
    const tok = this.lexer.peek();
    return tok.kind === TokKind.EOS;
  }

  parseProg() {
    const loc = this.lexer.loc;
    const node = new Prog(loc, []);
    while (true) {
      if (this.aheadIsEos()) break;
      node.body.push(this.parseStmt());
    }
    return this.finNode(node);
  }

  parseBlockStmt(indent: number) {
    const node = new BlockStatement(this.lexer.loc, []);
    while (true) {
      node.body.push(this.parseStmt(indent));
      if (this.lexer.aheadIsEos()) break;
      const ahead = this.lexer.peek();
      const i = this.xIndent(ahead);
      if (i !== indent) break;
    }
    return this.finNode(node);
  }

  parseStmt(indent: number = 0) {
    const ahead = this.lexer.peek();
    if (ahead.matchKeyword(Keyword.If)) {
      return this.parseIfStmt();
    } else if (ahead.matchKeyword(Keyword.For)) {
      return this.parseForStmt();
    } else if (ahead.matchSign(Sign.BraceL) || ahead.isStr()) {
      return this.parseTextTagStmt();
    }
    return this.parseTagStmt(indent);
  }

  xIndent(ahead: Token) {
    const spaceCnt = ahead.prevSpaceCount;
    if ((~spaceCnt & 1) === 0) this.raiseIndentErr(ahead);
    return spaceCnt / 2;
  }

  assertSubIndent(p: Token, s: Token) {
    const pi = this.xIndent(p);
    const si = this.xIndent(s);
    if (si - pi !== 1) this.raiseIndentErr(s);
  }

  assertIndentEq(a: Token, b: Token) {
    const ai = this.xIndent(a);
    const bi = this.xIndent(b);
    if (ai !== bi) this.raiseIndentErr(b);
  }

  parseIfStmt() {
    // consume `if` or `elf`
    const tok = this.lexer.next();
    const i = this.xIndent(tok);
    const test = this.parseExpr();
    const cons = this.parseBlockStmt(i + 1);
    const node = new IfStatement(tok.loc.clone(), test, cons);

    const ahead = this.lexer.peek();
    if (ahead.matchKeyword(Keyword.Elf)) {
      this.assertIndentEq(tok, ahead);
      node.alt = this.parseIfStmt();
    } else if (ahead.matchKeyword(Keyword.Else)) {
      this.assertIndentEq(tok, ahead);
      this.lexer.next();
      node.alt = this.parseBlockStmt(i + 1);
    }
    return this.finNode(node);
  }

  parseForNameList() {
    const nameList: Identifier[] = [this.parseIdentifier()];
    const tok = this.lexer.peek();
    if (tok.matchSign(Sign.Comma)) {
      this.lexer.next();
      nameList.push(this.parseIdentifier());
    }
    return nameList;
  }

  parseForStmt() {
    // consume `for`
    const tok = this.lexer.next();
    const i = this.xIndent(tok);
    const nameList = this.parseForNameList();
    this.nextMustKeyword(Keyword.In);
    const expr = this.parseExpr();
    const body = this.parseBlockStmt(i + 1);
    const node = new ForStatement(tok.loc.clone(), nameList, expr, body, null);
    const ahead = this.lexer.peek();
    if (ahead.matchKeyword(Keyword.Else)) {
      this.assertIndentEq(tok, ahead);
      this.lexer.next();
      node.alt = this.parseBlockStmt(i + 1);
    }
    return this.finNode(node);
  }

  parseTextTagStmt() {
    const loc = this.lexer.loc;
    const tok = this.lexer.peek();
    let value: Expression;
    if (tok.isStr()) {
      this.lexer.next();
      value = new StringLiteral(tok.loc, tok.value);
    } else {
      this.nextMustSign(Sign.BraceL);
      value = this.parseExpr();
      this.nextMustSign(Sign.BraceR);
    }
    return this.finNode(new TextTagStatement(loc, value));
  }

  parseTagAttrName() {
    const cs = [];
    this.lexer.skipWhitespace();
    const loc = this.lexer.loc;
    while (true) {
      let c = this.lexer.src.peek();
      if (isIdPart(c) || c === "-") cs.push(this.lexer.src.read());
      else break;
    }
    this.lexer.skipWhitespace();
    return this.finNode(new TagAttrName(loc, cs.join("")));
  }

  parseTagAttrValue() {
    const tok = this.lexer.peek();
    if (tok.isStr()) {
      this.lexer.next();
      return new StringLiteral(tok.loc, tok.value);
    }

    this.nextMustSign(Sign.BraceL);
    const node = this.parseExpr();
    this.nextMustSign(Sign.BraceR);
    return this.finNode(node);
  }

  parseTagAttr() {
    const name = this.parseTagAttrName();
    const tok = this.lexer.peek();
    const node = new TagAttr(name.loc.clone(), name, null, true, false);
    if (tok.matchSign(Sign.Assign)) {
      this.lexer.next();
      node.boolean = false;
      node.value = this.parseTagAttrValue();
    } else if (tok.isStr()) {
      node.boolean = false;
      node.value = new StringLiteral(tok.loc, tok.value);
    } else if (tok.matchSign(Sign.BraceL)) {
      node.boolean = false;
      node.value = this.parseTagAttrValue();
    }
    return this.finNode(node);
  }

  checkTagAttrs(tag: TagStatement) {
    const attrs = tag.attrs;
    let textNodeAttr: TagAttr[] = [];
    let posOk = true;
    for (let i = 0, len = attrs.length; i < len; i++) {
      if (attrs[i].name.name === "") {
        textNodeAttr.push(attrs[i]);
        posOk = i == len - 1;
      }
    }
    if (textNodeAttr.length > 1) {
      const pos = textNodeAttr[0].loc.start;
      throw new Error(
        `only one sub-text attribute is permitted at line: ${
          pos.line
        } column: ${pos.column}`
      );
    }
    if (!posOk) {
      const pos = textNodeAttr[0].loc.start;
      throw new Error(
        `sub-text attribute must be the last one at line: ${pos.line} column: ${
          pos.column
        }`
      );
    }
    if (textNodeAttr.length > 0) {
      const attr = textNodeAttr[0];
      tag.attrs = attrs.filter(at => at !== attr);
      const node = new TextTagStatement(attr.loc, attr.value!);
      tag.children.push(node);
    }
  }

  parseTagStmt(indent: number = 0) {
    const loc = this.lexer.loc;
    const name = this.parseIdentifier();
    const tag = new TagStatement(loc, name, [], []);

    while (true) {
      if (this.lexer.isNewlineAhead) break;
      const attr = this.parseTagAttr();
      tag.attrs.push(attr);
    }

    while (true) {
      const ahead = this.lexer.peek();
      const i = this.xIndent(ahead);
      if (i > indent) {
        if (i - indent !== 1) this.raiseIndentErr(ahead);
        tag.children.push(this.parseStmt(i));
      } else break;
    }

    this.checkTagAttrs(tag);
    return this.finNode(tag);
  }
}
