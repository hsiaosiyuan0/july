import React from "react";
import "./App.css";
import "july";

const students = [{ name: "tom", age: 20 }, { name: "jim", age: 22 }];

const App: React.FC = () => {
  return july`
  div
    span "hello from July"
  `;
};

export default App;
