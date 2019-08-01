import plugin from "../src";
import * as babel from "@babel/core";

const log = function(stuff: any) {
  if ("transform" in process.env) console.log(stuff);
};

test(`tag statement`, () => {
  const src = `
const students = [{ name: "tom", age: 20 }, { name: "jim", age: 22 }];

function StateLess() {
  return july\`
    div id="app"
      for stu in students
        for k, v in stu
          div {k + ' ' + v}
      else
        span "no student"
    \`;
}
  `;
  const { code } = babel.transform(src, { plugins: [plugin] })!;
  log(code);
});
