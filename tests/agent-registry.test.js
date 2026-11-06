import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdtemp, mkdir, readFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Agent } from "@opencode/plugin";
import Plugin from "../index.js";
import { SUBAGENT_DEFS, GLOBAL_AGENTS_CONTENT } from "../config/agents.js";
import { mockContext } from "./v2-helper.js";
import { baseline, teamLeadPromptSha256 } from "./agent-baseline.js";

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}
function digest(value) {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(canonical(value))).digest("hex");
}

test("frozen pre-refactor defaults, registration order, and prompt bytes", async () => {
  const ctx = mockContext(process.cwd(), { soul: false });
  await Plugin.setup(ctx);
  const lead = ctx.agents.get("team-lead");
  const definitions = [{ id: lead.id, file: "prompt.md", mode: lead.mode, color: lead.color,
    description: lead.description, request: { body: lead.request.body }, permissions: lead.permissions }, ...SUBAGENT_DEFS];
  assert.deepEqual([...ctx.agents.keys()], baseline.map(([id]) => id));
  assert.deepEqual(definitions.map(({ id }) => id), baseline.map(([id]) => id));
  for (const [id, definitionHash, registeredHash] of baseline) {
    const def = definitions.find((def) => def.id === id);
    assert.equal(digest(def), definitionHash, `${id} defaults`);
    const { system: _system, ...registered } = ctx.agents.get(id);
    assert.equal(digest(registered), registeredHash, `${id} registration`);
  }
  assert.equal(digest(await readFile(new URL("../agents/prompt.md", import.meta.url), "utf8")), teamLeadPromptSha256);
});

test("team-lead overlays preserve ordered rules and plugin prompt ownership", async () => {
  const clean = mockContext(process.cwd(), { soul: false });
  await Plugin.setup(clean);
  const defaults = clean.agents.get("team-lead");
  assert.deepEqual(defaults.permissions.at(-1), { action: "shell", resource: "git push *", effect: "ask" });
  const lifecycle = ["project_state", "spec_get", "spec_create", "spec_update", "spec_validate", "spec_list", "spec_delete", "plan_get", "plan_create", "plan_validate", "plan_block_done", "plan_update", "plan_delete", "plan_list", "brief_get", "brief_create", "brief_update", "brief_delete", "brief_list", "spec_format", "plan_format"];
  for (const action of lifecycle) assert.ok(defaults.permissions.some((rule) => rule.action === action && rule.resource === "*" && rule.effect === "allow"), action);
  for (const withHostPrefix of [false, true]) {
    const configured = Agent.Info.default(Agent.ID.make("team-lead"));
    const overrides = [{ action: "shell", resource: "git push *", effect: "deny" }];
    Object.assign(configured, { description: "custom", color: "#123456", mode: "primary", hidden: true, system: "not the plugin prompt" });
    configured.request = { settings: { custom: true }, headers: { "x-test": "yes" }, body: { temperature: 0.8, custom: true } };
    configured.permissions = [...(withHostPrefix ? configured.permissions : []), ...overrides];
    const independent = Agent.Info.default(Agent.ID.make("independent"));
    const ctx = mockContext(process.cwd(), { soul: false }, [configured, independent]);
    await Plugin.setup(ctx);
    const actual = ctx.agents.get("team-lead");
    assert.deepEqual(actual, { ...configured, permissions: [...defaults.permissions, ...overrides], system: defaults.system });
    assert.deepEqual(ctx.agents.get("independent"), independent);
    const event = { agent: "team-lead", options: {} };
    await ctx.hooks.context(event);
    assert.equal(event.options.temperature, 0.8);
  }
});

test("team-lead SOUL overrides work in both directions", async () => {
  const clean = mockContext(process.cwd(), { soul: false });
  await Plugin.setup(clean);
  for (const enabled of [false, true]) {
    const ctx = mockContext(process.cwd(), { soul: !enabled, agents: { "team-lead": { soul: enabled } } });
    await Plugin.setup(ctx);
    assert.equal(ctx.agents.get("team-lead").system, clean.agents.get("team-lead").system + (enabled ? `\n\nInstructions from: ~/.config/opencode/AGENTS.md\n${GLOBAL_AGENTS_CONTENT}` : ""));
    assert.equal(ctx.agents.get("architect").system.includes(GLOBAL_AGENTS_CONTENT), !enabled);
  }
});

test("temperature hook is scoped to plugin IDs and preserves event precedence", async () => {
  const ctx = mockContext(process.cwd());
  await Plugin.setup(ctx);
  for (const [id] of baseline) {
    const event = { agent: id, options: {} };
    await ctx.hooks.context(event);
    assert.equal(event.options.temperature, id === "team-lead" || id === "spec-writer" ? 0.3 : ["requirements-reviewer", "security-reviewer", "spec-validator", "plan-functional-reviewer", "plan-technical-reviewer"].includes(id) ? 0.1 : 0.2);
    event.options.temperature = 0.9;
    await ctx.hooks.context(event);
    assert.equal(event.options.temperature, 0.9);
  }
  ctx.agent.get = () => { throw new Error("must not look up independent agents"); };
  const unrelated = { agent: "independent", options: {} };
  await ctx.hooks.context(unrelated);
  assert.deepEqual(unrelated.options, {});
});

test("missing required prompt fails setup in an isolated package fixture", async () => {
  const fixture = await mkdtemp(join(tmpdir(), "agent-registry-"));
  try {
    for (const path of ["package.json", "index.js", "config", "tools", "skills"]) {
      await cp(new URL(`../${path}`, import.meta.url), join(fixture, path), { recursive: true });
    }
    await symlink(new URL("../node_modules", import.meta.url).pathname, join(fixture, "node_modules"), "dir");
    await mkdir(join(fixture, "agents"));
    const { default: isolated } = await import(pathToFileURL(join(fixture, "index.js")));
    const ctx = mockContext(fixture);
    await assert.rejects(isolated.setup(ctx), { message: "[opencode-team-lead] A required agent prompt could not be loaded" });
    assert.equal(ctx.transforms.length, 0);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
