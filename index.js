// opencode-team-lead plugin
// Installs the team-lead orchestrator agent and scratchpad compaction hook.

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * One-level-deep permission merge.
 * For each key in `overrides`, if both sides are plain objects, shallow-merge
 * them so nested tool maps (bash, read, edit, write, …) are combined rather
 * than replaced. For any other value type the override wins outright.
 *
 * @param {Record<string, unknown>} defaults
 * @param {Record<string, unknown> | null | undefined} overrides
 * @returns {Record<string, unknown>}
 */
function mergePermissions(defaults, overrides) {
  if (!overrides || typeof overrides !== "object") return { ...defaults };
  const result = { ...defaults };
  for (const [key, override] of Object.entries(overrides)) {
    const base = result[key];
    if (
      base !== null &&
      typeof base === "object" &&
      !Array.isArray(base) &&
      override !== null &&
      typeof override === "object" &&
      !Array.isArray(override)
    ) {
      result[key] = { ...base, ...override };
    } else {
      if (
        Array.isArray(override) &&
        base !== null &&
        typeof base === "object" &&
        !Array.isArray(base)
      ) {
        console.warn(
          `[opencode-team-lead] permission key "${key}" received an array override — expected an object. Plugin defaults for this key have been dropped.`
        );
      }
      result[key] = override;
    }
  }
  return result;
}

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

  // Load the review-manager prompt from the bundled review-manager.md
  const reviewManagerPromptPath = join(__dirname, "review-manager.md");
  let reviewManagerPrompt;
  try {
    reviewManagerPrompt = await readFile(reviewManagerPromptPath, "utf-8");
  } catch (err) {
    console.error(
      `[opencode-team-lead] Failed to load review-manager.md at ${reviewManagerPromptPath}:`,
      err.message,
    );
    // Don't return early — team-lead can still work without review-manager
    reviewManagerPrompt = null;
  }

  // Load the requirements-reviewer prompt from the bundled requirements-reviewer.md
  const requirementsReviewerPromptPath = join(__dirname, "requirements-reviewer.md");
  let requirementsReviewerPrompt;
  try {
    requirementsReviewerPrompt = await readFile(requirementsReviewerPromptPath, "utf-8");
  } catch (err) {
    console.error(
      `[opencode-team-lead] Failed to load requirements-reviewer.md at ${requirementsReviewerPromptPath}:`,
      err.message,
    );
    // Don't return early — team-lead can still work without requirements-reviewer
    requirementsReviewerPrompt = null;
  }

  // Load the code-reviewer prompt from the bundled code-reviewer.md
  const codeReviewerPromptPath = join(__dirname, "code-reviewer.md");
  let codeReviewerPrompt;
  try {
    codeReviewerPrompt = await readFile(codeReviewerPromptPath, "utf-8");
  } catch (err) {
    console.error(
      `[opencode-team-lead] Failed to load code-reviewer.md at ${codeReviewerPromptPath}:`,
      err.message,
    );
    // Don't return early — team-lead can still work without code-reviewer
    codeReviewerPrompt = null;
  }

  // Load the security-reviewer prompt from the bundled security-reviewer.md
  const securityReviewerPromptPath = join(__dirname, "security-reviewer.md");
  let securityReviewerPrompt;
  try {
    securityReviewerPrompt = await readFile(securityReviewerPromptPath, "utf-8");
  } catch (err) {
    console.error(
      `[opencode-team-lead] Failed to load security-reviewer.md at ${securityReviewerPromptPath}:`,
      err.message,
    );
    // Don't return early — team-lead can still work without security-reviewer
    securityReviewerPrompt = null;
  }

  // Load the bug-fix prompt from the bundled bug-fix.md
  const bugFixPromptPath = join(__dirname, "bug-fix.md");
  let bugFixPrompt;
  try {
    bugFixPrompt = await readFile(bugFixPromptPath, "utf-8");
  } catch (err) {
    console.error(
      `[opencode-team-lead] Failed to load bug-fix.md at ${bugFixPromptPath}:`,
      err.message,
    );
    // Don't return early — team-lead can still work without bug-fix
    bugFixPrompt = null;
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
        read: {
          "*": "deny",
          ".opencode/scratchpad.md": "allow",
        },
        edit: {
          "*": "deny",
          ".opencode/scratchpad.md": "allow",
        },
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
        permission: mergePermissions(defaultPermission, userConfig.permission),
      };

      // ── Review-manager agent ──────────────────────────────────────
      if (reviewManagerPrompt) {
        const reviewManagerUserConfig =
          input.agent["review-manager"] ?? {};

        const reviewManagerPermission = {
          "*": "deny",
          task: "allow",
          question: "allow",
          "sequential-thinking_*": "allow",
        };

        input.agent["review-manager"] = {
          description:
            "Review orchestrator — spawns specialized reviewer agents in parallel, " +
            "synthesizes their verdicts, and arbitrates disagreements. " +
            "Never reviews code directly.",
          temperature: 0.2,
          variant: "max",
          mode: "subagent",
          color: "warning",
          ...reviewManagerUserConfig,
          prompt: reviewManagerPrompt,
          permission: mergePermissions(reviewManagerPermission, reviewManagerUserConfig.permission),
        };
      }

      // ── Requirements-reviewer agent ───────────────────────────────
      if (requirementsReviewerPrompt) {
        const requirementsReviewerUserConfig =
          input.agent["requirements-reviewer"] ?? {};

        const requirementsReviewerPermission = {
          "*": "deny",
          task: "allow",
        };

        input.agent["requirements-reviewer"] = {
          description:
            "Functional compliance reviewer — verifies implementation matches original requirements. " +
            "Does not evaluate code quality, security, or style.",
          temperature: 0.1,
          variant: "max",
          mode: "subagent",
          color: "info",
          ...requirementsReviewerUserConfig,
          prompt: requirementsReviewerPrompt,
          permission: mergePermissions(requirementsReviewerPermission, requirementsReviewerUserConfig.permission),
        };
      }

      // ── Code-reviewer agent ───────────────────────────────────────
      if (codeReviewerPrompt) {
        const codeReviewerUserConfig =
          input.agent["code-reviewer"] ?? {};

        const codeReviewerPermission = {
          "*": "deny",
          task: "allow",
        };

        input.agent["code-reviewer"] = {
          description:
            "Technical quality reviewer — evaluates correctness, logic, error handling, API design, " +
            "and maintainability. Does not cover security or functional compliance.",
          temperature: 0.2,
          variant: "max",
          mode: "subagent",
          color: "info",
          ...codeReviewerUserConfig,
          prompt: codeReviewerPrompt,
          permission: mergePermissions(codeReviewerPermission, codeReviewerUserConfig.permission),
        };
      }

      // ── Security-reviewer agent ───────────────────────────────────
      if (securityReviewerPrompt) {
        const securityReviewerUserConfig =
          input.agent["security-reviewer"] ?? {};

        const securityReviewerPermission = {
          "*": "deny",
          task: "allow",
        };

        input.agent["security-reviewer"] = {
          description:
            "Security reviewer — identifies vulnerabilities, misconfigurations, and data exposure risks. " +
            "Does not cover code quality, style, or functional compliance.",
          temperature: 0.1,
          variant: "max",
          mode: "subagent",
          color: "error",
          ...securityReviewerUserConfig,
          prompt: securityReviewerPrompt,
          permission: mergePermissions(securityReviewerPermission, securityReviewerUserConfig.permission),
        };
      }

      // ── Bug-fix agent ─────────────────────────────────────────────
      if (bugFixPrompt) {
        const bugFixUserConfig =
          input.agent["bug-fix"] ?? {};

        const bugFixPermission = {
          "*": "deny",
          task: "allow",
          question: "allow",
          "sequential-thinking_*": "allow",
        };

        input.agent["bug-fix"] = {
          description:
            "Bug-fix orchestrator — frames the problem, investigates root cause, generates solution alternatives, " +
            "and coordinates the correction. Use when the user reports a bug.",
          temperature: 0.3,
          variant: "max",
          mode: "all",
          color: "warning",
          ...bugFixUserConfig,
          prompt: bugFixPrompt,
          permission: mergePermissions(bugFixPermission, bugFixUserConfig.permission),
        };
      }
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
