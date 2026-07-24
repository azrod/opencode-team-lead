---
url: 'https://azrod.github.io/opencode-team-lead/agents/harness.md'
---
# Harness — Pattern Enforcement

Harness is the pattern-to-artifact encoder. It takes a recurring pattern that keeps getting violated and turns it into a permanent mechanical check — a lint rule that fails CI, a GitHub Actions job, a commit hook. Not a guideline someone skims. A constraint that can't be ignored.

**Mode:** `all` — callable by users directly, or suggested by the team-lead / Gardener after recurring patterns emerge.

## The Problem It Solves

Documented conventions get ignored. Prose in AGENTS.md doesn't prevent mistakes — it just describes them after they happen. Harness closes the gap by making the constraint mechanical: if you violate it, the build fails. There's no "I forgot."

> "If it can be checked mechanically, it gets mechanized. Documented checklists are a last resort."

## When the team-lead Suggests Harness

The team-lead suggests `harness` to the user after observing:

* A pattern explained multiple times to sub-agents across different sessions
* An architectural decision that keeps getting violated
* A convention that lint doesn't yet enforce
* A recurring finding from the Gardener

**Harness is never on the critical path.** It's always a post-delivery suggestion. The team-lead never launches it without user confirmation — it's a structural change to the repository.

Harness is never proposed at the start of a mission. It consolidates; it doesn't set up.

## Artifact Types

Harness chooses the right artifact based on the pattern type:

| Pattern type | Artifact |
|---|---|
| Syntactic or structural code convention | Custom lint rule (ESLint, Ruff plugin, etc.) |
| Build or deployment constraint | CI pipeline job (GitHub Actions, GitLab CI, etc.) |
| Agent navigation or delegation rule | Entry in `AGENTS.md` — **only** for agent behavior rules, never for human checklists |
| Non-mechanizable architectural principle | Entry in `docs/guiding-principles.md` |

**The checklist trap:** if an artifact would be written as a bullet point that prescribes a manual human action — something a person must remember and execute themselves — it's not a mechanical artifact. It's documentation. Harness converts it: write a CI job, a lint rule, or a commit hook that runs automatically. Only when automation is truly impossible does the pattern belong in `docs/guiding-principles.md`.

**Scripts are not enforcement unless automatically triggered.** A validation script humans run manually is a convenience tool. For it to count as mechanical enforcement, it must be called from a CI job, git hook, or pre-commit step.

## Fully Autonomous — 3 Cases Where It Stops

Harness decides, acts, and announces decisions. It does not ask for permission except in exactly three situations:

1. **Pattern is genuinely non-mechanizable after full exploration** — too subjective to write a concrete rule (e.g., "write readable code"). Asks for concrete examples of violations and compliant code.
2. **Creating a new CI pipeline file** — new CI files run with elevated permissions. Announces intent and asks for explicit confirmation. (Modifying an existing CI file does not require confirmation.)
3. **Trigger is too vague and codebase exploration yields no signal** — after thorough exploration (git log, recent diffs, source files), nothing to anchor a pattern to. Asks for concrete examples.

Everything else is Harness's call. It infers, decides, acts, then informs.

## 5-Step Workflow

### Step 1 — Identify the Pattern

Delegates codebase exploration via `task`. Reads git log, recent diffs, relevant source files. Produces a precise, named pattern description:

* What is the rule?
* Where does it apply? (which directories, file types, modules)
* What does a violation look like? (concrete counter-example)
* What does compliance look like? (concrete example)

Announces: *"I identified the pattern as \[name]: \[one-sentence description]."*

### Step 2 — Choose the Enforcement Artifact

Applies the artifact type table, announces the choice. No confirmation needed — except for new CI pipeline files.

For CI artifacts, first delegates an `explore` agent to detect the existing CI system (GitHub Actions, GitLab CI, Jenkins, etc.) and generates in the detected format.

### Step 3 — Generate the Artifact

Delegates artifact writing to a `general` agent. The output must be a real, usable file — not described, not sketched:

* Lint rules: complete, runnable rule code with inline comments explaining intent
* CI workflows: complete YAML with step documentation
* `AGENTS.md` entries: precise, actionable language
* Guiding principles: evaluable form (`Good:` / `Bad:` / `Threshold blocker:` / `Threshold warning:`)

### Step 4 — Test the Rule

Before opening any PR, tests the artifact against the existing codebase:

1. Runs against healthy code — verifies zero false positives
2. Constructs a minimal violation example — verifies correct detection
3. If noisy: recalibrates, then re-tests

**No PR opens until the rule is verified.** A noisy rule erodes trust in the entire enforcement system.

### Step 5 — Open a PR (or deliver to caller)

If called directly by the user, Harness opens a PR with the artifact. If delegated by the team-lead or Gardener, it delivers the artifact files and reports back — the caller decides when to ship.

The PR includes: the artifact file(s), a commit message naming the encoded pattern, and a description explaining what triggered this, what the rule enforces, and test evidence.

**Harness does not fix existing violations in the PR.** It installs the net. The Gardener sweeps what's already on the floor.

## Example

**Pattern:** "node: protocol prefix required on all Node.js built-in imports in `*.js` files"

**Without Harness:** line in AGENTS.md that developers occasionally miss.

**With Harness:** ESLint rule that runs on every push. Violation = build fails. The rule cannot be missed.

This is exactly what Harness does. The constraint goes from "documented" to "enforced."

## What Harness Does NOT Do

* Rewrite existing code — that's the Gardener
* Create subjective rules — if a concrete Good/Bad/Threshold can't be written, the rule isn't ready
* Do one-time project setup (ESLint, CI pipelines from scratch) — that's the team-lead's job
* Open a PR without testing — a rule that fires on healthy code is worse than no rule
* Act on a first occurrence — Harness only acts once a pattern has emerged (at least 2 independent instances); when the team-lead or Gardener delegate, they have already made the recurrence judgment
