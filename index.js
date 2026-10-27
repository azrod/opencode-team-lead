// OpenCode V2 plugin. All registrations are scoped to this location's runtime.
import { Plugin } from "@opencode/plugin";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SUBAGENT_DEFS, loadAgentPrompt, registerSubagent } from "./config/agents.js";
import { buildToolRegistry } from "./tools/registry.js";
import { checkArtifactAccess, LIFECYCLE_TOOLS } from "./tools/artifact-guard.js";

const packageDirectory = dirname(fileURLToPath(import.meta.url));

export default Plugin.define({
  id: "opencode-team-lead",
  async setup(ctx) {
    const options = ctx.options ?? {};
    const root = resolve(ctx.location.directory);
    const paths = Object.freeze(Object.fromEntries(
      Object.entries({ specs: "docs/specs", execPlans: "docs/exec-plans", briefs: "docs/briefs" })
        .map(([key, fallback]) => {
          const value = options.paths?.[key] ?? fallback;
          if (typeof value !== "string" || !value.trim()) {
            throw new Error(`[opencode-team-lead] paths.${key} must be a non-empty string`);
          }
          return [key, value];
        }),
    ));
    const definitions = [
      {
        id: "team-lead", file: "prompt.md", mode: "all", color: "#ef4444",
        description: "Delegation-only team lead. Plans work, delegates implementation, and orchestrates reviews.",
        request: { body: { temperature: 0.3 } },
        permissions: [
          ...["todowrite", "skill", "subagent", "question", "read", ...LIFECYCLE_TOOLS]
            .map((action) => ({ action, resource: "*", effect: "allow" })),
          { action: "edit", resource: "docs/*", effect: "allow" },
          ...["git *", "ls *", "head *", "echo *"].map((resource) => ({ action: "shell", resource, effect: "allow" })),
          { action: "shell", resource: "git push *", effect: "ask" },
        ],
      },
      ...SUBAGENT_DEFS,
    ];
    const prompts = await Promise.all(definitions.map((def) => loadAgentPrompt(def.id, def.file)));
    if (prompts.some((prompt) => prompt === null)) {
      throw new Error("[opencode-team-lead] A required agent prompt could not be loaded");
    }
    const skillPath = join(packageDirectory, "skills/spec-writer/SKILL.md");
    const skillFile = await readFile(skillPath, "utf-8");
    const skillContent = skillFile.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();

    await ctx.agent.transform((editor) => {
      definitions.forEach((def, index) => registerSubagent(editor, def, prompts[index], options));
    });
    await ctx.skill.transform((editor) => {
      if (editor.get("spec-writer")) return;
      editor.add({
        id: "spec-writer", name: "Spec Writer", path: skillPath,
        description: "Templates, examples, and validation checklists for writing agent specifications.",
        content: skillContent,
      });
    });

    // Agent request.body is not dispatched by the V2 runner yet. Apply only the
    // plugin agents' temperature through the supported model-context hook.
    await ctx.session.hook("context", async (event) => {
      if (!definitions.some((def) => def.id === event.agent)) return;
      const { data: agent } = await ctx.agent.get({ agentID: event.agent });
      const temperature = agent.request?.body?.temperature;
      if (typeof temperature === "number") event.options.temperature ??= temperature;
    });

    const registry = buildToolRegistry(root, paths, ctx.permission);
    await ctx.tool.transform((editor) => {
      Object.values(registry).forEach((tool) => editor.add(tool));
    });
    await ctx.tool.hook("execute.before", async (event) => {
      // Hooks can observe sessions outside their loading location. Resolve the
      // actual session instead of accidentally protecting another worktree.
      const session = await ctx.session.get({ sessionID: event.sessionID });
      const directory = resolve(session.location.directory);
      if (directory !== root) {
        if (LIFECYCLE_TOOLS.has(event.tool)) {
          throw new Error("Lifecycle tools cannot access a different location; reload the plugin in that location.");
        }
        return;
      }
      const err = checkArtifactAccess(
        { tool: event.tool, args: event.input }, Object.values(paths), root,
      );
      if (err) throw err;
    });
  },
});
