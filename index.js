// opencode-team-lead plugin
// Installs the team-lead orchestrator agent and scratchpad compaction hook.

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const TeamLeadPlugin = async ({ directory, worktree }) => {
  // Load the system prompt from the bundled prompt.md
  const promptPath = join(__dirname, "prompt.md");
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

  const projectRoot = worktree || directory;

  return {
    // ── Config hook: inject the team-lead agent ──────────────────────
    config: async (input) => {
      input.agent = input.agent ?? {};

      // Capture any existing user config (e.g. from opencode.json)
      const userConfig = input.agent["team-lead"] ?? {};

      const defaultPermission = {
        "*": "deny",
        todowrite: "allow",
        todoread: "allow",
        skill: "allow",
        task: "allow",
        question: "allow",
        distill: "allow",
        prune: "allow",
        compress: "allow",
        "memoai_*": "allow",
        "sequential-thinking_*": "allow",
        bash: {
          "*": "deny",
          "git status*": "allow",
          "git diff*": "allow",
          "git log*": "allow",
          "git add*": "allow",
          "git commit*": "allow",
          "git push*": "allow",
          "git tag*": "allow",
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
        ...userConfig,
        prompt,
        permission: {
          ...defaultPermission,
          ...userConfig.permission,
        },
      };
    },

    // ── Compaction hook: preserve scratchpad across compactions ───────
    "experimental.session.compacting": async (_input, output) => {
      try {
        const scratchpadPath = join(projectRoot, ".opencode", "scratchpad.md");
        const content = await readFile(scratchpadPath, "utf-8");

        if (!content.trim()) return;

        output.context.push(`## Team-Lead Working Memory (scratchpad)

The following is the team-lead agent's working memory — its scratchpad.
It contains mission state: current objective, execution plan, agent results,
decisions made, and open questions.

You MUST preserve this content verbatim in your compaction output. If space
is constrained, faithfully summarize it, but never drop it silently.

<scratchpad>
${content.trim()}
</scratchpad>`);
      } catch {
        // Scratchpad doesn't exist or isn't readable — skip silently.
      }
    },
  };
};
