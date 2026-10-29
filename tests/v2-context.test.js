import { test } from "node:test";
import assert from "node:assert/strict";
import Plugin from "../index.js";
import { mockContext } from "./v2-helper.js";

test("temperature hook unwraps AgentGetOutput.data", async () => {
  const ctx = mockContext(process.cwd());
  await Plugin.setup(ctx);
  const event = { agent: "team-lead", options: {} };
  await ctx.hooks.context(event);
  assert.equal(event.options.temperature, 0.3);
});

test("temperature hook tolerates absent request overlays", async () => {
  const ctx = mockContext(process.cwd());
  await Plugin.setup(ctx);
  ctx.agent.get = async () => ({ data: { id: "team-lead" }, location: ctx.location });
  const event = { agent: "team-lead", options: {} };
  await ctx.hooks.context(event);
  assert.equal(event.options.temperature, undefined);
});

test("temperature hook preserves earlier overrides and ignores unrelated agents", async () => {
  const ctx = mockContext(process.cwd());
  await Plugin.setup(ctx);
  const event = { agent: "team-lead", options: { temperature: 0.8 } };
  await ctx.hooks.context(event);
  assert.equal(event.options.temperature, 0.8);
  ctx.agent.get = async () => { throw new Error("unrelated agent must not be fetched"); };
  await ctx.hooks.context({ agent: "build", options: {} });
});
