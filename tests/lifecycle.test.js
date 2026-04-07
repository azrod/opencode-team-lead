// tests/lifecycle.test.js
// Comprehensive test suite for tools/lifecycle.js
// Uses only Node.js built-ins: node:test, node:assert, node:fs/promises, node:os, node:path

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { writeFile as fsWriteFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  projectState,
  markBlockDone,
  completePlan,
  registerSpec,
  checkArtifacts,
} from "../tools/lifecycle.js";

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

// ── projectState ─────────────────────────────────────────────────────────────

describe("projectState", () => {
  test("empty project (dirs don't exist) → all arrays empty", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-"));
    try {
      const result = await projectState(tmpDir, DEFAULT_PATHS);

      assert.deepEqual(result.specs, []);
      assert.deepEqual(result.exec_plans, []);
      assert.deepEqual(result.briefs, []);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("one spec file with frontmatter → parsed correctly into specs[0]", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-"));
    try {
      await writeFile(
        tmpDir,
        "docs/specs/my-spec.md",
        `---\ntitle: "My Feature"\nstatus: active\ncreated: 2026-01-01\nid: SPEC-001\ncriticality: high\n---\n\n# My Feature\n`
      );

      const result = await projectState(tmpDir, DEFAULT_PATHS);

      assert.equal(result.specs.length, 1);
      const spec = result.specs[0];
      assert.equal(spec.title, "My Feature");
      assert.equal(spec.status, "active");
      assert.equal(spec.created, "2026-01-01");
      assert.equal(spec.id, "SPEC-001");
      assert.equal(spec.criticality, "high");
      assert.match(spec.file, /my-spec\.md$/);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("one spec file without frontmatter → all fields null", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-"));
    try {
      await writeFile(
        tmpDir,
        "docs/specs/no-frontmatter.md",
        `# Just a title\n\nNo frontmatter here.\n`
      );

      const result = await projectState(tmpDir, DEFAULT_PATHS);
      const spec = result.specs.find((s) => s.file.includes("no-frontmatter"));

      assert.notEqual(spec, undefined);
      assert.equal(spec.title, null);
      assert.equal(spec.status, null);
      assert.equal(spec.id, null);
      assert.equal(spec.criticality, null);
      assert.equal(spec.created, null);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("one exec-plan with checked and unchecked blocks → correct block counts", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-"));
    try {
      await writeFile(
        tmpDir,
        "docs/exec-plans/plan-a.md",
        `---\nstatus: in-progress\n---\n\n## Tasks\n\n- [x] First task\n- [ ] Second task\n`
      );

      const result = await projectState(tmpDir, DEFAULT_PATHS);

      assert.equal(result.exec_plans.length, 1);
      const plan = result.exec_plans[0];
      assert.equal(plan.blocks.total, 2);
      assert.equal(plan.blocks.checked, 1);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("exec-plan with all blocks checked but status != completed → warning present", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-projectState-"));
    try {
      await writeFile(
        tmpDir,
        "docs/exec-plans/plan-stale.md",
        `---\nstatus: in-progress\n---\n\n- [x] Task one\n- [x] Task two\n`
      );

      const result = await projectState(tmpDir, DEFAULT_PATHS);
      const plan = result.exec_plans.find((p) => p.file.includes("plan-stale"));

      assert.notEqual(plan, undefined);
      assert.ok(
        "warning" in plan,
        "expected a warning field when all blocks are checked but status != completed"
      );
      assert.match(plan.warning, /status/i);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ── markBlockDone ─────────────────────────────────────────────────────────────

describe("markBlockDone", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-markBlock-"));
    await mkdir(join(tmpDir, "docs/exec-plans"), { recursive: true });
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("mark unchecked block → becomes checked, returns correct metadata", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/plan.md",
      `---\nstatus: in-progress\n---\n\n- [ ] Do the thing\n- [ ] Another task\n`
    );

    const result = await markBlockDone(tmpDir, "docs/exec-plans/plan.md", "Do the thing");

    assert.equal(result.was, "unchecked");
    assert.equal(result.now, "checked");
    assert.equal(result.all_done, false);
  });

  test("mark already-checked block → no error, was: checked", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/plan-already.md",
      `---\nstatus: in-progress\n---\n\n- [x] Already done\n- [ ] Still pending\n`
    );

    const result = await markBlockDone(
      tmpDir,
      "docs/exec-plans/plan-already.md",
      "Already done"
    );

    assert.equal(result.was, "checked");
    assert.equal(result.now, "checked");
  });

  test("last remaining unchecked block → all_done: true and hint present", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/plan-last.md",
      `---\nstatus: in-progress\n---\n\n- [x] First task\n- [ ] Last task\n`
    );

    const result = await markBlockDone(
      tmpDir,
      "docs/exec-plans/plan-last.md",
      "Last task"
    );

    assert.equal(result.all_done, true);
    assert.ok("hint" in result, "expected a hint field when all blocks are done");
    assert.ok(result.hint.length > 0);
  });

  test("block name not found → throws with 'not found' and lists available blocks", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/plan-missing.md",
      `---\nstatus: in-progress\n---\n\n- [ ] Real task one\n- [ ] Real task two\n`
    );

    await assert.rejects(
      () => markBlockDone(tmpDir, "docs/exec-plans/plan-missing.md", "nonexistent block"),
      (err) => {
        assert.match(err.message, /block .+ not found/i);
        assert.match(err.message, /Real task one/);
        assert.match(err.message, /Real task two/);
        return true;
      }
    );
  });

  test("ambiguous name matching multiple blocks → throws with 'multiple blocks'", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/plan-ambiguous.md",
      `---\nstatus: in-progress\n---\n\n- [ ] Setup database\n- [ ] Setup cache\n`
    );

    await assert.rejects(
      () => markBlockDone(tmpDir, "docs/exec-plans/plan-ambiguous.md", "Setup"),
      (err) => {
        assert.match(err.message, /multiple blocks/i);
        return true;
      }
    );
  });

  test("file not found → throws with 'file not found'", async () => {
    await assert.rejects(
      () => markBlockDone(tmpDir, "docs/exec-plans/does-not-exist.md", "anything"),
      (err) => {
        assert.match(err.message, /file not found/i);
        return true;
      }
    );
  });
});

// ── completePlan ──────────────────────────────────────────────────────────────

describe("completePlan", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-completePlan-"));
    await mkdir(join(tmpDir, "docs/exec-plans"), { recursive: true });
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("all blocks checked → sets status: completed, returns correct shape", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/done.md",
      `---\nstatus: in-progress\n---\n\n- [x] Task A\n- [x] Task B\n`
    );

    const result = await completePlan(tmpDir, "docs/exec-plans/done.md");

    assert.equal(result.status, "completed");
    assert.equal(result.updated, new Date().toISOString().slice(0, 10));
    assert.equal(result.file, "docs/exec-plans/done.md");
  });

  test("all blocks checked → file on disk reflects status: completed", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/done-disk.md",
      `---\nstatus: in-progress\n---\n\n- [x] Single task\n`
    );

    await completePlan(tmpDir, "docs/exec-plans/done-disk.md");

    const { readFile: rf } = await import("node:fs/promises");
    const content = await rf(join(tmpDir, "docs/exec-plans/done-disk.md"), "utf-8");
    assert.match(content, /status: completed/);
  });

  test("has unchecked block → throws about unchecked blocks", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/partial.md",
      `---\nstatus: in-progress\n---\n\n- [x] Done\n- [ ] Not done\n`
    );

    await assert.rejects(
      () => completePlan(tmpDir, "docs/exec-plans/partial.md"),
      (err) => {
        assert.match(err.message, /unchecked/i);
        return true;
      }
    );
  });

  test("no frontmatter → throws about frontmatter", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/no-fm.md",
      `# Just a heading\n\n- [x] Some task\n`
    );

    await assert.rejects(
      () => completePlan(tmpDir, "docs/exec-plans/no-fm.md"),
      (err) => {
        assert.match(err.message, /[Ff]rontmatter/i);
        return true;
      }
    );
  });

  test("status field missing from frontmatter → throws about status field", async () => {
    await writeFile(
      tmpDir,
      "docs/exec-plans/no-status.md",
      `---\ntitle: "No status here"\n---\n\n- [x] Task\n`
    );

    await assert.rejects(
      () => completePlan(tmpDir, "docs/exec-plans/no-status.md"),
      (err) => {
        assert.match(err.message, /'status' missing/i);
        return true;
      }
    );
  });

  test("file not found → throws with 'file not found'", async () => {
    await assert.rejects(
      () => completePlan(tmpDir, "docs/exec-plans/ghost.md"),
      (err) => {
        assert.match(err.message, /file not found/i);
        return true;
      }
    );
  });
});

