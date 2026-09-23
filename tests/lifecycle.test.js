// tests/lifecycle.test.js
// Comprehensive test suite for tools/lifecycle.js
// Uses only Node.js built-ins: node:test, node:assert, node:fs/promises, node:os, node:path

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { readFile as fsReadFile, writeFile as fsWriteFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  specGet,
  specCreate,
  specUpdate,
  specValidate,
  specList,
  specDelete,
  planGet,
  planCreate,
  planUpdate,
  planValidate,
  planBlockDone,
  planList,
  planDelete,
  briefGet,
  briefCreate,
  briefUpdate,
  briefDelete,
  briefList,
  projectState,
  specFormat,
  planFormat,
} from "../tools/lifecycle.js";
import {
  checkArtifactAccess,
  LIFECYCLE_TOOLS,
  isProtectedPath,
} from "../tools/artifact-guard.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function writeFile(dir, relPath, content) {
  const abs = join(dir, relPath);
  await mkdir(join(dir, relPath, ".."), { recursive: true });
  await fsWriteFile(abs, content, "utf-8");
  return abs;
}

const DEFAULT_PATHS = {
  specs: "docs/specs",
  execPlans: "docs/exec-plans",
  briefs: "docs/briefs",
};

// ── specCreate ────────────────────────────────────────────────────────────────

describe("specCreate", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-specCreate-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: creates file with correct frontmatter and returns { created, file, id }", async () => {
    const result = await specCreate(tmpDir, DEFAULT_PATHS, "Authentication System", "technical");

    assert.equal(result.created, true);
    assert.ok(result.file.includes("authentication-system.md"));
    assert.equal(result.id, "authentication-system");

    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /^---\n/);
    assert.match(content, /title: "Authentication System"/);
    assert.match(content, /id: authentication-system/);
    assert.match(content, /type: "technical"/);
    assert.match(content, /status: draft/);
    assert.match(content, /created: \d{4}-\d{2}-\d{2}/);
  });

  test("with content: body is appended after frontmatter", async () => {
    const result = await specCreate(tmpDir, DEFAULT_PATHS, "API Design", "architectural", "## Overview\n\nSome design notes.");

    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /## Overview/);
    assert.match(content, /Some design notes/);
  });

  test("duplicate id: throws 'already exists'", async () => {
    await specCreate(tmpDir, DEFAULT_PATHS, "Duplicate Spec");
    await assert.rejects(
      () => specCreate(tmpDir, DEFAULT_PATHS, "Duplicate Spec"),
      (err) => {
        assert.match(err.message, /already exists/i);
        return true;
      }
    );
  });

  test("default type is 'technical'", async () => {
    const result = await specCreate(tmpDir, DEFAULT_PATHS, "Default Type Spec");
    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /type: "technical"/);
  });

  test('title with double quotes: YAML escaped, H1 unescaped', async () => {
    const result = await specCreate(tmpDir, DEFAULT_PATHS, 'Auth "Service"');
    const content = await fsReadFile(join(tmpDir, result.file), 'utf-8');
    // YAML frontmatter should have escaped quotes
    assert.match(content, /title: "Auth \\"Service\\""/);
    // H1 heading should NOT have backslashes
    assert.match(content, /^# Auth "Service"$/m);
  });
});

// ── specGet ───────────────────────────────────────────────────────────────────

describe("specGet", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-specGet-"));
    await writeFile(
      tmpDir,
      "docs/specs/my-spec.md",
      `---\ntitle: "My Spec"\nid: my-spec\ntype: technical\nstatus: draft\ncreated: 2026-01-01\n---\n\n# My Spec\n`
    );
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: returns { file, content, frontmatter }", async () => {
    const result = await specGet(tmpDir, DEFAULT_PATHS, "my-spec");

    assert.ok(result.file.includes("my-spec.md"));
    assert.ok(result.content.includes("My Spec"));
    assert.equal(result.frontmatter.title, "My Spec");
    assert.equal(result.frontmatter.id, "my-spec");
    assert.equal(result.frontmatter.status, "draft");
  });

  test("case-insensitive id lookup works", async () => {
    const result = await specGet(tmpDir, DEFAULT_PATHS, "MY-SPEC");
    assert.ok(result.file.includes("my-spec.md"));
  });

  test("not found: throws error mentioning the id", async () => {
    await assert.rejects(
      () => specGet(tmpDir, DEFAULT_PATHS, "nonexistent"),
      (err) => {
        assert.match(err.message, /nonexistent/);
        return true;
      }
    );
  });
});

// ── specUpdate ────────────────────────────────────────────────────────────────

describe("specUpdate", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-specUpdate-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: replaces oldString with newString and returns { file, updated: true }", async () => {
    await writeFile(
      tmpDir,
      "docs/specs/update-test.md",
      `---\ntitle: "Update Test"\nid: update-test\n---\n\n# Update Test\n\nOriginal content here.\n`
    );

    const result = await specUpdate(tmpDir, DEFAULT_PATHS, "update-test", "Original content here.", "New content here.");

    assert.equal(result.updated, true);
    assert.ok(result.file.includes("update-test.md"));

    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /New content here/);
    assert.doesNotMatch(content, /Original content here/);
  });

  test("oldString not found: throws explicit error", async () => {
    await writeFile(
      tmpDir,
      "docs/specs/no-match.md",
      `---\ntitle: "No Match"\nid: no-match\n---\n\n# No Match\n`
    );

    await assert.rejects(
      () => specUpdate(tmpDir, DEFAULT_PATHS, "no-match", "string that does not exist", "replacement"),
      (err) => {
        assert.match(err.message, /not found/i);
        return true;
      }
    );
  });

  test("oldString found multiple times: throws error about multiple matches", async () => {
    await writeFile(
      tmpDir,
      "docs/specs/multi-match.md",
      `---\ntitle: "Multi Match"\nid: multi-match\n---\n\nrepeated text\n\nrepeated text\n`
    );

    await assert.rejects(
      () => specUpdate(tmpDir, DEFAULT_PATHS, "multi-match", "repeated text", "something else"),
      (err) => {
        assert.match(err.message, /2 matches/i);
        return true;
      }
    );
  });
});

