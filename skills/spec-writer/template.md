# Spec: Agent `{agent-name}`

**Status:** draft  
**Created:** YYYY-MM-DD

---

## Overview / Summary

[2-3 sentences describing the agent's role, scope, and position in the system]

Example:
> External knowledge retrieval agent. Fetches information from the web, public APIs, and online documentation during the understanding phase — before planning begins.

Optional: Add a memorable one-line quote that crystallizes the agent's identity:
> *"Orion asks questions. Researcher finds answers outside the codebase."*

---

## When to Use / Triggers

[Decision table or bullet list showing when Orion or the user should invoke this agent]

| Source | Condition |
|--------|-----------|
| Orion | [When Orion delegates to this agent] |
| User (direct) | [When user invokes directly] |

**Not triggered for:**
- [Scenario A] → Use `{other-agent}` instead
- [Scenario B] → Use `{another-agent}` instead

---

## Role

[Expand on the agent's responsibilities. What does it do? What does it NOT do?]

**What the agent does:**
- [Responsibility 1]
- [Responsibility 2]
- [Responsibility 3]

**What the agent does NOT do:**
- [Out-of-scope task 1] — This is handled by `{other-agent}`
- [Out-of-scope task 2] — This is handled by `{another-agent}`
- [Anti-pattern to avoid]

---

## Workflow

[Break down the agent's behavior into clear phases. Each phase should have a name, deliverable, and steps.]

### Phase 1 — {Phase Name}

[What happens in this phase]

- Step 1: [Action]
- Step 2: [Action]
- Step 3: [Decision point — if X, then Y]

Deliverable: [What this phase produces]

### Phase 2 — {Phase Name}

[What happens in this phase]

1. [Numbered steps if order matters]
2. [Another step]
3. [Final step]

Deliverable: [What this phase produces]

### Phase 3 — {Phase Name}

[Continue for as many phases as needed]

---

## Permissions

[Table of all tools the agent can/cannot use, with clear rationale]

| Resource | Access | Justification |
|----------|--------|---------------|
| `tool-name` | allow | [Why this tool is needed — be specific] |
| `another-tool` | allow | [Concrete reason] |
| `dangerous-tool` | deny | [Why this is restricted] |

**Default stance:** Deny-all except what's explicitly needed. Every `allow` entry must have a solid justification.

---

## Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `mode` | `all` or `subagent` | [Explain who can invoke this agent and why] |
| `temperature` | 0.0-1.0 | [Justify based on task type: 0.0-0.3 for deterministic, 0.5-0.7 for balanced, 0.8-1.0 for creative] |
| `variant` | `standard` \| `extended` \| `max` | [Justify based on expected context needs: standard=128k, extended=200k, max=512k] |
| `color` | `primary` \| `info` \| `success` \| `warning` \| `danger` | [UI indicator color] |

---

## Output Format

[Show the structure of what the agent returns. Use markdown code blocks for templates.]

Structured markdown returned to Orion or user:

```markdown
## {Section Title}

[Expected content format]

## {Another Section}

- [Bullet points if applicable]
- [Another item]

## {Final Section}

[Closing content]
```

If the output is structured data (JSON, table), show the schema:

| Field | Type | Description |
|-------|------|-------------|
| `field_name` | string | [What this field contains] |
| `another_field` | boolean | [Purpose of this field] |

---

## Anti-Patterns

[List common mistakes or misuses. Format: **Pattern name** — Why it's wrong, what to do instead]

| Anti-Pattern | Why It's Wrong |
|--------------|----------------|
| **[Pattern name]** | [Explanation of the problem and the correct approach] |
| **[Another pattern]** | [Explanation] |
| **[Third pattern]** | [Explanation] |

Alternatively, use bullet format:

- **[Anti-pattern name]** — [Why it's wrong, what to do instead]
- **[Another anti-pattern]** — [Explanation]

---

## Security Considerations

[Only include this section if the agent has security-relevant permissions or handles untrusted data]

### {Risk Category 1 — e.g., SSRF Protection}

[Description of the risk]

Mitigation:
- [Specific mitigation step 1]
- [Specific mitigation step 2]
- [Platform vs. agent responsibility clarification]

### {Risk Category 2 — e.g., Prompt Injection}

[Description of the risk]

Mitigation:
- [Mitigation strategy]

### {Risk Category 3 — e.g., Data Exfiltration}

[Description of the risk]

Mitigation:
- [Mitigation strategy]
- [When NOT to use this agent]

---

## Interaction with Other Agents

[Optional section — include if this agent has clear handoffs with other agents]

| Handoff | Direction |
|---------|-----------|
| Orion → `{this-agent}` | [Trigger condition] |
| `{this-agent}` → Orion | [What gets returned] |
| `{this-agent}` → `{other-agent}` | [Delegation scenario] |
| `{other-agent}` → `{this-agent}` | [When this agent is invoked by another] |

**Delegation policy:** [Does this agent delegate? Is it a leaf node? An orchestrator?]

---

## Positioning in the Architecture

[Optional section — useful for agents that are part of a cluster or have clear architectural relationships]

| Agent | Scope | Output |
|-------|-------|--------|
| `{agent-1}` | [What it handles] | [What it produces] |
| `{this-agent}` | [What it handles] | [What it produces] |
| `{agent-3}` | [What it handles] | [What it produces] |

---

## Links

[Cross-references to related docs]

- [Index docs](../index.md)
- [Spec: {Related Agent}](./related-agent.md)
- [Architecture](../architecture.md)
- [Decisions](../decisions.md)
- [Guiding Principles](../guiding-principles.md)

---

## Notes for Spec Writers

**Delete this section before committing.**

This template includes all possible sections. Not every spec needs every section. Use judgment:

- **Always required:** Overview, When to Use, Workflow, Permissions, Config, Output Format, Anti-Patterns
- **Include if relevant:** Security Considerations (for agents with write access or external data), Interaction with Other Agents (for orchestrators or tightly-coupled agents), Positioning in Architecture (for agents in a cluster)
- **Optional:** Role (if Overview doesn't cover it), Links (always helpful but not strictly required)

**Style reminders:**
- English only (no French in committed specs)
- Direct, opinionated tone
- Justify every permission, every config value
- Show concrete examples and templates
- List anti-patterns you've seen or anticipate
- No filler, no corporate-speak
- Tables > paragraphs for structured info

**Validation:**
Run through `checklist.md` before committing.