// ── registerSpec ──────────────────────────────────────────────────────────────

describe("registerSpec", () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-registerSpec-"));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  test("new file → creates file with correct frontmatter and returns { created: true, file }", async () => {
    const result = await registerSpec(
      tmpDir,
      DEFAULT_PATHS,
      "my-feature.md",
      "My Feature"
    );

    assert.equal(result.created, true);
    assert.ok(result.file.includes("my-feature.md"));

    const { readFile: rf } = await import("node:fs/promises");
    const content = await rf(join(tmpDir, result.file), "utf-8");

    assert.match(content, /^---\n/);
    assert.match(content, /title: "My Feature"/);
    assert.match(content, /status: draft/);
    assert.match(content, /created: \d{4}-\d{2}-\d{2}/);
    assert.match(content, /---\n/);
    assert.match(content, /# My Feature/);
  });

  test("file already exists → throws with 'already exists'", async () => {
    await mkdir(join(tmpDir, DEFAULT_PATHS.specs), { recursive: true });
    await writeFile(tmpDir, `${DEFAULT_PATHS.specs}/existing.md`, `# Existing\n`);

    await assert.rejects(
      () => registerSpec(tmpDir, DEFAULT_PATHS, "existing.md", "Existing"),
      (err) => {
        assert.match(err.message, /already exists/i);
        return true;
      }
    );
  });

  test("path traversal → throws with 'escapes project root'", async () => {
    await assert.rejects(
      () =>
        registerSpec(
          tmpDir,
          DEFAULT_PATHS,
          "../../etc/passwd",
          "Evil"
        ),
      (err) => {
        assert.match(err.message, /escapes project root/i);
        return true;
      }
    );
  });

  test("spec file in a subdirectory that doesn't exist yet → directory is created", async () => {
    const result = await registerSpec(
      tmpDir,
      DEFAULT_PATHS,
      "subdir/deep-spec.md",
      "Deep Spec"
    );

    assert.equal(result.created, true);

    const { existsSync } = await import("node:fs");
    assert.ok(existsSync(join(tmpDir, result.file)));
  });
});

