import {
  parse
} from "./chunk-KAETTJSB.js";
import "./chunk-IHF6WDGJ.js";
import "./chunk-IGGBNASL.js";
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
import {
  selectSvgElement
} from "./chunk-P25FCORJ.js";
import {
  configureSvgSize
} from "./chunk-O47MWUJS.js";
import {
  log
} from "./chunk-NKNNRIVO.js";
import {
  __name
} from "./chunk-JNXZZ3FW.js";
import "./chunk-EQCVQC35.js";

// node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-FWYZ7A6U.mjs
var parser = {
  parse: __name(async (input) => {
    const ast = await parse("info", input);
    log.debug(ast);
  }, "parse")
};
var DEFAULT_INFO_DB = {
  version: "11.16.0" + (true ? "" : "-tiny")
};
var getVersion = __name(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};
var draw = __name((text, id, version) => {
  log.debug("rendering info diagram\n" + text);
  const svg = selectSvgElement(id);
  configureSvgSize(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };
var diagram = {
  parser,
  db,
  renderer
};
export {
  diagram
};
//# sourceMappingURL=infoDiagram-FWYZ7A6U-NWVD6KG7.js.map
