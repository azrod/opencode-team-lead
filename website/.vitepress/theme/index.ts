import DefaultTheme from "vitepress/theme";
import "./custom.css";
import AgentGraph from "../components/AgentGraph.vue";
import WorkflowDiagram from "../components/WorkflowDiagram.vue";
import ReviewClusterDiagram from "../components/ReviewClusterDiagram.vue";
import type { App } from "vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: App }) {
    app.component("AgentGraph", AgentGraph);
    app.component("WorkflowDiagram", WorkflowDiagram);
    app.component("ReviewClusterDiagram", ReviewClusterDiagram);
  },
};