// ── checkArtifacts ────────────────────────────────────────────────────────────

describe("checkArtifacts", () => {
  test("clean project (no files) → no problems, clean summary", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-check-clean-"));
    try {
      const result = await checkArtifacts(tmpDir, DEFAULT_PATHS);
      assert.deepEqual(result.problems, []);
      assert.equal(result.summary, "All artifacts are consistent.");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("exec-plan: all blocks checked, status not completed → blocking plan_stale_status", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-checkArtifacts-"));
    try {
      await writeFile(
        tmpDir,
        "docs/exec-plans/stale.md",
        `---\nstatus: in-progress\nbrief: docs/briefs/stale-brief.md\n---\n\n- [x] Block A\n- [x] Block B\n`
      );
      await writeFile(
        tmpDir,
        "docs/briefs/stale-brief.md",
        `---\nexec_plan: docs/exec-plans/stale.md\n---\n\n# Brief\n`
      );

      const result = await checkArtifacts(tmpDir, DEFAULT_PATHS);

      const problem = result.problems.find((p) => p.type === "plan_stale_status");
      assert.notEqual(problem, undefined, "expected a plan_stale_status problem");
      assert.equal(problem.severity, "blocking");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("exec-plan: missing brief field → warning plan_missing_brief", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-checkArtifacts-"));
    try {
      await writeFile(
        tmpDir,
        "docs/exec-plans/no-brief.md",
        `---\nstatus: in-progress\n---\n\n- [ ] Task\n`
      );

      const result = await checkArtifacts(tmpDir, DEFAULT_PATHS);

      const problem = result.problems.find(
        (p) => p.type === "plan_missing_brief" && p.file.includes("no-brief")
      );
      assert.notEqual(problem, undefined, "expected a plan_missing_brief problem");
      assert.equal(problem.severity, "warning");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("exec-plan: brief field points to non-existent file → blocking plan_brief_dead", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-checkArtifacts-"));
    try {
      await writeFile(
        tmpDir,
        "docs/exec-plans/dead-brief.md",
        `---\nstatus: in-progress\nbrief: docs/briefs/ghost.md\n---\n\n- [ ] Task\n`
      );

      const result = await checkArtifacts(tmpDir, DEFAULT_PATHS);

      const problem = result.problems.find(
        (p) => p.type === "plan_brief_dead" && p.file.includes("dead-brief")
      );
      assert.notEqual(problem, undefined, "expected a plan_brief_dead problem");
      assert.equal(problem.severity, "blocking");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("brief: missing exec_plan field → warning brief_missing_plan", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-checkArtifacts-"));
    try {
      await writeFile(
        tmpDir,
        "docs/briefs/no-plan.md",
        `---\nproject: some-project\n---\n\n# Brief without exec_plan\n`
      );

      const result = await checkArtifacts(tmpDir, DEFAULT_PATHS);

      const problem = result.problems.find(
        (p) => p.type === "brief_missing_plan" && p.file.includes("no-plan")
      );
      assert.notEqual(problem, undefined, "expected a brief_missing_plan problem");
      assert.equal(problem.severity, "warning");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("spec: status draft, created 40 days ago → warning spec_stale_draft", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-checkArtifacts-"));
    try {
      const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      await writeFile(
        tmpDir,
        "docs/specs/old-draft.md",
        `---\ntitle: "Old Draft"\nstatus: draft\ncreated: ${fortyDaysAgo}\n---\n\n# Old Draft\n`
      );

      const result = await checkArtifacts(tmpDir, DEFAULT_PATHS);

      const problem = result.problems.find(
        (p) => p.type === "spec_stale_draft" && p.file.includes("old-draft")
      );
      assert.notEqual(problem, undefined, "expected a spec_stale_draft problem");
      assert.equal(problem.severity, "warning");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  test("spec: status draft, created today → no stale warning", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "lifecycle-checkArtifacts-"));
    try {
      const todayStr = new Date().toISOString().slice(0, 10);

      await writeFile(
        tmpDir,
        "docs/specs/fresh-draft.md",
        `---\ntitle: "Fresh Draft"\nstatus: draft\ncreated: ${todayStr}\n---\n\n# Fresh Draft\n`
      );

      const result = await checkArtifacts(tmpDir, DEFAULT_PATHS);

      const staleProblems = result.problems.filter(
        (p) => p.type === "spec_stale_draft" && p.file.includes("fresh-draft")
      );
      assert.equal(staleProblems.length, 0, "should not flag a spec created today as stale");
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
