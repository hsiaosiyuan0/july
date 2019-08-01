export * from "./lexer";
export * from "./parser";
export * from "./codegen";

declare global {
  function jul(strings: TemplateStringsArray): JSX.Element;
  function july(strings: TemplateStringsArray): JSX.Element;
}
