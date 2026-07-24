import {
  AbstractMermaidTokenBuilder,
  AbstractMermaidValueConverter,
  EmptyFileSystem,
  MermaidGeneratedSharedModule,
  RailroadEbnfGrammarGeneratedModule,
  __name,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject
} from "./chunk-F42KLJF2.js";

// node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-U6XO7XAA.mjs
var _a;
var RailroadEbnfTokenBuilder = (_a = class extends AbstractMermaidTokenBuilder {
  constructor() {
    super(["railroad-ebnf-beta"]);
  }
}, __name(_a, "RailroadEbnfTokenBuilder"), _a);
var decodeEscapedString = __name((input) => {
  const content = input.slice(1, -1);
  let value = "";
  for (let index = 0; index < content.length; index++) {
    const character = content[index];
    if (character === "\\" && index + 1 < content.length) {
      index++;
      const escaped = content[index];
      switch (escaped) {
        case "n":
          value += "\n";
          break;
        case "r":
          value += "\r";
          break;
        case "t":
          value += "	";
          break;
        default:
          value += escaped;
      }
      continue;
    }
    value += character;
  }
  return value;
}, "decodeEscapedString");
var _a2;
var RailroadEbnfValueConverter = (_a2 = class extends AbstractMermaidValueConverter {
  runConverter(rule, input, cstNode) {
    const value = super.runConverter(rule, input, cstNode);
    if (rule.name === "TITLE" && typeof value === "string") {
      const trimmedValue = value.trim();
      if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"') || trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) {
        return decodeEscapedString(trimmedValue);
      }
    }
    return value;
  }
  runCustomConverter(rule, input, _cstNode) {
    if (rule.name === "EBNF_STRING") {
      return decodeEscapedString(input);
    }
    if (rule.name === "EBNF_SPECIAL_SEQUENCE") {
      return input.slice(1, -1).trim();
    }
    return void 0;
  }
}, __name(_a2, "RailroadEbnfValueConverter"), _a2);
var RailroadEbnfModule = {
  parser: {
    TokenBuilder: __name(() => new RailroadEbnfTokenBuilder(), "TokenBuilder"),
    ValueConverter: __name(() => new RailroadEbnfValueConverter(), "ValueConverter")
  }
};
function createRailroadEbnfServices(context = EmptyFileSystem) {
  const shared = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const RailroadEbnf = inject(
    createDefaultCoreModule({ shared }),
    RailroadEbnfGrammarGeneratedModule,
    RailroadEbnfModule
  );
  shared.ServiceRegistry.register(RailroadEbnf);
  return { shared, RailroadEbnf };
}
__name(createRailroadEbnfServices, "createRailroadEbnfServices");

export {
  RailroadEbnfModule,
  createRailroadEbnfServices
};
//# sourceMappingURL=chunk-CV6O2YCM.js.map
