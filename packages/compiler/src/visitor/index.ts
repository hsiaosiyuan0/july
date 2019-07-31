import {
  Prog,
  IfStatement,
  ForStatement,
  BlockStatement,
  TagStatement,
  TextTagStatement,
  Statement,
  NodeType,
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
  Expression
} from "../parser/ast";

export abstract class AstVisitor {
  abstract visitProp(node: Prog): any;
  abstract visitIfStmt(node: IfStatement): any;
  abstract visitForStmt(node: ForStatement): any;
  abstract visitBlockStmt(node: BlockStatement): any;
  abstract visitTagStmt(node: TagStatement): any;
  abstract visitTextTagStmt(node: TextTagStatement): any;

  visitStmt(stmt: Statement) {
    switch (stmt.type) {
      case NodeType.IfStatement:
        return this.visitIfStmt(stmt as any);
      case NodeType.ForStatement:
        return this.visitForStmt(stmt as any);
      case NodeType.BlockStatement:
        return this.visitBlockStmt(stmt as any);
      case NodeType.TagStatement:
        return this.visitTagStmt(stmt as any);
      case NodeType.TextTagStatement:
        return this.visitTextTagStmt(stmt as any);
    }
  }

  abstract visitIdentifier(node: Identifier): any;
  abstract visitStringLiteral(node: StringLiteral): any;
  abstract visitNumberLiteral(node: NumberLiteral): any;
  abstract visitBooleanLiteral(node: BooleanLiteral): any;
  abstract visitNullLiteral(node: NullLiteral): any;
  abstract visitUndefLiteral(node: UndefinedLiteral): any;
  abstract visitBinaryExpr(node: BinaryExpression): any;
  abstract visitUnaryExpr(node: UnaryExpression): any;
  abstract visitMemberExpr(node: MemberExpression): any;
  abstract visitCallExpr(node: CallExpression): any;
  abstract visitObjectExpr(node: ObjectExpression): any;
  abstract visitObjectProp(node: ObjectProperty): any;
  abstract visitParenExpr(node: ParenExpression): any;
  abstract visitTernaryExpr(node: TernaryExpression): any;

  visitExpr(expr: Expression) {
    switch (expr.type) {
      case NodeType.Identifier:
        return this.visitIdentifier(expr as any);
      case NodeType.StringLiteral:
        return this.visitStringLiteral(expr as any);
      case NodeType.NumberLiteral:
        return this.visitNumberLiteral(expr as any);
      case NodeType.BooleanLiteral:
        return this.visitBooleanLiteral(expr as any);
      case NodeType.NullLiteral:
        return this.visitNullLiteral(expr as any);
      case NodeType.UndefinedLiteral:
        return this.visitUndefLiteral(expr as any);
      case NodeType.BinaryExpression:
        return this.visitBinaryExpr(expr as any);
      case NodeType.UnaryExpression:
        return this.visitBinaryExpr(expr as any);
      case NodeType.MemberExpression:
        return this.visitMemberExpr(expr as any);
      case NodeType.CallExpression:
        return this.visitCallExpr(expr as any);
      case NodeType.ObjectExpression:
        return this.visitObjectExpr(expr as any);
      case NodeType.ParenExpression:
        return this.visitParenExpr(expr as any);
      case NodeType.TernaryExpression:
        return this.visitTernaryExpr(expr as any);
    }
  }
}
