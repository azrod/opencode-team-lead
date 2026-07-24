import {
  db,
  getStyles,
  renderer
} from "./chunk-GPHFI3VA.js";
import {
  populateCommonDb
} from "./chunk-UOR73F4S.js";
import {
  MermaidParseError
} from "./chunk-KAETTJSB.js";
import "./chunk-IHF6WDGJ.js";
import {
  createRailroadServices
} from "./chunk-IGGBNASL.js";
import "./chunk-CV6O2YCM.js";
import "./chunk-XWUDP47R.js";
import "./chunk-PTO2PV5G.js";
import "./chunk-TPUE2OW3.js";
import "./chunk-RZWUHOZI.js";
import "./chunk-QXDWDRVE.js";
import "./chunk-PFNTYPEC.js";
import "./chunk-DUYZO2IP.js";
import "./chunk-JUWRR6Z5.js";
import "./chunk-AUBI2UJJ.js";
import "./chunk-6U2Y5TX5.js";
import "./chunk-2L5Q3DTW.js";
import "./chunk-57RL5M25.js";
import "./chunk-F42KLJF2.js";
import "./chunk-P25FCORJ.js";
import "./chunk-O47MWUJS.js";
import {
  log
} from "./chunk-NKNNRIVO.js";
import {
  __name
} from "./chunk-JNXZZ3FW.js";
import "./chunk-EQCVQC35.js";

// node_modules/mermaid/dist/chunks/mermaid.core/railroadDiagram-RFXS5EU6.mjs
var langiumParser = createRailroadServices().Railroad.parser.LangiumParser;
var transformExpression = __name((expr) => {
  switch (expr.$type) {
    case "RailroadTerminalExpr":
      return {
        type: "terminal",
        value: expr.value
      };
    case "RailroadNonTerminalExpr":
      return {
        type: "nonterminal",
        name: expr.name
      };
    case "RailroadSpecialExpr":
      return {
        type: "special",
        text: expr.text
      };
    case "RailroadSequenceExpr": {
      const elements = expr.elements.map(transformExpression);
      return elements.length === 1 ? elements[0] : { type: "sequence", elements };
    }
    case "RailroadChoiceExpr": {
      const alternatives = expr.alternatives.map(transformExpression);
      return alternatives.length === 1 ? alternatives[0] : { type: "choice", alternatives };
    }
    case "RailroadOptionalExpr":
      return {
        type: "optional",
        element: transformExpression(expr.element)
      };
    case "RailroadOneOrMoreExpr":
      return {
        type: "repetition",
        element: transformExpression(expr.element),
        min: 1,
        max: Infinity
      };
    case "RailroadZeroOrMoreExpr":
      return {
        type: "repetition",
        element: transformExpression(expr.element),
        min: 0,
        max: Infinity
      };
    default:
      throw new Error(`Unsupported railroad expression: ${expr.$type}`);
  }
}, "transformExpression");
var transformRule = __name((rule) => {
  return {
    name: rule.name,
    definition: transformExpression(rule.definition)
  };
}, "transformRule");
var populateDb = __name((ast) => {
  populateCommonDb(ast, db);
  if (ast.title) {
    db.setTitle(ast.title);
  }
  ast.rules.map((rule) => db.addRule(transformRule(rule)));
}, "populateDb");
var parser = {
  parse: __name((input) => {
    db.clear();
    log.debug("[Railroad Parser] Starting Langium parse");
    const result = langiumParser.parse(input);
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
      throw new MermaidParseError(result);
    }
    const ast = result.value;
    log.debug("[Railroad Parser] Parsed rules:", ast.rules.length);
    populateDb(ast);
    log.debug("[Railroad Parser] Parse complete");
  }, "parse"),
  parser: {
    yy: db
  }
};
var diagram = {
  parser,
  db,
  renderer,
  styles: getStyles
};
var railroadDiagram_default = diagram;
export {
  railroadDiagram_default as default,
  diagram
};
//# sourceMappingURL=railroadDiagram-RFXS5EU6-6OLEEDPA.js.map
