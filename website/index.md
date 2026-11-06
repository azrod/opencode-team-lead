---
layout: home

hero:
  name: "opencode-team-lead"
  text: "The AI team lead for OpenCode"
  tagline: "Plans, delegates, reviews, and synthesizes — so your AI agents actually work as a team."
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/azrod/opencode-team-lead

features:
  - icon: 🎯
    title: Pure Delegation
    details: The team-lead never touches code directly. Every task goes to a specialized agent. Clean separation, zero context contamination.
  - icon: 🔍
    title: Multi-agent Reviews
    details: The review-manager spawns specialized reviewers in parallel — code quality, security, requirements. Verdicts are synthesized automatically.
  - icon: 📋
    title: Persistent Project Artifacts
    details: Lifecycle tools preserve specs, exec-plans, and product briefs on disk for continuity across sessions.
  - icon: ⚡
    title: Zero Dependencies
    details: Pure ESM, only Node.js builtins. Installs in seconds, no supply chain risk. Ships with provenance attestation.
---

## Quick Install

```bash
opencode plugin opencode-team-lead --global
```

OpenCode will automatically download and load the plugin on next startup. The plugin registers 12 specialized agents plus team-lead.

::: warning Agent retirement transition
`planning`, `brainstorm`, `harness`, `researcher`, and `gardener` are retired. The team-lead's old routing to them remains in its unchanged prompt pending a separate redesign; those plugin-agent paths are unavailable. No replacement workflow is defined. Existing artifacts and lifecycle tools remain available.
:::

::: tip Set team-lead as your default agent
```json
{
  "plugin": ["opencode-team-lead"],
  "default_agent": "team-lead"
}
```
:::
