import { SourceLoc, Token } from "../lexer";

export enum NodeType {
  Identifier,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
  UndefinedLiteral,
  Prog,
  IfStatement,
  ForStatement,
  BlockStatement,
  TagAttrName,
  TagAttr,
  TagStatement,
  TextTagStatement,
  BinaryExpression,
  UnaryExpression,
  MemberExpression,
  CallExpression,
  ObjectProperty,
  ObjectExpression,
  ParenExpression,
  TernaryExpression
}

export class Node {
  type: NodeType;
  loc: SourceLoc;

  constructor(type: NodeType, loc: SourceLoc) {
    this.type = type;
    this.loc = loc;
  }
}

export class Statement extends Node {}
export class Expression extends Node {}

export class Prog extends Node {
  body: Statement[];

  constructor(loc: SourceLoc, body: Statement[]) {
    super(NodeType.Prog, loc);
    this.body = body;
  }
}

export class Identifier extends Expression {
  name: string;

  constructor(loc: SourceLoc, name: string) {
    super(NodeType.Identifier, loc);
    this.name = name;
  }
}

export class StringLiteral extends Expression {
  value: string;

  constructor(loc: SourceLoc, value: string) {
    super(NodeType.StringLiteral, loc);
    this.value = value;
  }
}

export class NumberLiteral extends Expression {
  value: string;

  constructor(loc: SourceLoc, value: string) {
    super(NodeType.NumberLiteral, loc);
    this.value = value;
  }
}

export class BooleanLiteral extends Expression {
  value: string;

  constructor(loc: SourceLoc, value: string) {
    super(NodeType.BooleanLiteral, loc);
    this.value = value;
  }
}

export class NullLiteral extends Expression {
  value: string;

  constructor(loc: SourceLoc, value: string) {
    super(NodeType.NullLiteral, loc);
    this.value = value;
  }
}

export class UndefinedLiteral extends Expression {
  value: string;

  constructor(loc: SourceLoc, value: string) {
    super(NodeType.UndefinedLiteral, loc);
    this.value = value;
  }
}

export class BinaryExpression extends Expression {
  op: Token;
  left: Expression;
  right: Expression;

  constructor(loc: SourceLoc, op: Token, left: Expression, right: Expression) {
    super(NodeType.BinaryExpression, loc);
    this.op = op;
    this.left = left;
    this.right = right;
  }
}

export class UnaryExpression extends Expression {
  op: Token;
  arg: Expression;

  constructor(loc: SourceLoc, op: Token, arg: Expression) {
    super(NodeType.UnaryExpression, loc);
    this.op = op;
    this.arg = arg;
  }
}

export class MemberExpression extends Expression {
  object: Expression;
  property: Expression;
  computed: boolean;

  constructor(
    loc: SourceLoc,
    object: Expression,
    property: Expression,
    computed: boolean
  ) {
    super(NodeType.MemberExpression, loc);
    this.object = object;
    this.property = property;
    this.computed = computed;
  }
}

export class CallExpression extends Expression {
  callee: Expression;
  args: Expression[];

  constructor(loc: SourceLoc, callee: Expression, args: Expression[]) {
    super(NodeType.CallExpression, loc);
    this.callee = callee;
    this.args = args;
  }
}

export class ObjectProperty extends Node {
  key: Expression;
  value: Expression;
  computed: boolean;

  constructor(
    loc: SourceLoc,
    key: Expression,
    value: Expression,
    computed: boolean
  ) {
    super(NodeType.ObjectProperty, loc);
    this.key = key;
    this.value = value;
    this.computed = computed;
  }
}

export class ObjectExpression extends Expression {
  properties: ObjectProperty[];

  constructor(loc: SourceLoc, properties: ObjectProperty[]) {
    super(NodeType.ObjectExpression, loc);
    this.properties = properties;
  }
}

export class ParenExpression extends Expression {
  expr: Expression;

  constructor(loc: SourceLoc, expr: Expression) {
    super(NodeType.ObjectExpression, loc);
    this.expr = expr;
  }
}

export class TernaryExpression extends Expression {
  test: Expression;
  cons: Expression;
  alt: Expression;

  constructor(
    loc: SourceLoc,
    test: Expression,
    cons: Expression,
    alt: Expression
  ) {
    super(NodeType.TernaryExpression, loc);
    this.test = test;
    this.cons = cons;
    this.alt = alt;
  }
}

export class BlockStatement extends Statement {
  body: Statement[];

  constructor(loc: SourceLoc, body: Statement[]) {
    super(NodeType.BlockStatement, loc);
    this.body = body;
  }
}

export class IfStatement extends Statement {
  test: Expression;
  cons: BlockStatement;
  alt: Statement | null;

  constructor(
    loc: SourceLoc,
    test: Expression,
    cons: BlockStatement,
    alt: Statement | null = null
  ) {
    super(NodeType.IfStatement, loc);
    this.test = test;
    this.cons = cons;
    this.alt = alt;
  }
}

export class ForStatement extends Statement {
  nameList: Identifier[];
  expr: Expression;
  body: BlockStatement;
  alt: Statement | null;

  constructor(
    loc: SourceLoc,
    nameList: Identifier[],
    expr: Expression,
    body: BlockStatement,
    alt: Statement | null
  ) {
    super(NodeType.ForStatement, loc);
    this.nameList = nameList;
    this.expr = expr;
    this.body = body;
    this.alt = alt;
  }
}

export class TagAttrName extends Node {
  name: string;

  constructor(loc: SourceLoc, name: string) {
    super(NodeType.TagAttrName, loc);
    this.name = name;
  }
}

export class TagAttr extends Node {
  name: TagAttrName;
  value: Expression | null;
  boolean: boolean;
  computed: boolean;

  constructor(
    loc: SourceLoc,
    name: TagAttrName,
    value: Expression | null = null,
    boolean: boolean,
    computed: boolean
  ) {
    super(NodeType.TagAttr, loc);
    this.name = name;
    this.value = value;
    this.boolean = boolean;
    this.computed = computed;
  }
}

export class TagStatement extends Statement {
  name: Identifier;
  attrs: TagAttr[];
  children: Statement[];

  constructor(
    loc: SourceLoc,
    name: TagAttrName,
    attrs: TagAttr[],
    children: Statement[]
  ) {
    super(NodeType.TagStatement, loc);
    this.name = name;
    this.attrs = attrs;
    this.children = children;
  }
}

export class TextTagStatement extends Statement {
  value: Expression;

  constructor(loc: SourceLoc, value: Expression) {
    super(NodeType.TextTagStatement, loc);
    this.value = value;
  }
}