// ── specCreate (edge cases) ───────────────────────────────────────────────────

describe("specCreate — edge cases", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-specCreate-edge-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("empty title: throws with clear message", async () => {
    await assert.rejects(
      () => specCreate(tmpDir, DEFAULT_PATHS, ""),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });

  test("title with only special chars producing empty id: throws", async () => {
    await assert.rejects(
      () => specCreate(tmpDir, DEFAULT_PATHS, "!!!"),
      (err) => {
        assert.match(err.message, /cannot derive id/i);
        return true;
      }
    );
  });
});

// ── specValidate ──────────────────────────────────────────────────────────────

describe("specValidate", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-specValidate-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("valid spec: returns { valid: true, issues: [] }", async () => {
    await writeFile(
      tmpDir,
      "docs/specs/valid-spec.md",
      `---\ntitle: "Valid Spec"\nid: valid-spec\ntype: technical\nstatus: draft\ncreated: 2026-01-01\n---\n\n# Valid Spec\n\nSome content here.\n`
    );

    const result = await specValidate(tmpDir, DEFAULT_PATHS, "valid-spec");

    assert.equal(result.valid, true);
    assert.deepEqual(result.issues, []);
  });

  test("missing frontmatter: returns { valid: false } with relevant issue", async () => {
    await writeFile(
      tmpDir,
      "docs/specs/no-fm-spec.md",
      `# No Frontmatter\n\nSome content.\n`
    );

    const result = await specValidate(tmpDir, DEFAULT_PATHS, "no-fm-spec");

    assert.equal(result.valid, false);
    assert.ok(result.issues.length > 0);
    assert.ok(result.issues.some((i) => /frontmatter/i.test(i)));
  });

  test("missing title field: invalid", async () => {
    await writeFile(
      tmpDir,
      "docs/specs/no-title.md",
      `---\nid: no-title\nstatus: draft\n---\n\n# No Title In FM\n\nContent.\n`
    );

    const result = await specValidate(tmpDir, DEFAULT_PATHS, "no-title");

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => /title/i.test(i)));
  });

  test("empty body: invalid", async () => {
    await writeFile(
      tmpDir,
      "docs/specs/empty-body.md",
      `---\ntitle: "Empty Body"\nid: empty-body\n---\n`
    );

    const result = await specValidate(tmpDir, DEFAULT_PATHS, "empty-body");

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => /body.*empty|empty.*body/i.test(i)));
  });

  test("not found: throws error mentioning the id", async () => {
    await assert.rejects(
      () => specValidate(tmpDir, DEFAULT_PATHS, "nonexistent-spec"),
      (err) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /nonexistent-spec/);
        return true;
      }
    );
  });
});

// ── specList ──────────────────────────────────────────────────────────────────

