import { AstVisitor } from "../visitor";

import {
  Identifier,
  Prog,
  IfStatement,
  TagStatement,
  ForStatement,
  BlockStatement,
  TextTagStatement,
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
  TernaryExpression
} from "../parser/ast";

export type Scope = Set<string>;
export type BindingResolver = (id: string) => boolean;

// not only build the symbol table but also check whether the bindings are valid
export class Symtab extends AstVisitor {
  i: number;
  scopes: Map<number, Scope>;
  scope?: Scope;
  bindingResolver: BindingResolver;

  constructor(bindingResolver: BindingResolver) {
    super();
    this.i = 0;
    this.scopes = new Map();
    this.bindingResolver = bindingResolver;
  }

  enterScope() {
    this.scope = new Set();
    this.scopes.set(this.i++, this.scope);
  }

  leaveScope() {
    const i = this.i - 1;
    this.scope = this.scopes.get(i);
  }

  visitProp(node: Prog) {
    this.enterScope();
    node.body.forEach(stmt => this.visitStmt(stmt));
    this.leaveScope();
  }

  visitIfStmt(node: IfStatement) {
    this.visitExpr(node.test);
    this.visitStmt(node.cons);
    if (node.alt) this.visitStmt(node.alt);
  }

  visitForStmt(node: ForStatement) {
    this.visitExpr(node.expr);
    this.enterScope();
    node.nameList.forEach(name => this.scope!.add(name.name));
    this.visitStmt(node.body);
    this.leaveScope();
    if (node.alt) this.visitStmt(node.alt);
  }

  visitBlockStmt(node: BlockStatement) {
    node.body.forEach(stmt => this.visitStmt(stmt));
  }

  assertBindingExist(id: Identifier) {
    const name = id.name;
    if (this.scope!.has(name)) return;
    if (!this.bindingResolver(name)) {
      const pos = id.loc.start;
      throw new Error(
        `ReferenceError: ${name} is not defined at ${pos.line}:${pos.column}`
      );
    }
  }

  isCustomTag(name: string) {
    const c = name[0];
    return c.toUpperCase() === c;
  }

  visitTagStmt(node: TagStatement) {
    if (this.isCustomTag(node.name.name)) this.assertBindingExist(node.name);

    node.attrs.forEach(attr => {
      if (attr.boolean) return;
      if (!attr.computed) return;
      if (attr.value) this.visitExpr(attr.value);
    });

    node.children.forEach(child => this.visitStmt(child));
  }

  visitTextTagStmt(node: TextTagStatement) {
    this.visitExpr(node.value);
  }

  visitIdentifier(node: Identifier) {
    this.assertBindingExist(node);
  }

  visitStringLiteral(_node: StringLiteral) {}

  visitNumberLiteral(_node: NumberLiteral) {}

  visitBooleanLiteral(_node: BooleanLiteral) {}

  visitNullLiteral(_node: NullLiteral) {}

  visitUndefLiteral(_node: UndefinedLiteral) {}

  visitBinaryExpr(node: BinaryExpression) {
    this.visitExpr(node.left);
    this.visitExpr(node.right);
  }

  visitUnaryExpr(node: UnaryExpression) {
    this.visitExpr(node.arg);
  }

  visitMemberExpr(node: MemberExpression) {
    this.visitExpr(node.object);
    if (node.computed) this.visitExpr(node.property);
  }

  visitCallExpr(node: CallExpression) {
    this.visitExpr(node.callee);
    node.args.forEach(arg => this.visitExpr(arg));
  }

  visitObjectExpr(node: ObjectExpression) {
    node.properties.forEach(prop => this.visitObjectProp(prop));
  }

  visitObjectProp(node: ObjectProperty) {
    if (node.computed) this.visitExpr(node.key);
    this.visitExpr(node.value);
  }

  visitParenExpr(node: ParenExpression) {
    this.visitExpr(node.expr);
  }

  visitTernaryExpr(node: TernaryExpression) {
    this.visitExpr(node.test);
    this.visitExpr(node.cons);
    this.visitExpr(node.alt);
  }
}
