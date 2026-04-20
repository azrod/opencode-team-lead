# Spec Validation Checklist

Run through this checklist before committing a spec to `docs/specs/`. Every checkbox must be ticked.

---

## Structure

- [ ] Frontmatter includes `status` (draft or stable) and `created` date (YYYY-MM-DD format)
- [ ] File is named `{agent-name}-agent.md` (lowercase, hyphenated, ends with `-agent.md`)
- [ ] File is saved to `docs/specs/` in the project root
- [ ] All required sections are present (see below)
- [ ] Sections are in a logical order (Overview → When to Use → Workflow → Permissions → Config → Output → Anti-Patterns)

---

## Required Sections

- [ ] **Overview / Summary** — 2-3 sentences describing the agent's role
- [ ] **When to Use / Triggers** — Decision table or list showing when to invoke this agent
- [ ] **Workflow** — Broken into numbered phases with clear deliverables
- [ ] **Permissions** — Table of tools with `allow`/`deny` and rationale for each
- [ ] **Configuration** — Mode, temperature, variant, color with justifications
- [ ] **Output Format** — Concrete template or schema showing what the agent returns
- [ ] **Anti-Patterns** — List of common mistakes with explanations

---

## Optional but Recommended Sections

- [ ] **Security Considerations** — Included if agent has write access, fetches external data, or handles untrusted input
- [ ] **Interaction with Other Agents** — Included if agent has clear handoffs or delegation patterns
- [ ] **Links** — Cross-references to related specs, architecture docs, decisions

---

## Permissions Section

- [ ] Every `allow` entry has a concrete justification (not "needed for the agent to work")
- [ ] Important `deny` entries are called out (explain why the agent doesn't need these tools)
- [ ] No tools are granted "just in case" — default-deny mindset applied
- [ ] If agent has `write` or `edit` access, target directories are specified
- [ ] If agent has `webfetch` or `websearch`, security considerations are documented

---

## Workflow Section

- [ ] Workflow is broken into numbered phases (Phase 1, Phase 2, etc.)
- [ ] Each phase has a clear name and deliverable
- [ ] Steps within each phase are concrete (not "do some analysis")
- [ ] Decision points are explicit (if X, then Y)
- [ ] Workflow doesn't prescribe implementation details (focuses on "what" not "how")

---

## Configuration Section

- [ ] `mode` is specified (`all` or `subagent`) with rationale
- [ ] `temperature` is specified (0.0-1.0) with justification based on task type
- [ ] `variant` is specified (`standard`, `extended`, `max`) with context size rationale
- [ ] `color` is specified (UI indicator)

---

## Output Format Section

- [ ] Output structure is shown concretely (markdown template, JSON schema, or example)
- [ ] Field descriptions are included if output is structured data
- [ ] Example output is provided if the format is complex

---

## Anti-Patterns Section

- [ ] At least 3 anti-patterns are listed
- [ ] Each anti-pattern has an explanation (why it's wrong, what to do instead)
- [ ] Anti-patterns are specific to this agent (not generic advice)
- [ ] Format is consistent (table or bullet list, not mixed)

---

## Language and Style

- [ ] Entire spec is in English (no French, no language mixing)
- [ ] Tone is direct and opinionated (not corporate or hedging)
- [ ] No filler phrases ("it should be noted that", "generally speaking")
- [ ] Jargon is avoided or explained
- [ ] Tables are used for structured information (not long paragraphs)
- [ ] Code blocks are used for templates and schemas

---

## Content Quality

- [ ] Agent's role is clear and unambiguous
- [ ] Boundaries with other agents are explicit (what this agent does NOT do)
- [ ] Every config value has a rationale (not just the default value)
- [ ] Security risks are called out if relevant
- [ ] Examples or templates are provided where helpful
- [ ] No orphan sections (every section has content, no TODOs or placeholders)

---

## Cross-References

- [ ] Links to related specs are included (if applicable)
- [ ] Links point to existing files (no broken references)
- [ ] References to other agents use consistent naming (e.g., `planning` not `planner`)

---

## Final Checks

- [ ] Spec has been read aloud (catches awkward phrasing and missing words)
- [ ] Spec has been compared to an example spec for consistency
- [ ] Template guidance sections have been removed (if template was used)
- [ ] Status is set correctly (`draft` for new agents, `stable` for implemented and validated)
- [ ] Created date matches the actual creation date (not today's date if updating an old spec)

---

## Common Validation Failures

Watch out for these frequent issues:

- **Vague permissions rationale** — "Needed to read files" is not specific enough. Which files? Why?
- **Missing anti-patterns** — Every agent has failure modes worth documenting
- **Unjustified config values** — Don't just copy another agent's temperature without thinking
- **No output format** — Orion (or the user) needs to know what to expect back
- **Language mixing** — English-only is the project standard
- **Missing security considerations** — If agent writes to disk or fetches from the web, security section is required
- **Workflow without deliverables** — Each phase should produce or decide something

---

## Sign-Off

- [ ] I have reviewed every checkbox above
- [ ] This spec is ready to commit to `docs/specs/`

**Reviewer signature:** ___________  
**Date:** ___________