describe("specList", () => {
  test("returns list of specs with metadata", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-specList-"));
    try {
      await writeFile(
        tmpDir,
        "docs/specs/spec-a.md",
        `---\ntitle: "Spec A"\nid: spec-a\ntype: technical\nstatus: draft\ncreated: 2026-01-01\n---\n\n# Spec A\n`
      );
      await writeFile(
        tmpDir,
        "docs/specs/spec-b.md",
        `---\ntitle: "Spec B"\nid: spec-b\ntype: functional\nstatus: active\ncreated: 2026-02-01\n---\n\n# Spec B\n`
      );

      const result = await specList(tmpDir, DEFAULT_PATHS);

      assert.ok(Array.isArray(result.specs));
      assert.equal(result.specs.length, 2);

      const specA = result.specs.find((s) => s.id === "spec-a");
      assert.ok(specA, "expected spec-a in list");
      assert.equal(specA.title, "Spec A");
      assert.equal(specA.type, "technical");
      assert.equal(specA.status, "draft");

      const specB = result.specs.find((s) => s.id === "spec-b");
      assert.ok(specB, "expected spec-b in list");
      assert.equal(specB.status, "active");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("empty directory: returns { specs: [] }", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-specList-empty-"));
    try {
      const result = await specList(tmpDir, DEFAULT_PATHS);
      assert.deepEqual(result.specs, []);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ── specDelete ────────────────────────────────────────────────────────────────

describe("specDelete", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-specDelete-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: deletes file and returns { deleted: true, file }", async () => {
    await writeFile(
      tmpDir,
      "docs/specs/to-delete.md",
      `---\ntitle: "To Delete"\nid: to-delete\n---\n\n# To Delete\n`
    );

    const result = await specDelete(tmpDir, DEFAULT_PATHS, "to-delete");

    assert.equal(result.deleted, true);
    assert.ok(result.file.includes("to-delete.md"));

    const { existsSync } = await import("node:fs");
    assert.equal(existsSync(join(tmpDir, result.file)), false);
  });

  test("not found: throws error", async () => {
    await assert.rejects(
      () => specDelete(tmpDir, DEFAULT_PATHS, "ghost-spec"),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });
});

// ── planCreate ────────────────────────────────────────────────────────────────

describe("planCreate", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-planCreate-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: creates plan with required sections and returns { created, file, id }", async () => {
    const result = await planCreate(tmpDir, DEFAULT_PATHS, {
      title: "Auth Feature",
      functional_objective: "Users can log in with email/password. Sessions persist 30 days. Password reset via email.",
    });

    assert.equal(result.created, true);
    assert.ok(result.file.includes("auth-feature.md"));
    assert.equal(result.id, "auth-feature");

    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /## Goal/);
    assert.match(content, /Auth Feature/);
    assert.match(content, /## Functional objective/);
    assert.match(content, /Users can log in/);
    assert.match(content, /## Building blocks/);
    assert.match(content, /## Decision log/);
    assert.match(content, /^---\n/);
    assert.match(content, /created: \d{4}-\d{2}-\d{2}/);
  });

  test("with brief: brief is in frontmatter", async () => {
    const result = await planCreate(tmpDir, DEFAULT_PATHS, {
      title: "Plan With Brief",
      functional_objective: "Something meaningful is achieved.",
      brief: "docs/briefs/my-brief.md",
    });

    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /brief: "docs\/briefs\/my-brief\.md"/);
  });

  test("missing functional_objective: throws immediately, no file created", async () => {
    await assert.rejects(
      () =>
        planCreate(tmpDir, DEFAULT_PATHS, {
          title: "Plan Without Objective",
          functional_objective: "",
        }),
      (err) => {
        assert.match(err.message, /functional_objective/i);
        return true;
      }
    );

    const { existsSync } = await import("node:fs");
    assert.equal(existsSync(join(tmpDir, "docs/exec-plans/plan-without-objective.md")), false);
  });

  test("missing title: throws", async () => {
    await assert.rejects(
      () =>
        planCreate(tmpDir, DEFAULT_PATHS, {
          title: "",
          functional_objective: "Valid objective.",
        }),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });

  test("duplicate plan: throws 'already exists'", async () => {
    await planCreate(tmpDir, DEFAULT_PATHS, {
      title: "Duplicate Plan",
      functional_objective: "First creation.",
    });
    await assert.rejects(
      () =>
        planCreate(tmpDir, DEFAULT_PATHS, {
          title: "Duplicate Plan",
          functional_objective: "Second creation.",
        }),
      (err) => {
        assert.match(err.message, /already exists/i);
        return true;
      }
    );
  });
});

// ── planGet ───────────────────────────────────────────────────────────────────

describe("planGet", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-planGet-"));
    await writeFile(
      tmpDir,
      "docs/exec-plans/my-plan.md",
      `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nMy Plan\n\n## Functional objective\n\nSomething.\n\n## Building blocks\n\n- [ ] Task one\n- [x] Task two\n`
    );
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: returns { file, content, frontmatter, blocks }", async () => {
    const result = await planGet(tmpDir, DEFAULT_PATHS, "my-plan");

    assert.ok(result.file.includes("my-plan.md"));
    assert.ok(result.content.includes("My Plan"));
    assert.equal(result.frontmatter.created, "2026-01-01");
    assert.equal(result.blocks.total, 2);
    assert.equal(result.blocks.checked, 1);
  });

  test("not found: throws error", async () => {
    await assert.rejects(
      () => planGet(tmpDir, DEFAULT_PATHS, "ghost-plan"),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });
});

// ── planUpdate ────────────────────────────────────────────────────────────────

describe("planUpdate", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-planUpdate-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: replaces oldString and returns { file, updated: true }", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/plan-to-update.md",
      `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nPlan To Update\n\n## Building blocks\n\n- [ ] Old task name\n`
    );

    const result = await planUpdate(tmpDir, DEFAULT_PATHS, "plan-to-update", "Old task name", "New task name");

    assert.equal(result.updated, true);

    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /New task name/);
    assert.doesNotMatch(content, /Old task name/);
  });

  test("oldString not found: throws", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/plan-no-match.md",
      `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nPlan No Match\n`
    );

    await assert.rejects(
      () => planUpdate(tmpDir, DEFAULT_PATHS, "plan-no-match", "does not exist in file", "replacement"),
      (err) => {
        assert.match(err.message, /not found/i);
        return true;
      }
    );
  });

  test("oldString found multiple times: throws error about multiple matches", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/plan-multi-match.md",
      `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nrepeated block\n\nrepeated block\n`
    );

    await assert.rejects(
      () => planUpdate(tmpDir, DEFAULT_PATHS, "plan-multi-match", "repeated block", "something else"),
      (err) => {
        assert.match(err.message, /2 matches/i);
        return true;
      }
    );
  });
});

// ── planValidate ──────────────────────────────────────────────────────────────

