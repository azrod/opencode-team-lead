import {
  __name
} from "./chunk-F42KLJF2.js";

// node_modules/@mermaid-js/parser/dist/mermaid-parser.core.mjs
var parsers = {};
var initializers = {
  info: __name(async () => {
    const { createInfoServices: createInfoServices2 } = await import("./info-DKCQHKI2-AOTFBAZX.js");
    const parser = createInfoServices2().Info.parser.LangiumParser;
    parsers.info = parser;
  }, "info"),
  packet: __name(async () => {
    const { createPacketServices: createPacketServices2 } = await import("./packet-7NZHBO7P-XLIOSP7N.js");
    const parser = createPacketServices2().Packet.parser.LangiumParser;
    parsers.packet = parser;
  }, "packet"),
  pie: __name(async () => {
    const { createPieServices: createPieServices2 } = await import("./pie-RZYD4A2V-ZCAPA7Z2.js");
    const parser = createPieServices2().Pie.parser.LangiumParser;
    parsers.pie = parser;
  }, "pie"),
  treeView: __name(async () => {
    const { createTreeViewServices: createTreeViewServices2 } = await import("./treeView-QDETBFTQ-2S3W6G7I.js");
    const parser = createTreeViewServices2().TreeView.parser.LangiumParser;
    parsers.treeView = parser;
  }, "treeView"),
  architecture: __name(async () => {
    const { createArchitectureServices: createArchitectureServices2 } = await import("./architecture-TIHT7OUA-VZ23XLXL.js");
    const parser = createArchitectureServices2().Architecture.parser.LangiumParser;
    parsers.architecture = parser;
  }, "architecture"),
  gitGraph: __name(async () => {
    const { createGitGraphServices: createGitGraphServices2 } = await import("./gitGraph-TEB2WS4Q-K3FL3VAH.js");
    const parser = createGitGraphServices2().GitGraph.parser.LangiumParser;
    parsers.gitGraph = parser;
  }, "gitGraph"),
  eventmodeling: __name(async () => {
    const { createEventModelingServices: createEventModelingServices2 } = await import("./eventmodeling-45OFAUF4-7BBVURYD.js");
    const parser = createEventModelingServices2().EventModel.parser.LangiumParser;
    parsers.eventmodeling = parser;
  }, "eventmodeling"),
  radar: __name(async () => {
    const { createRadarServices: createRadarServices2 } = await import("./radar-I7S5WNFK-BXOZL7LE.js");
    const parser = createRadarServices2().Radar.parser.LangiumParser;
    parsers.radar = parser;
  }, "radar"),
  railroad: __name(async () => {
    const { createRailroadServices: createRailroadServices2 } = await import("./railroad-3IZDKUUU-I3VVMOQU.js");
    const parser = createRailroadServices2().Railroad.parser.LangiumParser;
    parsers.railroad = parser;
  }, "railroad"),
  railroadEbnf: __name(async () => {
    const { createRailroadEbnfServices: createRailroadEbnfServices2 } = await import("./railroad-ebnf-EBAXGLYW-ISOMDKP4.js");
    const parser = createRailroadEbnfServices2().RailroadEbnf.parser.LangiumParser;
    parsers.railroadEbnf = parser;
  }, "railroadEbnf"),
  railroadAbnf: __name(async () => {
    const { createRailroadAbnfServices: createRailroadAbnfServices2 } = await import("./railroad-abnf-AHOZXSZD-WQFRSP3P.js");
    const parser = createRailroadAbnfServices2().RailroadAbnf.parser.LangiumParser;
    parsers.railroadAbnf = parser;
  }, "railroadAbnf"),
  railroadPeg: __name(async () => {
    const { createRailroadPegServices: createRailroadPegServices2 } = await import("./railroad-peg-LSFZ7HO6-FTNMPFQI.js");
    const parser = createRailroadPegServices2().RailroadPeg.parser.LangiumParser;
    parsers.railroadPeg = parser;
  }, "railroadPeg"),
  treemap: __name(async () => {
    const { createTreemapServices: createTreemapServices2 } = await import("./treemap-6X3UGDF4-RPYZL5PJ.js");
    const parser = createTreemapServices2().Treemap.parser.LangiumParser;
    parsers.treemap = parser;
  }, "treemap"),
  wardley: __name(async () => {
    const { createWardleyServices: createWardleyServices2 } = await import("./wardley-OPB4EBWU-6PJHZMBD.js");
    const parser = createWardleyServices2().Wardley.parser.LangiumParser;
    parsers.wardley = parser;
  }, "wardley"),
  cynefin: __name(async () => {
    const { createCynefinServices: createCynefinServices2 } = await import("./cynefin-VYW2F7L2-5JFGTNVW.js");
    const parser = createCynefinServices2().Cynefin.parser.LangiumParser;
    parsers.cynefin = parser;
  }, "cynefin")
};
async function parse(diagramType, text) {
  const initializer = initializers[diagramType];
  if (!initializer) {
    throw new Error(`Unknown diagram type: ${diagramType}`);
  }
  if (!parsers[diagramType]) {
    await initializer();
  }
  const parser = parsers[diagramType];
  const result = parser.parse(text);
  if (result.lexerErrors.length > 0 || result.parserErrors.length > 0) {
    throw new MermaidParseError(result);
  }
  return result.value;
}
__name(parse, "parse");
var _a;
var MermaidParseError = (_a = class extends Error {
  constructor(result) {
    const lexerErrors = result.lexerErrors.map((err) => {
      const line = err.line !== void 0 && !isNaN(err.line) ? err.line : "?";
      const column = err.column !== void 0 && !isNaN(err.column) ? err.column : "?";
      return `Lexer error on line ${line}, column ${column}: ${err.message}`;
    }).join("\n");
    const parserErrors = result.parserErrors.map((err) => {
      const line = err.token.startLine !== void 0 && !isNaN(err.token.startLine) ? err.token.startLine : "?";
      const column = err.token.startColumn !== void 0 && !isNaN(err.token.startColumn) ? err.token.startColumn : "?";
      return `Parse error on line ${line}, column ${column}: ${err.message}`;
    }).join("\n");
    super(`Parsing failed: ${lexerErrors} ${parserErrors}`);
    this.result = result;
  }
}, __name(_a, "MermaidParseError"), _a);

export {
  parse,
  MermaidParseError
};
//# sourceMappingURL=chunk-KAETTJSB.js.map
