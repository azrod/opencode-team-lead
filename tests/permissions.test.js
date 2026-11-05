import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Agent } from "@opencode/plugin";
import { SUBAGENT_DEFS, GLOBAL_AGENTS_CONTENT, loadAgentPrompt } from "../config/agents.js";
import Plugin from "../index.js";
import { mockContext } from "./v2-helper.js";
import { buildToolRegistry } from "../tools/registry.js";

function effect(rules, action, resource = "*") {
  return rules.filter((rule) => (rule.action === "*" || rule.action === action) &&
    (rule.resource === "*" || rule.resource === resource)).at(-1)?.effect;
}

describe("native V2 agent policies", () => {
  test("SOUL applies to every agent mode and respects global and per-agent overrides", async () => {
    const cases = [
      { options: {}, enabled: () => true },
      { options: { soul: true }, enabled: () => true },
      { options: { soul: false }, enabled: () => false },
      {
        options: { soul: false, agents: { architect: { soul: true }, "code-reviewer": { soul: true } } },
        enabled: (id) => ["architect", "code-reviewer"].includes(id),
      },
      {
        options: { soul: true, agents: { architect: { soul: false }, "code-reviewer": { soul: false }, planning: { soul: false } } },
        enabled: (id) => !["architect", "code-reviewer", "planning"].includes(id),
      },
    ];
    for (const { options, enabled } of cases) {
      const ctx = mockContext(process.cwd(), options);
      await Plugin.setup(ctx);
      for (const def of [{ id: "team-lead", file: "prompt.md" }, ...SUBAGENT_DEFS]) {
        const prompt = await loadAgentPrompt(def.id, def.file);
        const expected = enabled(def.id)
          ? `${prompt}\n\nInstructions from: ~/.config/opencode/AGENTS.md\n${GLOBAL_AGENTS_CONTENT}`
          : prompt;
        assert.equal(ctx.agents.get(def.id).system, expected, `${def.id}: ${JSON.stringify(options)}`);
      }
    }
  });

  test("all specialized agents are deny-by-default with native action names", () => {
    assert.equal(SUBAGENT_DEFS.length, 18);
    for (const agent of SUBAGENT_DEFS) {
      assert.deepEqual(agent.permissions[0], { action: "*", resource: "*", effect: "deny" });
      assert.match(agent.color, /^#[\da-f]{6}$/i);
      assert.ok(agent.permissions.every((rule) => !["bash", "task", "write", "todoread"].includes(rule.action)));
    }
  });

  test("architect allows exact review targets only in definitions and registered defaults", async () => {
    const ctx = mockContext(process.cwd());
    await Plugin.setup(ctx);
    for (const architect of [SUBAGENT_DEFS.find((agent) => agent.id === "architect"), ctx.agents.get("architect")]) {
      assert.equal(architect.mode, "primary");
      assert.notEqual(architect.hidden, true);
      assert.deepEqual(architect.permissions.filter((rule) => rule.action === "subagent"), [
        { action: "subagent", resource: "*", effect: "deny" },
        { action: "subagent", resource: "spec-validator", effect: "allow" },
        { action: "subagent", resource: "plan-reviewer", effect: "allow" },
      ]);
      for (const id of ["spec-validator", "plan-reviewer"]) {
        assert.equal(effect(architect.permissions, "subagent", id), "allow", id);
      }
      for (const id of ["unknown", "spec-validator-extra", "plan-code-reviewer", "general", "explore", "spec-writer", "planning", "brainstorm", "team-lead", "review-manager", "architect"]) {
        assert.equal(effect(architect.permissions, "subagent", id), "deny", id);
      }
      for (const action of ["edit", "shell", "external_directory", "project_state", "plan_block_done", "spec_delete", "plan_delete", "brief_get", "brief_list", "brief_create", "brief_update", "brief_delete"]) {
        assert.equal(effect(architect.permissions, action), "deny", action);
      }
      for (const action of ["read", "list", "glob", "grep", "spec_list", "spec_get", "spec_format", "spec_create", "spec_update", "spec_validate", "plan_list", "plan_get", "plan_format", "plan_create", "plan_update", "plan_validate"]) {
        assert.equal(effect(architect.permissions, action), "allow", action);
      }
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

  test("configured native permissions follow plugin defaults without inheriting host grants", async () => {
    for (const withHostPrefix of [true, false]) {
      const configured = Agent.Info.default(Agent.ID.make("architect"));
      const overrides = [
        { action: "subagent", resource: "spec-validator", effect: "deny" },
        { action: "subagent", resource: "custom-reviewer", effect: "allow" },
        { action: "custom-tool", resource: "*", effect: "allow" },
      ];
      configured.permissions = [...(withHostPrefix ? configured.permissions : []), ...overrides];
      const ctx = mockContext(process.cwd(), {}, [configured]);
      await Plugin.setup(ctx);
      const defaults = SUBAGENT_DEFS.find((agent) => agent.id === "architect").permissions;
      const registered = ctx.agents.get("architect").permissions;
      assert.deepEqual(registered, [...defaults, ...overrides]);
      assert.equal(effect(registered, "subagent", "spec-validator"), "deny");
      assert.equal(effect(registered, "subagent", "custom-reviewer"), "allow");
      assert.equal(effect(registered, "custom-tool"), "allow");
      assert.equal(effect(registered, "subagent", "plan-reviewer"), "allow");
      assert.equal(effect(registered, "shell"), "deny");
    }
  });

  test("architect prompt keeps decision rationale and explicit plan acceptance", async () => {
    const prompt = await loadAgentPrompt("architect", "architect.md");
    for (const pattern of [/Observed facts/i, /Inferences/i, /Unknowns/i, /ASCII/i, /Never use Mermaid/i, /explicitly accepts/i]) {
      assert.match(prompt, pattern);
    }
  });

  test("architect evaluates proposals independently without automatic agreement or forced objections", async () => {
    const prompt = await loadAgentPrompt("architect", "architect.md");
    const judgment = prompt.split("## Independent Judgment\n")[1]?.split("## Analysis Workflow")[0];
    assert.ok(judgment, "missing independent judgment policy");
    for (const pattern of [
      /hypothesis to assess, not a decision to defend/,
      /decisive assumptions/,
      /simpler alternative, including keeping the current design/,
      /investigate material unknowns before giving a firm recommendation/,
      /say clearly that you do not recommend it/,
      /Do not invent objections/,
      /Support a sound proposal and explain why it fits/,
      /confidence or insistence is not new evidence/,
      /new facts, constraints, or better arguments/,
      /Respect the user's final decision without pretending to recommend it/,
      /do not repeatedly reopen the debate without new evidence/,
    ]) {
      assert.match(judgment, pattern);
    }
  });

  test("architect presents open decisions after plan creation or updates without replaying the plan", async () => {
    const prompt = await loadAgentPrompt("architect", "architect.md");
    const checkpoint = prompt.split("## Presenting Open Decisions After a Plan Change\n")[1];
    assert.ok(checkpoint, "missing post-plan decision checkpoint");
    for (const pattern of [
      /After creating or updating an exec-plan and running `plan_validate`/,
      /in the conversation/,
      /do not repeat the four-part assessment format, summarize the plan/,
      /or restate previously accepted decisions unless new evidence requires reconsidering them/,
      /The question the user needs to decide/,
      /The realistic options and their main consequences/,
      /Your recommendation and its trade-offs/,
      /Explicitly ask the user to choose/,
      /If no decisions remain open, say so briefly/,
      /instead of inventing questions or asking for approval again/,
      /keep it explicitly open rather than recording your preferred option as an accepted decision/,
      /creating or validating a plan does not imply user acceptance/,
    ]) {
      assert.match(checkpoint, pattern);
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

  test("architect prompt gates direct authorship and current-content approvals", async () => {
    const prompt = await loadAgentPrompt("architect", "architect.md");
    for (const pattern of [
      /exact targets `spec-validator` and `plan-reviewer`/,
      /Write specs and exec-plans yourself through lifecycle tools, including all corrections/,
      /Never delegate implementation, exploration, artifact authorship, or delivery coordination/,
      /Before `plan_create`[\s\S]*successful `spec_validate`[\s\S]*`APPROVED` semantic verdict/,
      /Reuse an already approved current specification/,
      /Lifecycle tools do not launch reviewers/,
      /not completeness or architecture quality/,
      /On `REJECTED`[\s\S]*request fresh semantic review/,
      /substantive specification change invalidates its prior approval/,
      /reassess and update affected plans/,
      /Before requesting plan review, resolve all open questions with the user/,
      /Pass `deep` in the request rather than leaving depth unspecified/,
      /On `CHANGES_REQUESTED`[\s\S]*request fresh review/,
      /New architectural decisions must return to the user for explicit acceptance/,
      /Substantive plan updates require fresh plan review/,
      /ready for handoff only after an `APPROVED` review covering its current content/,
      /Reviewer approval is not user acceptance/,
      /blocked, failed, or incomplete review is not approval/,
      /report the exact error and stop/,
      /do not bypass restrictions, substitute another agent, or repeat identical blocked attempts/,
    ]) assert.match(prompt, pattern);
    assert.doesNotMatch(prompt, /must never delegate work or call `subagent`/);
  });

  test("reviewers support architect and block incomplete plan approval", async () => {
    const spec = await loadAgentPrompt("spec-validator", "spec-validator.md");
    assert.match(spec, /including architect/);
    assert.match(spec, /do not automatically launch semantic review/);
    assert.match(spec, /No completeness check/);
    const plan = await loadAgentPrompt("plan-reviewer", "plan-reviewer.md");
    assert.match(plan, /team-lead or architect/);
    assert.match(plan, /honor the supplied level without asking again/);
    assert.match(plan, /Any selected review still missing, failed, or incomplete → \*\*BLOCKED\*\*/);
    assert.ok(plan.indexOf("Any selected review still missing") < plan.indexOf("`≥ 1 CHANGES_REQUESTED`"));
    assert.match(plan, /If retry fails, return \*\*BLOCKED\*\* with the available findings, not APPROVED/);
    assert.doesNotMatch(plan, /Never block the entire review|proceed without that reviewer/);
  });

  test("spec tool descriptions distinguish structural checks from explicit semantic delegation", () => {
    const tools = buildToolRegistry(process.cwd(), {});
    for (const name of ["spec_create", "spec_update", "spec_validate"]) {
      assert.match(tools[name].description, /An authorized caller must explicitly delegate semantic review to spec-validator/);
      assert.match(tools[name].description, /nondelegating authors return the artifact and structural result/);
    }
    assert.match(tools.spec_validate.description, /structure only/);
    assert.match(tools.spec_validate.description, /Does not launch semantic review/);
    const validator = SUBAGENT_DEFS.find((agent) => agent.id === "spec-validator");
    assert.match(validator.description, /Explicitly delegated/);
    assert.doesNotMatch(validator.description, /Invoked automatically/);
  });

  test("spec-writer returns structural results without unauthorized delegation or invented approval", async () => {
    const prompt = await loadAgentPrompt("spec-writer", "spec-writer.md");
    assert.match(prompt, /You have no delegation permission/);
    assert.match(prompt, /Structural result/);
    assert.match(prompt, /pending unless the caller supplied an actual APPROVED or REJECTED verdict covering the current content/);
    assert.doesNotMatch(prompt, /trigger the LLM spec-validator/);
    assert.equal(effect(SUBAGENT_DEFS.find((agent) => agent.id === "spec-writer").permissions, "subagent", "spec-validator"), "deny");
  });
});