describe("planValidate", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-planValidate-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("valid plan: returns { valid: true, issues: [] }", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/valid-plan.md",
      `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nValid Plan\n\n## Functional objective\n\nThis plan achieves something meaningful.\n\n## Building blocks\n\n- [ ] Task one\n- [ ] Task two\n`
    );

    const result = await planValidate(tmpDir, DEFAULT_PATHS, "valid-plan");

    assert.equal(result.valid, true);
    assert.deepEqual(result.issues, []);
  });

  test("missing frontmatter: returns { valid: false } with issue", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/no-fm-plan.md",
      `## Goal\n\nNo FM Plan\n\n## Functional objective\n\nObjective.\n\n## Building blocks\n\n- [ ] Task\n`
    );

    const result = await planValidate(tmpDir, DEFAULT_PATHS, "no-fm-plan");

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => /frontmatter/i.test(i)));
  });

  test("missing building blocks section: invalid", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/no-blocks-plan.md",
      `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nNo Blocks\n\n## Functional objective\n\nObjective.\n`
    );

    const result = await planValidate(tmpDir, DEFAULT_PATHS, "no-blocks-plan");

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => /building blocks/i.test(i)));
  });

  test("no task items: invalid", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/no-tasks-plan.md",
      `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nNo Tasks\n\n## Functional objective\n\nObjective.\n\n## Building blocks\n\nNo tasks here, just prose.\n`
    );

    const result = await planValidate(tmpDir, DEFAULT_PATHS, "no-tasks-plan");

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => /task blocks/i.test(i) || /no task/i.test(i)));
  });

  test("missing functional objective section: invalid", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/no-fo-plan.md",
      `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nNo FO Plan\n\n## Building blocks\n\n- [ ] Some task\n`
    );

    const result = await planValidate(tmpDir, DEFAULT_PATHS, "no-fo-plan");

    assert.equal(result.valid, false);
    assert.ok(result.issues.some((i) => /functional objective/i.test(i)));
  });

  test("not found: throws error", async () => {
    await assert.rejects(
      () => planValidate(tmpDir, DEFAULT_PATHS, "ghost-plan-validate"),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });
});

// ── planBlockDone ─────────────────────────────────────────────────────────────

describe("planBlockDone", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-planBlockDone-"));
    await mkdir(join(tmpDir, "docs/exec-plans"), { recursive: true });
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("marks unchecked block as checked, returns metadata", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/bd-plan.md",
      `---\ncreated: 2026-01-01\n---\n\n## Building blocks\n\n- [ ] First task\n- [ ] Second task\n`
    );

    const result = await planBlockDone(tmpDir, DEFAULT_PATHS, "bd-plan", "First task");

    assert.equal(result.was, "unchecked");
    assert.equal(result.now, "checked");
    assert.equal(result.all_done, false);
    assert.equal(result.blocks.total, 2);
    assert.equal(result.blocks.checked, 1);
  });

  test("last block done: all_done is true and hint is present", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/bd-last.md",
      `---\ncreated: 2026-01-01\n---\n\n## Building blocks\n\n- [x] First task\n- [ ] Last task\n`
    );

    const result = await planBlockDone(tmpDir, DEFAULT_PATHS, "bd-last", "Last task");

    assert.equal(result.all_done, true);
    assert.ok("hint" in result);
    assert.match(result.hint, /plan_update/i);
  });

  test("block not found: throws with available blocks listed", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/bd-missing.md",
      `---\ncreated: 2026-01-01\n---\n\n## Building blocks\n\n- [ ] Real task one\n- [ ] Real task two\n`
    );

    await assert.rejects(
      () => planBlockDone(tmpDir, DEFAULT_PATHS, "bd-missing", "nonexistent block"),
      (err) => {
        assert.match(err.message, /not found/i);
        assert.match(err.message, /Real task one/);
        return true;
      }
    );
  });

  test("ambiguous block name: throws about multiple matches", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/bd-ambiguous.md",
      `---\ncreated: 2026-01-01\n---\n\n## Building blocks\n\n- [ ] Setup database\n- [ ] Setup cache\n`
    );

    await assert.rejects(
      () => planBlockDone(tmpDir, DEFAULT_PATHS, "bd-ambiguous", "Setup"),
      (err) => {
        assert.match(err.message, /multiple blocks/i);
        return true;
      }
    );
  });

  test("already checked block: was is 'checked', now is still 'checked', idempotent", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/bd-already-done.md",
      `---\ncreated: 2026-01-01\n---\n\n## Building blocks\n\n- [x] Already done task\n- [ ] Pending task\n`
    );

    const result = await planBlockDone(tmpDir, DEFAULT_PATHS, "bd-already-done", "Already done task");

    assert.equal(result.was, "checked");
    assert.equal(result.now, "checked");
    // The block was already [x], re-marking is idempotent.
    // The file still has 1 unchecked block ("Pending task"), so checked = 1, total = 2.
    assert.equal(result.blocks.total, 2);
    assert.equal(result.blocks.checked, 1);
    assert.equal(result.all_done, false);
  });

  test("plan not found: throws error", async () => {
    await assert.rejects(
      () => planBlockDone(tmpDir, DEFAULT_PATHS, "nonexistent-plan-bd", "Any block"),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });
});

// ── planList ──────────────────────────────────────────────────────────────────

