# Spec: Agent `researcher`

**Status:** stable  
**Updated:** 2026-04-20

## Summary

External knowledge retrieval agent. Fetches information from the web, public APIs, and online documentation during the understanding phase — before planning begins.

> *"Orion asks questions. Researcher finds answers outside the codebase."*

---

## Role

Bridge the gap between what's in the project and what's documented externally. Retrieve, synthesize, and structure information from public sources to inform technical decisions.

**Not a search engine.** Researcher extracts relevant facts, identifies best practices, verifies standards compliance, and returns actionable summaries — not raw dumps.

---

## Positioning in the Architecture

| Agent | Scope | Output |
|-------|-------|--------|
| `explore` | Internal codebase navigation and context gathering | File structure, code patterns, internal conventions |
| `researcher` | External knowledge retrieval (docs, RFCs, standards, examples) | Synthesized findings with citations |
| `planning` | Execution plan creation from gathered context | Exec-plan on disk |

Researcher operates **before** planning — Orion delegates research tasks when external context is needed to inform the plan.

---

## Triggers

| Source | Condition |
|--------|-----------|
| Orion | Needs external context before planning (best practices, API docs, RFC standards) |
| Orion | Technical decision requires validation against official documentation |
| Orion | Implementation approach needs comparison with public examples |
| User (direct) | Explicit research request ("what's the current best practice for X?") |

**Not triggered for:**
- Internal codebase questions → `explore`
- Bug investigation → `bug-finder`
- Code review → `review-manager`

---

## Workflow

### Phase 1 — Scope the Research

- Parse the research question into specific lookup targets
- Identify information type needed: API documentation, RFC/standard, best practice, implementation example, benchmark data
- Determine search strategy: direct URL fetch, targeted web search, API reference lookup

### Phase 2 — Retrieval

1. Use `websearch` to discover relevant sources (official docs, technical articles, RFCs, discussions)
2. Evaluate search results for credibility and relevance
3. Use `webfetch` to retrieve the 3–5 most authoritative sources

If the exact URLs are already known (e.g., React official docs), skip websearch and fetch directly.

- Follow documentation links when initial source references deeper material
- Verify source credibility (official docs > established blogs > random posts)
- Stop after 3–5 quality sources — breadth over exhaustiveness

### Phase 3 — Extraction

- Pull out relevant facts, recommendations, and code examples
- Discard marketing fluff, tangential discussions, and outdated information
- Note version numbers, release dates, and deprecation warnings where applicable

### Phase 4 — Synthesis

- Structure findings into a coherent summary
- Call out contradictions between sources
- Highlight consensus vs. competing approaches
- Flag gaps where sources don't cover the question fully

### Phase 5 — Delivery

Return structured output:

| Section | Content |
|---------|---------|
| Summary | 2–4 sentence answer to the original question |
| Key Findings | Bullet points of actionable facts |
| Sources | URLs with context ("Official React docs on hooks", "RFC 7231 on HTTP methods") |
| Caveats | Version constraints, known issues, edge cases |
| Gaps | What the sources didn't cover (if relevant) |

---

## What the Agent Does

- Fetch and parse external documentation
- Synthesize findings across multiple sources
- Extract code examples and adapt them for context
- Verify current best practices and standards
- Identify deprecated approaches and migration paths
- Compare competing solutions with trade-offs

---

## What the Agent Does NOT Do

- No code implementation — only research and synthesis
- No internal codebase analysis — that's `explore`'s job
- No architectural decisions — provides info, doesn't choose
- No exhaustive literature reviews — targeted retrieval only
- No writing to the project (read-only agent)
- No speculation when sources are unavailable — says "not found" instead

---

## Permissions

| Resource | Access | Justification |
|----------|--------|---------------|
| `websearch` | allow | Discover relevant sources via search engine |
| `webfetch` | allow | Primary tool for fetching external docs |
| `read` | allow | Project `AGENTS.md`, `README`, `docs/` for context |
| `grep` | allow | Search within fetched content if needed |
| `task` | deny | Researcher is a leaf node, doesn't delegate |
| `edit` / `write` | deny | Read-only agent |

---

## Configuration

| Parameter | Value |
|-----------|-------|
| `mode` | `all` — invocable by user AND Orion |
| `temperature` | 0.3 — factual retrieval, minimal creativity |
| `variant` | `extended` — may need larger context for long docs |
| `color` | `info` |

---

## Output Format

Structured markdown returned to Orion or user:

```markdown
## Research Summary

[2–4 sentence answer]

## Key Findings

- Finding 1 with context
- Finding 2 with context
- Finding 3 with context

## Sources

1. [Source Title](URL) — Official docs, Last updated: YYYY-MM-DD
2. [Source Title](URL) — Community best practice guide
3. [Source Title](URL) — RFC/Standard reference

## Caveats

- Version constraint or compatibility note
- Known limitation or edge case

## Gaps

[Optional — what wasn't found or needs follow-up]
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong |
|--------------|----------------|
| Dumping raw HTML or JSON responses | Orion needs synthesis, not raw data |
| Citing sources without context | "See link" is useless — explain what the link says |
| Implementing solutions based on findings | Research informs, doesn't execute |
| Reading internal project files to answer questions | Use `explore` for internal context |
| Hedging with "it depends" without enumerating cases | List the actual trade-offs |
| Fetching > 5 sources for a single question | Diminishing returns — focus on quality |

---

## Security Considerations

### SSRF Protection

The `webfetch` tool MUST validate URLs before fetching to prevent SSRF attacks:

- **Block private IP ranges** — 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
- **Block loopback** — 127.0.0.0/8, ::1
- **Block link-local** — 169.254.0.0/16, fe80::/10
- **Block cloud metadata endpoints** — 169.254.169.254, fd00:ec2::254

This validation should be enforced at the platform level (OpenCode runtime), not by the agent prompt. If OpenCode does not provide this protection, **this agent should not be used in production**.

### Prompt Injection

External content is untrusted. The agent MUST treat fetched HTML/JSON as data, never as instructions. See **Security Notes** section in `agents/researcher.md` for prompt-level protections.

### Data Exfiltration

The combination of `read` + `webfetch` enables data exfiltration (reading local secrets and sending them to an external server). Mitigation:

- **Do not grant this agent `read` access to sensitive directories** (credentials, private keys, .env files)
- **Monitor webfetch destinations** — log all URLs fetched for audit
- **Rate limiting** — prevent bulk data exfiltration via repeated webfetch calls

If the project contains secrets that must never leave the machine, **do not use this agent** or restrict its `read` permission to documentation directories only.

---

## Interaction with Other Agents

| Handoff | Direction |
|---------|-----------|
| Orion → researcher | "What's the current best practice for X?" |
| researcher → Orion | Structured findings, Orion incorporates into plan |
| planning | May reference researcher's findings in decision log |
| harness | Researcher findings may inform mechanical rules |

**No direct delegation.** Researcher is a leaf node — receives tasks, returns results, doesn't spawn sub-agents.

---

## Links

- [Index docs](../index.md)
- [Spec: Orion delegation](./orion-delegation.md)
- [Spec: Planning](./planning-agent.md)
- [Decisions](../decisions.md)
