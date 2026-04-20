# Spec Writer Skill

Templates, examples, and validation checklists for writing agent specification files in the opencode-team-lead project.

## Quick Start

1. **Load the skill** (if using OpenCode):
   ```
   @skill spec-writer
   ```

2. **Read the template**:
   ```bash
   cat template.md
   ```

3. **Study examples** in `examples/`:
   - `researcher-agent.md` — Leaf node, read-only, external data
   - `bug-finder-agent.md` — Orchestrator, delegation-only
   - `planning-agent.md` — Artifact producer, writes to disk

4. **Write your spec** following the template structure

5. **Validate** using `checklist.md`

6. **Save** to `../../docs/specs/{agent-name}-agent.md`

## Files in This Skill

| File | Purpose | Lines |
|------|---------|-------|
| `SKILL.md` | Main skill instructions, workflow, style guide | 262 |
| `template.md` | Empty spec template with inline guidance | 242 |
| `checklist.md` | Validation checklist (run before commit) | 143 |
| `examples/researcher-agent.md` | Example: external knowledge retrieval agent | 236 |
| `examples/planning-agent.md` | Example: exec-plan producer | 187 |
| `examples/bug-finder-agent.md` | Example: bug investigation orchestrator | 115 |

## When to Use This Skill

- Creating a new agent spec in `docs/specs/`
- Updating an existing spec to match project standards
- Reviewing someone else's spec for completeness
- Learning the spec format before contributing

## Key Principles

1. **Default-deny permissions** — Only grant what's strictly necessary
2. **Justify everything** — Every permission, every config value needs rationale
3. **Concrete over abstract** — Show templates, examples, decision tables
4. **English only** — Project standard (even if examples show mixed languages)
5. **Opinionated tone** — Direct, no corporate-speak, no hedging

## Important Note on Examples

The examples in `examples/` are **snapshots** copied from `docs/specs/` at the time of plugin release. They may diverge from the live specs in the repository.

If you're contributing to the project:
- Update both `docs/specs/` AND `skills/spec-writer/examples/` when changing a spec
- Or use `docs/specs/` directly as your reference (more up-to-date)

## Links

- [Skill documentation](SKILL.md)
- [Project docs index](../../docs/index.md)
- [Architecture](../../docs/architecture.md)
- [Guiding principles](../../docs/guiding-principles.md)