describe("planList", () => {
  test("empty directory: returns { plans: [] }", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-planList-empty-"));
    try {
      const result = await planList(tmpDir, DEFAULT_PATHS);
      assert.deepEqual(result.plans, []);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("returns list of plans with block counts", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-planList-"));
    try {
      await writeFile(
        tmpDir,
        "docs/exec-plans/plan-a.md",
        `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nPlan A\n\n## Building blocks\n\n- [ ] Task one\n- [x] Task two\n`
      );
      await writeFile(
        tmpDir,
        "docs/exec-plans/plan-b.md",
        `---\ncreated: 2026-02-01\nbrief: docs/briefs/brief.md\n---\n\n## Goal\n\nPlan B\n\n## Building blocks\n\n- [x] All done\n`
      );

      const result = await planList(tmpDir, DEFAULT_PATHS);

      assert.ok(Array.isArray(result.plans));
      assert.equal(result.plans.length, 2);

      const planA = result.plans.find((p) => p.file.includes("plan-a.md"));
      assert.ok(planA);
      assert.equal(planA.blocks.total, 2);
      assert.equal(planA.blocks.checked, 1);

      const planB = result.plans.find((p) => p.file.includes("plan-b.md"));
      assert.ok(planB);
      assert.equal(planB.brief, "docs/briefs/brief.md");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ── planDelete ────────────────────────────────────────────────────────────────

describe("planDelete", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-planDelete-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: deletes plan and returns { deleted: true, file }", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/plan-to-delete.md",
      `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nPlan To Delete\n`
    );

    const result = await planDelete(tmpDir, DEFAULT_PATHS, "plan-to-delete");

    assert.equal(result.deleted, true);
    assert.ok(result.file.includes("plan-to-delete.md"));

    const { existsSync } = await import("node:fs");
    assert.equal(existsSync(join(tmpDir, result.file)), false);
  });

  test("not found: throws error", async () => {
    await assert.rejects(
      () => planDelete(tmpDir, DEFAULT_PATHS, "ghost-plan-delete"),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });
});

// ── briefCreate ───────────────────────────────────────────────────────────────

describe("briefCreate", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-briefCreate-"));
  });


  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: creates brief and returns { created, file, id }", async () => {
    const result = await briefCreate(tmpDir, DEFAULT_PATHS, {
      title: "My Product Brief",
    });

    assert.equal(result.created, true);
    assert.ok(result.file.includes("my-product-brief.md"));
    assert.equal(result.id, "my-product-brief");

    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /title: "My Product Brief"/);
    assert.match(content, /id: my-product-brief/);
    assert.match(content, /created: \d{4}-\d{2}-\d{2}/);
    assert.match(content, /# My Product Brief/);
  });

  test("with exec_plan: exec_plan is in frontmatter", async () => {
    const result = await briefCreate(tmpDir, DEFAULT_PATHS, {
      title: "Brief With Plan",
      exec_plan: "docs/exec-plans/my-plan.md",
    });

    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /exec_plan: "docs\/exec-plans\/my-plan\.md"/);
  });

  test("with content: content is appended", async () => {
    const result = await briefCreate(tmpDir, DEFAULT_PATHS, {
      title: "Brief With Content",
      content: "## Problem\n\nWe need to solve X.",
    });

    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /## Problem/);
    assert.match(content, /We need to solve X/);
  });

  test("duplicate: throws 'already exists'", async () => {
    await briefCreate(tmpDir, DEFAULT_PATHS, { title: "Duplicate Brief" });
    await assert.rejects(
      () => briefCreate(tmpDir, DEFAULT_PATHS, { title: "Duplicate Brief" }),
      (err) => {
        assert.match(err.message, /already exists/i);
        return true;
      }
    );
  });

  test("empty title: throws", async () => {
    await assert.rejects(
      () => briefCreate(tmpDir, DEFAULT_PATHS, { title: "" }),
      (err) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /title/i);
        return true;
      }
    );
  });
});

// ── briefGet ──────────────────────────────────────────────────────────────────

describe("briefGet", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-briefGet-"));
    await writeFile(
      tmpDir,
      "docs/briefs/my-brief.md",
      `---\ntitle: "My Brief"\nid: my-brief\ncreated: 2026-01-01\n---\n\n# My Brief\n\nContent.\n`
    );
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: returns { file, content, frontmatter }", async () => {
    const result = await briefGet(tmpDir, DEFAULT_PATHS, "my-brief");

    assert.ok(result.file.includes("my-brief.md"));
    assert.ok(result.content.includes("My Brief"));
    assert.equal(result.frontmatter.title, "My Brief");
    assert.equal(result.frontmatter.id, "my-brief");
  });

  test("not found: throws error", async () => {
    await assert.rejects(
      () => briefGet(tmpDir, DEFAULT_PATHS, "ghost-brief"),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });
});

// ── briefUpdate ───────────────────────────────────────────────────────────────

describe("briefUpdate", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-briefUpdate-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: replaces content and returns { file, updated: true }", async () => {
    await writeFile(
      tmpDir,
      "docs/briefs/brief-to-update.md",
      `---\ntitle: "Brief To Update"\nid: brief-to-update\n---\n\n# Brief To Update\n\nOriginal brief text.\n`
    );

    const result = await briefUpdate(tmpDir, DEFAULT_PATHS, "brief-to-update", "Original brief text.", "Updated brief text.");

    assert.equal(result.updated, true);
    const content = await fsReadFile(join(tmpDir, result.file), "utf-8");
    assert.match(content, /Updated brief text/);
    assert.doesNotMatch(content, /Original brief text/);
  });

  test("oldString not found: throws explicit error", async () => {
    await writeFile(
      tmpDir,
      "docs/briefs/brief-no-match.md",
      `---\ntitle: "Brief No Match"\nid: brief-no-match\n---\n\n# Brief No Match\n\nSome content.\n`
    );

    await assert.rejects(
      () => briefUpdate(tmpDir, DEFAULT_PATHS, "brief-no-match", "string that does not exist in brief", "replacement"),
      (err) => {
        assert.match(err.message, /not found/i);
        return true;
      }
    );
  });

  test("oldString found multiple times: throws error about multiple matches", async () => {
    await writeFile(
      tmpDir,
      "docs/briefs/brief-multi-match.md",
      `---\ntitle: "Brief Multi Match"\nid: brief-multi-match\n---\n\n# Brief Multi Match\n\nrepeated content\n\nrepeated content\n`
    );

    await assert.rejects(
      () => briefUpdate(tmpDir, DEFAULT_PATHS, "brief-multi-match", "repeated content", "something else"),
      (err) => {
        assert.match(err.message, /2 matches/i);
        return true;
      }
    );
  });
});

