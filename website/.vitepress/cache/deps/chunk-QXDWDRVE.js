import {
  AbstractMermaidTokenBuilder,
  CommonValueConverter,
  CynefinGrammarGeneratedModule,
  EmptyFileSystem,
  MermaidGeneratedSharedModule,
  __name,
  createDefaultCoreModule,
  createDefaultSharedCoreModule,
  inject
} from "./chunk-F42KLJF2.js";

// node_modules/@mermaid-js/parser/dist/chunks/mermaid-parser.core/chunk-OSBZ3O6U.mjs
var _a;
var CynefinTokenBuilder = (_a = class extends AbstractMermaidTokenBuilder {
  constructor() {
    super(["cynefin-beta"]);
  }
}, __name(_a, "CynefinTokenBuilder"), _a);
var CynefinModule = {
  parser: {
    TokenBuilder: __name(() => new CynefinTokenBuilder(), "TokenBuilder"),
    ValueConverter: __name(() => new CommonValueConverter(), "ValueConverter")
  }
};
function createCynefinServices(context = EmptyFileSystem) {
  const shared = inject(
    createDefaultSharedCoreModule(context),
    MermaidGeneratedSharedModule
  );
  const Cynefin = inject(
    createDefaultCoreModule({ shared }),
    CynefinGrammarGeneratedModule,
    CynefinModule
  );
  shared.ServiceRegistry.register(Cynefin);
  return { shared, Cynefin };
}
__name(createCynefinServices, "createCynefinServices");

export {
  CynefinModule,
  createCynefinServices
};
//# sourceMappingURL=chunk-QXDWDRVE.js.map
