# Future Ideas for opencode-team-lead

This document captures potential directions and architectural improvements for future versions.

## 1. Domain-Specific Reviewers
Currently, the `review-manager` uses a generic `code-reviewer` for everything not covered by security or requirements. The Anthropic generator/evaluator pattern suggests specialized evaluators find more edge cases.
- **`ux-reviewer`**: Dedicated agent for frontend changes (accessibility, loading states, error boundaries, visual consistency). Currently referenced in `review-manager.md`'s proportionality table but not implemented.
- **`perf-reviewer`**: Dedicated agent for performance (N+1 queries, algorithmic complexity, unpaginated DB calls). Currently documented as a "Known gap" in the review-manager prompt.

## 2. The "Sprint Contract" Pattern
Inspired by Anthropic's "Harness design for long-running application development".
Currently, Orion delegates to a producer (`general`), then the result is evaluated by `review-manager`. This is a post-facto review.
A "sprint contract" would move evaluation upstream:
- Orion proposes a technical plan to `requirements-reviewer` first.
- The reviewer validates that the plan accounts for all edge cases and requirements *before any code is written*.
- Once the contract is agreed upon, the producer agent executes it.
This prevents the producer from going down a multi-file rabbit hole based on a flawed premise.

## 3. Enhancing the Bug-Finder Routing
The `bug-finder` agent was added with `mode: "all"`, meaning users can invoke it directly. However, in OpenCode's default behavior, Orion (`team-lead`) intercepts open-ended user prompts like "I have a bug."
We need to verify if Orion's prompt (specifically Anti-Pattern #9 and the Bug-Finder Protocol section) is strong enough to reliably route these requests to `bug-finder` first, or if we need to explore explicit routing directives/tools in future OpenCode plugin APIs.
