---
name: spec-writer
description: Provides templates, examples, and validation checklists for writing agent specification files in the opencode-team-lead project. Use when creating or updating agent specs in docs/specs/.
---

# Spec Writer Skill

## Overview

This skill helps you write high-quality agent specification files for the opencode-team-lead project. It provides templates, real-world examples, and validation checklists to ensure consistency and completeness.

**Use this skill when:**
- Creating a new agent spec in `docs/specs/`
- Updating an existing spec to match project standards
- Reviewing someone else's spec for completeness
- Learning the spec format before contributing to the project

## Resources Bundled

All files in this skill directory:

| File | Purpose |
|------|---------|
| `template.md` | Empty spec template with all required sections and inline guidance |
| `checklist.md` | Validation checklist to run before committing a spec |
| `examples/researcher-agent.md` | Example spec — external knowledge retrieval agent |
| `examples/bug-finder-agent.md` | Example spec — structured bug investigation orchestrator |
| `examples/planning-agent.md` | Example spec — exec-plan producer |

## Workflow

### Phase 1 — Load Template

Read `template.md` in this skill directory. This is your starting point — all required sections with inline guidance on what to write.

```bash
# From the skill directory
cat template.md
```

Copy the template structure to your target location: `docs/specs/{agent-name}-agent.md`

### Phase 2 — Study Examples

Read the three example specs in `examples/`:

- **`researcher-agent.md`** — Shows how to spec a leaf node agent (no delegation, read-only, external data fetching). Good reference for security considerations, anti-patterns, and structured output formats.
- **`bug-finder-agent.md`** — Shows how to spec an orchestrator agent (delegates everything, never touches code). Good reference for phased workflows and confidence levels.
- **`planning-agent.md`** — Shows how to spec an artifact-producing agent (writes files to specific directories). Good reference for lifecycle management and handoffs between agents.

Look for patterns:
- How are permissions justified?
- How are workflows broken into phases?
- What level of detail is appropriate?
- What anti-patterns are worth calling out?

### Phase 3 — Write the Spec

Fill in the template with agent-specific content. Follow these guidelines:

#### Frontmatter
- **Status:** Start with `draft`, change to `stable` once the agent is implemented and validated
- **Created/Updated:** Use ISO 8601 date format (YYYY-MM-DD)

#### Overview Section
- 2-3 sentences maximum
- Focus on the agent's role and position in the system
- Include a one-line "sound bite" quote if it helps crystallize the agent's identity

#### When to Use / Triggers Section
- Decision table or bullet list
- Be explicit about what this agent does NOT handle (redirect to other agents)
- Include both Orion-triggered and user-triggered scenarios

#### Permissions Section
- Table format: Tool | Permission | Rationale
- Justify every `allow` entry — why does the agent need this?
- Call out important `deny` entries — why is this restricted?
- Default-deny mindset: only grant what's strictly necessary

#### Config Section
- **Mode:** `all` (user + Orion) or `subagent` (Orion only)
- **Temperature:** 0.0-0.3 for deterministic tasks, 0.5-0.7 for creative tasks, 1.0 for maximum creativity
- **Variant:** `standard` (128k), `extended` (200k), `max` (512k) — justify based on expected context needs
- **Color:** UI indicator (primary, info, success, warning, danger)

#### Workflow Section
- Break into numbered phases (Phase 1, Phase 2, etc.)
- Each phase should have a clear deliverable or state transition
- Use sub-bullets for step-by-step instructions within a phase
- Include decision points (if X, then Y)

#### Output Format Section
- Show the structure of what the agent returns
- Use markdown code blocks for templates
- Include field descriptions if the output is structured data

#### Anti-Patterns Section
- List common mistakes or misuses
- Format: `**Pattern name** — Why it's wrong, what to do instead`
- Focus on patterns you've actually seen or anticipate based on the agent's role

#### Security Considerations Section
- Only include this if the agent has security-relevant permissions
- Call out specific risks: SSRF, prompt injection, data exfiltration, etc.
- Specify mitigation strategies (both prompt-level and platform-level)
- Be explicit about what protections are the agent's responsibility vs. the platform's

### Phase 4 — Validate

Run through `checklist.md` in this directory. Every checkbox must be ticked before the spec is ready to commit.

```bash
# From the skill directory
cat checklist.md
```

Common validation failures:
- Missing rationale for permissions
- Workflow phases without clear deliverables
- Output format not shown concretely
- Config values not justified
- Language mixing (English + French)

### Phase 5 — Save

Write the spec to `docs/specs/{agent-name}-agent.md` in the project root.

Filename conventions:
- Lowercase, hyphenated
- Always ends with `-agent.md`
- Examples: `researcher-agent.md`, `bug-finder-agent.md`, `harness-agent.md`

## Required Sections

