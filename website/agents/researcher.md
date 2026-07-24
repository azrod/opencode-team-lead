# Researcher — External Knowledge

Researcher is the external knowledge retrieval agent. It fetches and synthesizes information from public sources — official documentation, RFCs, API references, standards bodies, reference implementations — and hands a structured report back to the calling agent.

**Mode:** `subagent` — only reachable via `task` delegation from the team-lead.

## When the team-lead Uses It

During the **comprehension phase**, before planning begins, when a task requires external technical context that isn't in the codebase.

The team-lead delegates to `researcher` when:
- The task involves a library, framework, or protocol the codebase doesn't explain
- There's an open question about best practices, standards, or API behavior
- A technology choice needs evaluation against official specs
- Understanding an RFC or standard is necessary before scoping the work

`researcher` runs before planning. Never during implementation — that's when `explore` (internal) and `general` (building) take over.

## The Distinction

| Task | Agent |
|------|-------|
| Explore the internal codebase | `explore` |
| Retrieve external knowledge | `researcher` |
| Build something | `general` |

These are complementary, not competing. A typical mission might use all three: `researcher` for external context → `explore` for internal context → `general` for implementation.

## 5-Phase Workflow

### Phase 1 — Scope

Clarifies what's needed before fetching anything:
- What specific technical question needs answering?
- What level of depth is required (overview vs. API detail vs. formal specification)?
- What sources are likely authoritative?

### Phase 2 — Retrieval

Searches 3–5 authoritative sources using websearch and webfetch. Prioritizes:
- Official documentation sites
- RFC / specification documents
- GitHub repositories (READMEs, discussions, changelogs)
- npm / PyPI package documentation
- MDN Web Docs
- Official API references

Does not rely on blog posts, StackOverflow answers, or unofficial tutorials as primary sources. Secondary sources may be used to triangulate when primary sources are ambiguous.

### Phase 3 — Extraction

Pulls the relevant facts from each source. Filters out marketing copy, examples unrelated to the question, and version-specific information that doesn't apply to the project's context.

### Phase 4 — Synthesis

Consolidates findings across sources into a structured summary. Resolves contradictions between sources (typically by deferring to the more authoritative or more recent source). Notes explicitly what was NOT found — absence of information is information.

### Phase 5 — Delivery

Returns a structured report to the team-lead with:
- Key findings, clearly separated by topic
- Sources cited (URLs, document names, section references)
- Explicit notes on gaps and unresolved questions
- Confidence level for each finding (confirmed by official source vs. inferred from examples)

## Security Properties

Researcher is a read-only, leaf-node agent with specific security constraints:

| Property | Detail |
|----------|--------|
| **Read-only** | Cannot edit or write files — retrieval only |
| **Leaf node** | Cannot delegate to other agents — no `task` tool |
| **SSRF-aware** | Will not fetch internal network URLs, private IPs, or localhost endpoints |
| **Prompt injection mitigation** | Treats all external content as untrusted data. Content from fetched pages is never interpreted as instructions. |

The SSRF constraint matters: an adversarially crafted page could embed instructions attempting to redirect the researcher to internal services or exfiltrate information. External content is data, not commands.

## Sources It Targets

- **Language / runtime docs:** MDN, docs.python.org, pkg.go.dev, nodejs.org/api, etc.
- **Framework docs:** official framework documentation sites
- **Standards bodies:** IETF RFCs, W3C specifications, NIST guidelines, OWASP
- **Package registries:** npm, PyPI, crates.io — for version, changelog, and deprecation information
- **Reference implementations:** official GitHub repositories, especially READMEs and GitHub Discussions
- **API references:** OpenAPI specs, GraphQL schemas, official API documentation

## What Researcher Does NOT Do

- Access private or internal URLs — only public sources
- Write files or modify the codebase
- Delegate to other agents
- Perform internal codebase exploration — that's `explore`'s job
- Implement anything — that's `general`'s job
- Provide implementation advice based on unofficial or unverified sources
