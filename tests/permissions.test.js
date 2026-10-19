// tests/permissions.test.js
// Verifies that all write/edit target directories declared in index.js exist on disk.
// Uses only Node.js built-ins: node:test, node:assert, node:fs/promises, node:path, node:url

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SUBAGENT_DEFS, loadAgentPrompt } from "../config/agents.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

// ── agent permissions — write/edit target directories ────────────────────────

describe("agent permissions — write/edit target directories", () => {
  test("all declared write/edit target dirs exist in the repo", async () => {
    const indexPath = join(projectRoot, "index.js");
    const content = await readFile(indexPath, "utf-8");

    // Match paths that appear as "allow" values and end with /**
    // Accepts both "some/path/**" and "**/some/path/**" forms.
    // Excludes bare "*" wildcards — we only want specific directory glob targets.
    // Pattern: "some/path/**": "allow"  or  "**/some/path/**": "allow"
    const matches = content.matchAll(/"(\*\*\/[^"]+\/\*\*|[^*"][^"]*\/\*\*)":\s*"allow"/g);

    const dirs = new Set();
    for (const [, path] of matches) {
      // Strip leading **/ prefix and trailing /** suffix to get the base directory
      dirs.add(path.replace(/^\*\*\//, "").replace(/\/\*\*$/, ""));
    }

    assert.ok(dirs.size > 0, "expected at least one write/edit target directory in index.js");

    for (const dir of dirs) {
      const absPath = join(projectRoot, dir);
      await assert.doesNotReject(
        () => access(absPath),
        `declared write/edit target directory does not exist: ${dir}`
      );
    }
  });
});

describe("architect agent contract", () => {
  const architect = SUBAGENT_DEFS.find((agent) => agent.id === "architect");
  const allowedLifecycleTools = new Set([
    "spec_list",
    "spec_get",
    "spec_format",
    "spec_create",
    "spec_update",
    "spec_validate",
    "plan_list",
    "plan_get",
    "plan_format",
    "plan_create",
    "plan_update",
    "plan_validate",
  ]);
  const deniedLifecycleTools = [
    "project_state",
    "spec_delete",
    "plan_delete",
    "plan_block_done",
    "brief_get",
    "brief_create",
    "brief_update",
    "brief_delete",
    "brief_list",
  ];

  test("is visible, directly selectable, and not a subagent", () => {
    assert.ok(architect, "architect must be registered");
    assert.equal(architect.mode, "primary");
    assert.equal(architect.hidden, undefined);
  });

  test("allows only repository exploration and its lifecycle allowlist", () => {
    assert.deepEqual(
      [architect.permission.read, architect.permission.list, architect.permission.glob, architect.permission.grep],
      ["allow", "allow", "allow", "allow"]
    );
    assert.equal(architect.permission["*"], "deny");

    for (const tool of allowedLifecycleTools) {
      assert.equal(architect.permission[tool], "allow", `expected ${tool} to be allowed`);
    }
  });

  test("explicitly denies implementation, delegation, external access, and excluded lifecycle tools", () => {
    for (const tool of ["edit", "bash", "task", "external_directory", ...deniedLifecycleTools]) {
      assert.equal(architect.permission[tool], "deny", `expected ${tool} to be denied`);
    }
  });

  test("loads a prompt that enforces decision rationale and explicit plan acceptance", async () => {
    const prompt = await loadAgentPrompt(architect.id, architect.file);
    assert.match(prompt, /Observed facts/i);
    assert.match(prompt, /Inferences/i);
    assert.match(prompt, /Unknowns/i);
    assert.match(prompt, /ASCII/i);
    assert.match(prompt, /Markdown fenced code blocks tagged `text`/i);
    assert.match(prompt, /Never use Mermaid/i);
    assert.match(prompt, /`mermaid` code block/i);
    assert.match(prompt, /explicitly accepts/i);
    assert.match(prompt, /plan_create/i);
    assert.match(prompt, /plan_update/i);
  });
});
