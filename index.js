// opencode-team-lead plugin
// Installs the team-lead orchestrator agent and its specialized sub-agents.

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GLOBAL_AGENTS_CONTENT,
  SUBAGENT_DEFS,
  mergePermissions,
  loadAgentPrompt,
  registerSubagent,
} from "./config/agents.js";
import { buildToolRegistry } from "./tools/registry.js";
import { checkArtifactAccess } from "./tools/artifact-guard.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const TeamLeadPlugin = async ({ directory, worktree }) => {
  const promptPath = join(__dirname, "agents", "prompt.md");
  let prompt;
  try {
    prompt = await readFile(promptPath, "utf-8");
  } catch (err) {
    console.error(
      `[opencode-team-lead] Failed to load prompt.md at ${promptPath}:`,
      err.message,
    );
    return {};
  }

  // Prompts loaded once at init — not reloaded on each config hook call.
  const subagentPrompts = await Promise.all(
    SUBAGENT_DEFS.map((def) => loadAgentPrompt(def.id, def.file, def.silent ?? false)),
  );

  // OpenCode sometimes passes worktree="/" (filesystem root) when no git worktree is detected.
  // In that case, fall back to directory which is always the actual project path.
  const projectRoot = (worktree && worktree !== "/") ? worktree : (directory ?? ".");

  // Resolved once during the config hook and captured in closure for tool handlers.
  let paths = {
    specs: "docs/specs",
    execPlans: "docs/exec-plans",
    briefs: "docs/briefs",
  };

  return {
    // ── Config hook: inject the team-lead agent ──────────────────────
    config: async (input) => {
      input.agent = input.agent ?? {};

      const userConfig = input.agent["team-lead"] ?? {};
      const { soul, ...userConfigRest } = userConfig;

      // Resolve artifact paths from user config (with defaults).
      const userPaths = userConfig.paths ?? {};
      paths = {
        specs: userPaths.specs ?? "docs/specs",
        execPlans: userPaths.execPlans ?? "docs/exec-plans",
        briefs: userPaths.briefs ?? "docs/briefs",
      };

      const teamLeadPrompt = soul === false
        ? prompt
        : `${prompt}\n\nInstructions from: ~/.config/opencode/AGENTS.md\n${GLOBAL_AGENTS_CONTENT}`;

      const defaultPermission = {
        "*": "deny",
        todowrite: "allow",
        todoread: "allow",
        skill: "allow",
        task: "allow",
        question: "allow",
        compress: "allow",
        project_state: "allow",
        spec_get: "allow",
        spec_create: "allow",
        spec_update: "allow",
        spec_validate: "allow",
        spec_list: "allow",
        spec_delete: "allow",
        spec_format: "allow",
        plan_get: "allow",
        plan_create: "allow",
        plan_update: "allow",
        plan_validate: "allow",
        plan_block_done: "allow",
        plan_list: "allow",
        plan_delete: "allow",
        plan_format: "allow",
        brief_get: "allow",
        brief_create: "allow",
        brief_update: "allow",
        brief_delete: "allow",
        brief_list: "allow",
        read: "allow",
        edit: {
          "*": "deny",
          "**/docs/**": "allow",
        },
        write: {
          "*": "deny",
          "**/docs/**": "allow",
        },
        bash: {
          "*": "deny",
          "git *": "allow",
          "git push *": "ask",
          "ls *": "allow",
          "ls": "allow",
          "head *": "allow",
          "echo *": "allow",
        },
      };

      input.agent["team-lead"] = {
        description:
          "Strict delegation-only team lead. Understands requests, breaks them into tasks, " +
          "delegates ALL work to specialized agents, and synthesizes results. " +
          "NEVER reads, edits, or analyzes code directly.",
        temperature: 0.3,
        variant: "max",
        mode: "all",
        color: "error",
        ...userConfigRest,
        prompt: teamLeadPrompt,
        permission: mergePermissions(defaultPermission, userConfigRest.permission),
      };

      const subagentUserConfigs = SUBAGENT_DEFS.map((def) => input.agent[def.id] ?? {});
      for (let i = 0; i < SUBAGENT_DEFS.length; i++) {
        if (subagentPrompts[i]) {
          registerSubagent(input, SUBAGENT_DEFS[i], subagentPrompts[i], subagentUserConfigs[i]);
        }
      }
    },

    // ── Tool hook: lifecycle bookkeeping tools ────────────────────────
    tool: buildToolRegistry(projectRoot, paths),

    // ── Tool execute before hook: protect artifact directories ───────
    "tool.execute.before": async ({ tool: toolName, args }) => {
      const protectedDirs = [paths.specs, paths.execPlans, paths.briefs];
      const err = checkArtifactAccess({ tool: toolName, args }, protectedDirs);
      if (err) throw err;
    },
  };
};
