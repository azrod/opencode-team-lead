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
  - icon: 🐛
    title: Structured Investigation
    details: The bug-finder forces root-cause analysis before any fix. No more workarounds that mask symptoms and create code divergence.
  - icon: 🔒
    title: Pattern Enforcement
    details: Harness encodes recurring patterns as lint rules, CI checks, and AGENTS.md entries. Prevention beats repetition.
  - icon: 📋
    title: Context-aware Planning
    details: The planning agent writes exec-plans to disk. Multi-session work survives context resets — the team-lead resumes exactly where it left off.
  - icon: ⚡
    title: Zero Dependencies
    details: Pure ESM, only Node.js builtins. Installs in seconds, no supply chain risk. Ships with provenance attestation.
---

## Quick Install

```bash
opencode plugin opencode-team-lead --global
```

OpenCode will automatically download and load the plugin on next startup. All 11 agents are registered automatically.

::: tip Set team-lead as your default agent
```json
{
  "plugin": ["opencode-team-lead"],
  "default_agent": "team-lead"
}
```
:::
