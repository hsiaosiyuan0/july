import * as React from "react";
import * as ReactDOM from "react-dom";
import { jul } from "july";

import { Hello } from "./components/Hello";

console.log(Hello);
ReactDOM.render(jul`Hello`, document.getElementById("app"));
