import { AstVisitor } from "../visitor";
import {
  Prog,
  IfStatement,
  ForStatement,
  BlockStatement,
  TagStatement,
  TextTagStatement,
  Identifier,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
  UndefinedLiteral,
  BinaryExpression,
  UnaryExpression,
  MemberExpression,
  CallExpression,
  ObjectExpression,
  ObjectProperty,
  ParenExpression,
  TernaryExpression,
  TagAttr
} from "../parser/ast";
import { Symtab } from "./symtab";
import * as t from "@babel/types";
import generate from "@babel/generator";
import template from "@babel/template";

export class Codegen extends AstVisitor {
  ast: Prog;
  symtab: Symtab;
  scopeId: number;
  h: string;

  constructor(ast: Prog, symtab: Symtab, h: string = "React.createElement") {
    super();
    this.ast = ast;
    this.symtab = symtab;
    this.h = h;
    this.scopeId = 0;
  }

  enterScope() {
    this.scopeId++;
  }

  leaveScope() {
    this.scopeId--;
  }

  get scope() {
    return this.symtab.scopes.get(this.scopeId)!;
  }

  jsAst() {
    return this.visitProg(this.ast);
  }

  gen() {
    return generate(this.jsAst(), { sourceMaps: true });
  }

  visitProg(node: Prog) {
    this.enterScope();
    if (node.body.length > 1) {
      const line = node.loc.start.line;
      const col = node.loc.start.column;
      throw new Error(
        `only one root element is permitted at line: ${line} column: ${col}`
      );
    }

    const root = node.body[0] ? this.visitStmt(node.body[0]) : t.nullLiteral();
    root.loc = node.loc;
    this.leaveScope();
    return root;
  }

  visitIfStmt(node: IfStatement) {
    const fn = template`july.cond(TEST, CONS, ALT)`;
    const tt = fn({
      TEST: this.visitExpr(node.test),
      CONS: this.visitBlockStmt(node.cons),
      ALT: node.alt ? this.visitStmt(node.alt) : t.nullLiteral()
    });
    const expr = (tt as t.ExpressionStatement).expression;
    expr.loc = node.loc;
    return expr;
  }

  visitForStmt(node: ForStatement) {
    const fn = template`july.each(OBJECT, KV, CB, EMPTY)`;
    const cb = template`(NAME_LIST) => BODY`;

    const cbAst = cb({
      NAME_LIST: node.nameList.map(n => t.identifier(n.name)),
      BODY: this.visitBlockStmt(node.body)
    });
    const fnAst = fn({
      OBJECT: this.visitExpr(node.expr),
      KV: t.booleanLiteral(node.nameList.length > 1),
      CB: (cbAst as t.ExpressionStatement).expression,
      EMPTY: node.alt ? this.visitStmt(node.alt) : t.nullLiteral()
    });
    const expr = (fnAst as t.ExpressionStatement).expression;
    expr.loc = node.loc;
    return expr;
  }

  visitBlockStmt(node: BlockStatement) {
    const b = t.arrayExpression(node.body.map(stmt => this.visitStmt(stmt)));
    b.loc = node.loc;
    return b;
  }

  visitAttrs(attrs: TagAttr[]) {
    const len = attrs.length;
    if (len === 0) return t.nullLiteral();

    const loc = attrs[0].loc.clone();
    loc.end = attrs[len - 1].loc.end.clone();
    const tt = t.objectExpression([]);
    tt.loc = loc;
    for (let i = 0; i < len; i++) {
      const att = attrs[i];
      const key = t.stringLiteral(att.name.name);
      key.loc = att.loc;

      let val: t.Expression;
      if (att.boolean) {
        val = t.booleanLiteral(true);
      } else if (att.computed) {
        val = this.visitExpr(att.value!);
      } else {
        val = t.stringLiteral((att.value as StringLiteral).value);
        val.loc = att.value!.loc;
      }
      tt.properties.push(t.objectProperty(key, val));
    }
    return tt;
  }

  isCustomTag(name: string) {
    return name[0].toUpperCase() === name[0];
  }

