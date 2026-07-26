import { defineConfig } from "vitepress";
import llmstxt from "vitepress-plugin-llms";

export default defineConfig({
  title: "opencode-team-lead",

  vite: {
    ssr: {
      noExternal: ["@vue-flow/core"],
    },
    plugins: [
      llmstxt({
        domain: "https://azrod.github.io",
        generateLLMsFullTxt: true,
        generateLLMsTxt: true,
        generateLLMFriendlyDocsForEachPage: true,
        excludeUnnecessaryFiles: true,
      }),
    ],
  },

  description: "Team-lead orchestrator agent for OpenCode",
  base: "/opencode-team-lead/",
  head: [
    [
      "link",
      {
        rel: "alternate",
        type: "text/plain",
        title: "LLM-friendly documentation",
        href: "https://azrod.github.io/opencode-team-lead/llms.txt",
      },
    ],
  ],
  cleanUrls: true,

  markdown: {
    lineNumbers: true,
  },

  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "opencode-team-lead",

    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "Agents", link: "/agents/" },
      { text: "Changelog", link: "/changelog" },
      {
        text: "GitHub",
        link: "https://github.com/azrod/opencode-team-lead",
      },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [{ text: "Getting Started", link: "/getting-started" }],
      },
      {
        text: "Agents",
        collapsed: false,
        items: [
          { text: "Overview", link: "/agents/" },
          { text: "team-lead — Orchestrator", link: "/agents/team-lead" },
          { text: "Review Cluster", link: "/agents/review-cluster" },
          { text: "Brainstorm", link: "/agents/brainstorm" },
          { text: "Bug-Finder", link: "/agents/bug-finder" },
          { text: "Harness", link: "/agents/harness" },
          { text: "Planning", link: "/agents/planning" },
          { text: "Gardener", link: "/agents/gardener" },
          { text: "Researcher", link: "/agents/researcher" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Lifecycle Tools", link: "/lifecycle-tools" },
          { text: "Architecture", link: "/architecture" },
          { text: "Decisions & ADRs", link: "/decisions" },
          { text: "Guiding Principles", link: "/principles" },
        ],
      },
      {
        text: "About",
        items: [
          { text: "Changelog", link: "/changelog" },
          { text: "LLM-friendly docs", link: "https://azrod.github.io/opencode-team-lead/llms.txt" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/azrod/opencode-team-lead",
      },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 azrod",
    },

    editLink: {
      pattern:
        "https://github.com/azrod/opencode-team-lead/edit/main/website/:path",
      text: "Edit this page on GitHub",
    },

    search: {
      provider: "local",
    },
  },
});
