// tests/permissions.test.js
// Verifies that all write/edit target directories declared in index.js exist on disk.
// Uses only Node.js built-ins: node:test, node:assert, node:fs/promises, node:path, node:url

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

// ── agent permissions — write/edit target directories ────────────────────────

describe("agent permissions — write/edit target directories", () => {
  test("all declared write/edit target dirs exist in the repo", async () => {
    const indexPath = join(projectRoot, "index.js");
    const content = await readFile(indexPath, "utf-8");

    // Match paths that appear as "allow" values and end with /**
    // Excludes "*" wildcards — we only want specific directory glob targets.
    // Pattern: "some/path/**": "allow"  or  "some/path/**" : "allow"
    const matches = content.matchAll(/"([^*"][^"]*\/\*\*)":\s*"allow"/g);

    const dirs = new Set();
    for (const [, path] of matches) {
      // Strip the /** suffix to get the base directory
      dirs.add(path.replace(/\/\*\*$/, ""));
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