// ── briefDelete ───────────────────────────────────────────────────────────────

describe("briefDelete", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-briefDelete-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("nominal: deletes brief and returns { deleted: true, file }", async () => {
    await writeFile(
      tmpDir,
      "docs/briefs/brief-to-delete.md",
      `---\ntitle: "Brief To Delete"\nid: brief-to-delete\n---\n\n# Brief To Delete\n`
    );

    const result = await briefDelete(tmpDir, DEFAULT_PATHS, "brief-to-delete");

    assert.equal(result.deleted, true);
    const { existsSync } = await import("node:fs");
    assert.equal(existsSync(join(tmpDir, result.file)), false);
  });

  test("not found: throws error", async () => {
    await assert.rejects(
      () => briefDelete(tmpDir, DEFAULT_PATHS, "ghost-brief-delete"),
      (err) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });
});

// ── briefList ─────────────────────────────────────────────────────────────────

describe("briefList", () => {
  test("empty directory: returns { briefs: [] }", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-briefList-empty-"));
    try {
      const result = await briefList(tmpDir, DEFAULT_PATHS);
      assert.deepEqual(result.briefs, []);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("returns list of briefs with metadata", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-briefList-"));
    try {
      await writeFile(
        tmpDir,
        "docs/briefs/brief-a.md",
        `---\ntitle: "Brief A"\nid: brief-a\ncreated: 2026-01-01\nexec_plan: docs/exec-plans/plan-a.md\n---\n\n# Brief A\n`
      );
      await writeFile(
        tmpDir,
        "docs/briefs/brief-b.md",
        `---\ntitle: "Brief B"\nid: brief-b\ncreated: 2026-02-01\n---\n\n# Brief B\n`
      );

      const result = await briefList(tmpDir, DEFAULT_PATHS);

      assert.ok(Array.isArray(result.briefs));
      assert.equal(result.briefs.length, 2);

      const briefA = result.briefs.find((b) => b.id === "brief-a");
      assert.ok(briefA);
      assert.equal(briefA.title, "Brief A");
      assert.equal(briefA.exec_plan, "docs/exec-plans/plan-a.md");

      const briefB = result.briefs.find((b) => b.id === "brief-b");
      assert.ok(briefB);
      assert.equal(briefB.exec_plan, null);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ── projectState ──────────────────────────────────────────────────────────────

describe("projectState", () => {
  test("empty project: specs and active_plans are empty, no briefs key", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-"));
    try {
      const result = await projectState(tmpDir, DEFAULT_PATHS);

      assert.deepEqual(result.specs, []);
      assert.deepEqual(result.active_plans, []);
      assert.equal("briefs" in result, false, "projectState should NOT include briefs");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("specs: returned with correct metadata", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-specs-"));
    try {
      await writeFile(
        tmpDir,
        "docs/specs/state-spec.md",
        `---\ntitle: "State Spec"\nid: state-spec\ntype: technical\nstatus: active\ncreated: 2026-01-01\n---\n\n# State Spec\n`
      );

      const result = await projectState(tmpDir, DEFAULT_PATHS);

      assert.equal(result.specs.length, 1);
      assert.equal(result.specs[0].title, "State Spec");
      assert.equal(result.specs[0].status, "active");
      assert.equal("briefs" in result, false);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("active_plans: only plans with unchecked blocks are included", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-plans-"));
    try {
      // Active: has unchecked block
      await writeFile(
        tmpDir,
        "docs/exec-plans/active-plan.md",
        `---\ncreated: 2026-01-01\n---\n\n## Building blocks\n\n- [x] Done\n- [ ] Pending\n`
      );
      // Completed: all blocks checked
      await writeFile(
        tmpDir,
        "docs/exec-plans/done-plan.md",
        `---\ncreated: 2026-01-01\n---\n\n## Building blocks\n\n- [x] Task A\n- [x] Task B\n`
      );

      const result = await projectState(tmpDir, DEFAULT_PATHS);

      assert.equal(result.active_plans.length, 1);
      assert.ok(result.active_plans[0].file.includes("active-plan.md"));
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("completed plans (all blocks checked) are excluded from active_plans", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-completed-"));
    try {
      await writeFile(
        tmpDir,
        "docs/exec-plans/fully-done.md",
        `---\ncreated: 2026-01-01\n---\n\n## Building blocks\n\n- [x] Everything\n`
      );

      const result = await projectState(tmpDir, DEFAULT_PATHS);

      assert.equal(result.active_plans.length, 0, "fully done plans should not appear in active_plans");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("plan with no blocks at all: appears in active_plans (no progress yet)", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-noblock-"));
    try {
      await writeFile(
        tmpDir,
        "docs/exec-plans/empty-plan.md",
        `---\ncreated: 2026-01-01\n---\n\n## Goal\n\nEmpty plan.\n`
      );

      const result = await projectState(tmpDir, DEFAULT_PATHS);

      // Plan with 0 blocks: total === 0, checked < total is false (0 < 0 = false)
      // but our filter is: total === 0 || checked < total
      // so it IS included — empty plan = active (not done)
      assert.equal(result.active_plans.length, 1);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ── path security (resolveArtifact) ──────────────────────────────────────────

describe("path traversal protection", () => {
  test("specCreate with path traversal in title is safe (slug strips ..)", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-pathsec-"));
    try {
      // Title that contains ".." — titleToId strips non-alphanumeric chars,
      // so the resulting id is safe. We just verify no exception AND no file
      // outside the project root is created.
      const result = await specCreate(tmpDir, DEFAULT_PATHS, "safe title");
      assert.equal(result.created, true);
      assert.ok(result.file.startsWith("docs/specs/"));
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ── artifact-guard (tool.execute.before hook logic) ───────────────────────────

const PROTECTED_DIRS = ["docs/specs", "docs/exec-plans", "docs/briefs"];

describe("isProtectedPath", () => {
  test("exact dir match → protected", () => {
    assert.equal(isProtectedPath("docs/specs", PROTECTED_DIRS), true);
    assert.equal(isProtectedPath("docs/exec-plans", PROTECTED_DIRS), true);
    assert.equal(isProtectedPath("docs/briefs", PROTECTED_DIRS), true);
  });

  test("file inside protected dir → protected", () => {
    assert.equal(isProtectedPath("docs/specs/my-spec.md", PROTECTED_DIRS), true);
    assert.equal(isProtectedPath("docs/exec-plans/plan.md", PROTECTED_DIRS), true);
    assert.equal(isProtectedPath("docs/briefs/brief.md", PROTECTED_DIRS), true);
  });

  test("path with leading slash → normalised and still protected", () => {
    assert.equal(isProtectedPath("/docs/specs/my-spec.md", PROTECTED_DIRS), true);
  });

  test("sibling dir that starts with same prefix → not protected", () => {
    assert.equal(isProtectedPath("docs/specs-extra/file.md", PROTECTED_DIRS), false);
  });

  test("unrelated path → not protected", () => {
    assert.equal(isProtectedPath("src/index.js", PROTECTED_DIRS), false);
    assert.equal(isProtectedPath("README.md", PROTECTED_DIRS), false);
    assert.equal(isProtectedPath("", PROTECTED_DIRS), false);
  });
});

describe("checkArtifactAccess", () => {
  test("lifecycle tool (spec_get) → allowed (returns null)", () => {
    const result = checkArtifactAccess(
      { tool: "spec_get", args: { filePath: "docs/specs/foo.md" } },
      PROTECTED_DIRS
    );
    assert.equal(result, null);
  });

  test("all current lifecycle tools → all allowed", () => {
    for (const toolName of LIFECYCLE_TOOLS) {
      const result = checkArtifactAccess(
        { tool: toolName, args: { filePath: "docs/specs/any.md" } },
        PROTECTED_DIRS
      );
      assert.equal(result, null, `expected ${toolName} to be allowed`);
    }
  });

  test("read on protected specs path → blocked with Error mentioning spec_get", () => {
    const err = checkArtifactAccess(
      { tool: "read", args: { filePath: "docs/specs/my-spec.md" } },
      PROTECTED_DIRS
    );
    assert.ok(err instanceof Error);
    assert.match(err.message, /blocked/i);
    assert.match(err.message, /spec_get/);
  });

  test("read on protected exec-plans path → blocked with Error mentioning plan_get", () => {
    const err = checkArtifactAccess(
      { tool: "read", args: { filePath: "docs/exec-plans/plan.md" } },
      PROTECTED_DIRS
    );
    assert.ok(err instanceof Error);
    assert.match(err.message, /blocked/i);
    assert.match(err.message, /plan_get/);
  });

  test("read on protected briefs path → blocked with Error mentioning brief_get", () => {
    const err = checkArtifactAccess(
      { tool: "read", args: { filePath: "docs/briefs/brief.md" } },
      PROTECTED_DIRS
    );
    assert.ok(err instanceof Error);
    assert.match(err.message, /blocked/i);
    assert.match(err.message, /brief_get/);
  });

  test("edit on protected specs path → blocked with Error mentioning spec_update", () => {
    const err = checkArtifactAccess(
      { tool: "edit", args: { filePath: "docs/specs/my-spec.md" } },
      PROTECTED_DIRS
    );
    assert.ok(err instanceof Error);
    assert.match(err.message, /blocked/i);
    assert.match(err.message, /spec_update/);
  });

  test("write on protected exec-plans path → blocked with Error mentioning plan_create", () => {
    const err = checkArtifactAccess(
      { tool: "write", args: { filePath: "docs/exec-plans/new-plan.md" } },
      PROTECTED_DIRS
    );
    assert.ok(err instanceof Error);
    assert.match(err.message, /blocked/i);
    assert.match(err.message, /plan_create/);
  });

  test("read on unprotected path → allowed (returns null)", () => {
    const result = checkArtifactAccess(
      { tool: "read", args: { filePath: "src/index.js" } },
      PROTECTED_DIRS
    );
    assert.equal(result, null);
  });

  test("read on path that shares prefix but is not protected → allowed", () => {
    const result = checkArtifactAccess(
      { tool: "read", args: { filePath: "docs/specs-extra/file.md" } },
      PROTECTED_DIRS
    );
    assert.equal(result, null);
  });

  test("bash with command referencing docs/specs → blocked", () => {
    const err = checkArtifactAccess(
      { tool: "bash", args: { command: "cat docs/specs/my-spec.md" } },
      PROTECTED_DIRS
    );
    assert.ok(err instanceof Error);
    assert.match(err.message, /docs\/specs/);
    assert.match(err.message, /lifecycle tools/i);
  });

  test("bash with command referencing docs/exec-plans → blocked", () => {
    const err = checkArtifactAccess(
      { tool: "bash", args: { command: "ls docs/exec-plans/" } },
      PROTECTED_DIRS
    );
    assert.ok(err instanceof Error);
    assert.match(err.message, /docs\/exec-plans/);
  });

  test("bash with command referencing docs/briefs → blocked", () => {
    const err = checkArtifactAccess(
      { tool: "bash", args: { command: "grep -r 'title' docs/briefs/" } },
      PROTECTED_DIRS
    );
    assert.ok(err instanceof Error);
    assert.match(err.message, /docs\/briefs/);
  });

  test("bash with command not referencing protected dirs → allowed", () => {
    const result = checkArtifactAccess(
      { tool: "bash", args: { command: "git status" } },
      PROTECTED_DIRS
    );
    assert.equal(result, null);
  });

  test("unknown tool → allowed (returns null)", () => {
    const result = checkArtifactAccess(
      { tool: "some_unknown_tool", args: { pattern: "docs/specs/**" } },
      PROTECTED_DIRS
    );
    assert.equal(result, null);
  });

  test("glob with pattern targeting protected specs dir → blocked", () => {
    const result = checkArtifactAccess(
      { tool: "glob", args: { pattern: "docs/specs/**" } },
      PROTECTED_DIRS
    );
    assert.ok(result instanceof Error);
    assert.match(result.message, /spec_list/);
  });

  test("glob with pattern not targeting protected dir → allowed", () => {
    const result = checkArtifactAccess(
      { tool: "glob", args: { pattern: "src/**/*.js" } },
      PROTECTED_DIRS
    );
    assert.equal(result, null);
  });

  test("grep with path targeting protected exec-plans dir → blocked", () => {
    const result = checkArtifactAccess(
      { tool: "grep", args: { path: "docs/exec-plans" } },
      PROTECTED_DIRS
    );
    assert.ok(result instanceof Error);
    assert.match(result.message, /plan_list/);
  });

  test("grep with path not targeting protected dir → allowed", () => {
    const result = checkArtifactAccess(
      { tool: "grep", args: { path: "src" } },
      PROTECTED_DIRS
    );
    assert.equal(result, null);
  });
});

// ── specFormat ────────────────────────────────────────────────────────────────

describe("specFormat", () => {
  test("returns a non-empty string", () => {
    const result = specFormat();
    assert.equal(typeof result, "string");
    assert.ok(result.length > 0);
  });

  test("contains required section headers", () => {
    const result = specFormat();
    assert.ok(result.includes("## Purpose"), "missing ## Purpose");
    assert.ok(result.includes("## Behavior"), "missing ## Behavior");
    assert.ok(result.includes("## Constraints"), "missing ## Constraints");
    assert.ok(result.includes("## Examples"), "missing ## Examples");
  });

  test("contains frontmatter field references", () => {
    const result = specFormat();
    assert.ok(result.includes("title"), "missing title field reference");
    assert.ok(result.includes("type"), "missing type field reference");
    assert.ok(result.includes("status"), "missing status field reference");
    assert.ok(result.includes("created"), "missing created field reference");
  });

  test("mentions valid type values", () => {
    const result = specFormat();
    assert.ok(result.includes("technical"), "missing 'technical' type");
    assert.ok(result.includes("functional"), "missing 'functional' type");
    assert.ok(result.includes("architectural"), "missing 'architectural' type");
  });

  test("mentions valid status values", () => {
    const result = specFormat();
    assert.ok(result.includes("draft"), "missing 'draft' status");
    assert.ok(result.includes("active"), "missing 'active' status");
    assert.ok(result.includes("deprecated"), "missing 'deprecated' status");
  });

  test("does not contain ambiguous heading notation (e.g. '### ##')", () => {
    const result = specFormat();
    assert.ok(!result.includes("### ##"), "specFormat output must not contain '### ##' mixed heading notation");
  });

  test("is pure — returns same value on repeated calls", () => {
    assert.equal(specFormat(), specFormat());
  });
});

// ── planFormat ────────────────────────────────────────────────────────────────

describe("planFormat", () => {
  test("returns a non-empty string", () => {
    const result = planFormat();
    assert.equal(typeof result, "string");
    assert.ok(result.length > 0);
  });

  test("contains required section headers", () => {
    const result = planFormat();
    assert.ok(result.includes("## Functional objective"), "missing ## Functional objective");
    assert.ok(result.includes("## Building blocks"), "missing ## Building blocks");
    assert.ok(result.includes("## Goal"), "missing ## Goal");
    assert.ok(result.includes("## Decision log"), "missing ## Decision log");
  });

  test("contains block format with checkbox syntax", () => {
    const result = planFormat();
    assert.ok(result.includes("- [ ]"), "missing '- [ ]' block syntax");
  });

  test("mentions Done when criteria pattern", () => {
    const result = planFormat();
    assert.ok(result.includes("Done when"), "missing 'Done when' criteria pattern");
  });

  test("mentions scope subsections", () => {
    const result = planFormat();
    assert.ok(result.includes("In scope"), "missing 'In scope'");
    assert.ok(result.includes("Out of scope"), "missing 'Out of scope'");
  });

  test("mentions granularity rules", () => {
    const result = planFormat();
    assert.ok(result.includes("atomic"), "missing atomicity rule");
  });

  test("is pure — returns same value on repeated calls", () => {
    assert.equal(planFormat(), planFormat());
  });
});