Every spec MUST include these sections (in order):

1. **Frontmatter** — Status, created/updated dates
2. **Overview / Summary** — 2-3 sentence role description
3. **When to Use / Triggers** — Decision criteria
4. **Workflow** — Phased breakdown of agent behavior
5. **Permissions** — Access controls with rationale
6. **Config** — Mode, temperature, variant, color
7. **Output Format** — Structure of agent deliverables
8. **Anti-Patterns** — Common mistakes to avoid

Optional but recommended:
- **Security Considerations** — If agent has write access or fetches external data
- **Interaction with Other Agents** — Handoffs and delegation patterns
- **Links** — Related specs, decisions, architecture docs

## Tone & Style

Match the project's voice:

- **English everywhere** — Code, comments, specs, changelog. No French in committed specs (examples in this skill show mixed languages because they're legacy, but new specs should be English-only).
- **Direct and opinionated** — "Don't do X" not "It is generally advisable to avoid X"
- **Concise** — Every sentence earns its place. No filler, no corporate-speak.
- **Sound bites welcome** — A memorable one-liner can crystallize an agent's identity better than a paragraph

Bad:
```markdown
The researcher agent is designed to facilitate the retrieval of external knowledge
resources in order to support informed decision-making processes during the 
planning phase of the development lifecycle.
```

Good:
```markdown
External knowledge retrieval agent. Fetches information from the web, public APIs,
and online documentation during the understanding phase — before planning begins.

> *"Orion asks questions. Researcher finds answers outside the codebase."*
```

## Examples of Well-Justified Permissions

From `researcher-agent.md`:

| Resource | Access | Justification |
|----------|--------|---------------|
| `websearch` | allow | Discover relevant sources via search engine |
| `webfetch` | allow | Primary tool for fetching external docs |
| `read` | allow | Project `AGENTS.md`, `README`, `docs/` for context |
| `grep` | allow | Search within fetched content if needed |
| `task` | deny | Researcher is a leaf node, doesn't delegate |
| `edit` / `write` | deny | Read-only agent |

Every entry has a clear, concrete justification. The `deny` entries explain *why* the agent doesn't need these tools, which helps prevent scope creep.

## Examples of Clear Workflow Phases

From `bug-finder-agent.md`:

```markdown
### Phase 1 — FRAMING
- Reformulate bug description (reproduce the statement)
- Classify severity: P0 / P1 / P2 / P3 (see table below)
- List initial hypotheses

### Phase 2 — INVESTIGATION
- Delegate exploration via `task` (never read code directly)
- Answer the 4 fundamental questions
- Trace the call chain to the divergence point

### Phase 3 — ALTERNATIVES
- Enumerate at least 2 alternative causes
- Rule out each one explicitly
- Document: ruled-out cause + reason
```

Each phase has a clear name, deliverable, and set of steps. The reader knows exactly what happens and when.

## Examples of Good Anti-Patterns

From `researcher-agent.md`:

| Anti-Pattern | Why It's Wrong |
|--------------|----------------|
| Dumping raw HTML or JSON responses | Orion needs synthesis, not raw data |
| Citing sources without context | "See link" is useless — explain what the link says |
| Implementing solutions based on findings | Research informs, doesn't execute |
| Hedging with "it depends" without enumerating cases | List the actual trade-offs |
| Fetching > 5 sources for a single question | Diminishing returns — focus on quality |

These are specific, actionable, and grounded in real failure modes. They help the agent (or human reader) avoid common mistakes.

## What Makes a Good Spec

A good spec is:

1. **Opinionated** — Takes a clear stance on what the agent does and doesn't do
2. **Concrete** — Shows examples, templates, and decision tables rather than abstract descriptions
3. **Justification-rich** — Every permission, every config value, every workflow phase has a "why"
4. **Boundary-aware** — Explicitly calls out what other agents handle, where handoffs happen
5. **Failure-conscious** — Lists anti-patterns, security risks, and edge cases
6. **Scannable** — Tables, bullets, and headers make it easy to find information fast

A bad spec is:
- Vague ("helps with planning tasks")
- Unjustified ("needs write access")
- Missing anti-patterns
- Mixing languages
- Too abstract (no examples or templates)

## Maintenance

Specs are living documents. When agent behavior changes:

1. Update the spec first, then the prompt
2. Bump the "Updated" date in frontmatter
3. Keep the "Created" date unchanged
4. Change status from `stable` to `draft` if the changes are major, then back to `stable` once validated

If a spec becomes obsolete (agent removed or replaced), move it to `docs/specs/archive/` with a note explaining why.

## Links

- [Index docs](../../docs/index.md)
- [Architecture docs](../../docs/architecture.md)
- [Decisions log](../../docs/decisions.md)
- [Guiding principles](../../docs/guiding-principles.md)
