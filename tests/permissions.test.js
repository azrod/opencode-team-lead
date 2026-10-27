import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SUBAGENT_DEFS, loadAgentPrompt } from "../config/agents.js";
import Plugin from "../index.js";
import { mockContext } from "./v2-helper.js";

function effect(rules, action, resource = "*") {
  return rules.filter((rule) => (rule.action === "*" || rule.action === action) &&
    (rule.resource === "*" || rule.resource === resource)).at(-1)?.effect;
}

describe("native V2 agent policies", () => {
  test("all specialized agents are deny-by-default with native action names", () => {
    assert.equal(SUBAGENT_DEFS.length, 18);
    for (const agent of SUBAGENT_DEFS) {
      assert.deepEqual(agent.permissions[0], { action: "*", resource: "*", effect: "deny" });
      assert.match(agent.color, /^#[\da-f]{6}$/i);
      assert.ok(agent.permissions.every((rule) => !["bash", "task", "write", "todoread"].includes(rule.action)));
    }
  });

  test("architect remains directly selectable and cannot implement or delegate", () => {
    const architect = SUBAGENT_DEFS.find((agent) => agent.id === "architect");
    assert.equal(architect.mode, "primary");
    for (const action of ["edit", "shell", "subagent", "external_directory", "plan_block_done", "brief_get"]) {
      assert.equal(effect(architect.permissions, action), "deny", action);
    }
    for (const action of ["read", "glob", "grep", "spec_get", "spec_create", "plan_update"]) {
      assert.equal(effect(architect.permissions, action), "allow", action);
    }
  });

  test("registers all agents and preserves hidden reviewers", async () => {
    const ctx = mockContext(process.cwd());
    await Plugin.setup(ctx);
    assert.equal(ctx.agents.size, 19);
    assert.equal(ctx.agents.get("code-reviewer").hidden, true);
    assert.equal(ctx.agents.get("architect").hidden, false);
    assert.equal(effect(ctx.agents.get("team-lead").permissions, "subagent"), "allow");
    assert.equal(effect(ctx.agents.get("review-manager").permissions, "subagent", "explore"), "deny");
    const reviewRules = ctx.agents.get("review-manager").permissions;
    for (const id of ["plan-reviewer", "plan-functional-reviewer", "plan-technical-reviewer", "plan-code-reviewer"]) {
      assert.equal(effect(reviewRules, "subagent", id), "deny", id);
    }
    for (const id of ["requirements-reviewer", "code-reviewer", "security-reviewer", "spec-reviewer"]) {
      assert.equal(effect(reviewRules, "subagent", id), "allow", id);
    }
  });

  test("architect prompt keeps decision rationale and explicit plan acceptance", async () => {
    const prompt = await loadAgentPrompt("architect", "architect.md");
    for (const pattern of [/Observed facts/i, /Inferences/i, /Unknowns/i, /ASCII/i, /Never use Mermaid/i, /explicitly accepts/i]) {
      assert.match(prompt, pattern);
    }
  });

  test("review orchestrators name hidden specialists and stop infrastructure retries", async () => {
    const review = await loadAgentPrompt("review-manager", "review-manager.md");
    assert.match(review, /Never launch `plan-reviewer`/);
    assert.match(review, /do not retry the identical blocked operation/);
    for (const id of ["requirements-reviewer", "code-reviewer", "security-reviewer", "spec-reviewer"]) {
      assert.ok(review.includes(`\`${id}\``));
    }
    const plan = await loadAgentPrompt("plan-reviewer", "plan-reviewer.md");
    assert.match(plan, /return \*\*BLOCKED\*\* with the exact error immediately/);
  });
});