  visitTagStmt(node: TagStatement) {
    const fn = template`${this.h}(TAG_NAME, ATTRS, ...july.expand(CHILDREN))`;
    let nameStr = node.name.name;
    let name: t.Expression;
    if (this.isCustomTag(nameStr)) {
      name = t.identifier(node.name.name);
    } else {
      name = t.stringLiteral(node.name.name);
    }
    name.loc = node.name.loc;

    const tt = fn({
      TAG_NAME: name,
      ATTRS: this.visitAttrs(node.attrs),
      CHILDREN: t.arrayExpression(
        node.children.map(child => this.visitStmt(child))
      )
    });
    return (tt as t.ExpressionStatement).expression;
  }

  visitTextTagStmt(node: TextTagStatement) {
    return this.visitExpr(node.value);
  }

  visitIdentifier(node: Identifier) {
    const tt = t.identifier(node.name);
    tt.loc = node.loc;
    return tt;
  }

  visitStringLiteral(node: StringLiteral) {
    const tt = t.stringLiteral(node.value);
    tt.loc = node.loc;
    return tt;
  }

  visitNumberLiteral(node: NumberLiteral) {
    const tt = t.numericLiteral(parseFloat(node.value));
    tt.loc = node.loc;
    return tt;
  }

  visitBooleanLiteral(node: BooleanLiteral) {
    const tt = t.booleanLiteral(node.value === "true");
    tt.loc = node.loc;
    return tt;
  }

  visitNullLiteral(node: NullLiteral) {
    const tt = t.nullLiteral();
    tt.loc = node.loc;
    return tt;
  }

  visitUndefLiteral(node: UndefinedLiteral) {
    const tt = t.identifier("undefined");
    tt.loc = node.loc;
    return tt;
  }

  visitBinaryExpr(node: BinaryExpression) {
    const op = node.op.value as any;
    const left = this.visitExpr(node.left);
    const right = this.visitExpr(node.right);
    const tt = t.binaryExpression(op, left, right);
    tt.loc = node.loc;
    return tt;
  }

  visitUnaryExpr(node: UnaryExpression) {
    const op = node.op.value as any;
    const arg = this.visitExpr(node.arg);
    const tt = t.unaryExpression(op, arg);
    tt.loc = node.loc;
    return tt;
  }

  visitMemberExpr(node: MemberExpression) {
    const obj = this.visitExpr(node.object);
    let prop: t.Expression;
    console.log(node);
    if (node.computed) {
      prop = this.visitExpr(node.property);
    } else {
      prop = t.identifier((node.property as Identifier).name);
      prop.loc = node.property.loc;
    }
    const tt = t.memberExpression(obj, prop, node.computed);
    tt.loc = node.loc;
    return tt;
  }

  visitCallExpr(node: CallExpression) {
    const callee = this.visitExpr(node.callee);
    const args = node.args.map(arg => this.visitExpr(arg));
    const tt = t.callExpression(callee, args);
    tt.loc = node.loc;
    return tt;
  }

  visitObjectExpr(node: ObjectExpression) {
    const props = node.properties.map(prop => this.visitObjectProp(prop));
    const tt = t.objectExpression(props);
    tt.loc = node.loc;
    return tt;
  }

  visitObjectProp(node: ObjectProperty) {
    let key: t.Expression;
    if (node.computed) {
      key = this.visitExpr(node.key);
    } else {
      key = t.identifier((node.key as Identifier).name);
      key.loc = node.key.loc;
    }
    const val = this.visitExpr(node.value);
    const tt = t.objectProperty(key, val, node.computed);
    tt.loc = node.loc;
    return tt;
  }

  visitParenExpr(node: ParenExpression) {
    const tt = t.parenthesizedExpression(this.visitExpr(node.expr));
    tt.loc = node.loc;
    return tt;
  }

  visitTernaryExpr(node: TernaryExpression) {
    const test = this.visitExpr(node.test);
    const cons = this.visitExpr(node.cons);
    const alt = this.visitExpr(node.alt);
    const tt = t.conditionalExpression(test, cons, alt);
    tt.loc = node.loc;
    return tt;
  }
}

export * from "./symtab";
