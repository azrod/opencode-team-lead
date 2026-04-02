---
source: yoonholee.com
url: https://yoonholee.com/meta-harness/
fetched: 2026-04-01
---

# Meta-Harness: End-to-End Optimization of Model Harnesses

*Yoonho Lee, Roshen Nair, Qizheng Zhang, Kangwook Lee, Omar Khattab, Chelsea Finn — Preprint 2026*

## TerminalBench-2: Harness Evolution

Starting from Terminus-KIRA (28.5%), Meta-Harness search reaches **46.5%** by iteration 7 on a hard 19-task subset. The proposer performs counterfactual diagnosis across execution traces, identifies specific failure modes by reading raw logs through the filesystem, and proposes targeted fixes. Each proposal is grounded in concrete evidence from prior runs.

**Meta-Harness search loop.** (1) An agent reads a filesystem containing all prior candidates' source code, execution traces, and scores, and proposes a new harness. (2) We evaluate the proposed harness on held-out tasks. (3) All logs are stored in the filesystem, and the loop repeats.

## What Makes This Different

There are many methods for optimizing text and code with LLM feedback. The key difference is how much the optimizer gets to see. Most prior methods compress everything into a short summary, a scalar score, or a sliding window of recent candidates. That works for small problems, but harness engineering produces failures that are hard to diagnose without seeing the raw execution trace.

Meta-Harness takes a different approach: it gives the proposer a filesystem containing the full source code, scores, and execution traces of every prior candidate. The proposer is a coding agent (Claude Code) that reads what it needs via `grep`, `cat`, and other standard tools. In practice, this means up to 10M tokens of diagnostic context per step, vs. at most 26K for all prior methods surveyed. The result is that the proposer can trace a failure back to the specific harness decision that caused it, rather than guessing from a score.

| Method           | History  | Log content                        | Mtok/iter ↑ |
| ---------------- | -------- | ---------------------------------- | ----------- |
| Self-Refine      | Last     | output + self-generated critique   | 0.001       |
| OPRO             | Window   | past (solution, score) pairs       | 0.002       |
| TextGrad         | Last     | LLM textual gradient               | 0.015       |
| MIPRO            | Summary  | bootstrapped program traces        | 0.003       |
| AlphaEvolve      | Window   | program database + eval. scores    | 0.022       |
| GEPA             | Summary  | rollout traces (reasoning + tools) | 0.008       |
| Feedback Descent | Summary  | pairwise comparison + feedback     | 0.012       |
| TTT-Discover     | Window   | prev. solution fragment            | 0.026       |
| **Meta-Harness** | **Full** | **all logs and scores**            | **10.0**    |

## Results

### Text Classification

The best discovered harness (*Label-Primed Query*) achieves **48.6%** vs. ACE's 40.9% — a **7.7-point improvement** using **4× fewer context tokens**. Gains concentrate on tasks with large, confusable label spaces: LawBench (215 classes) sees +16 points, Symptom2Disease +9 points. None of the discovered harnesses require additional LLM calls beyond the main task-solving call.

Meta-Harness matches the next-best optimizer's final accuracy with **10× fewer evaluations**, attributed to the filesystem-based interface: both OpenEvolve and PUCT compress history into a fixed prompt format, discarding the execution traces that Meta-Harness uses for targeted diagnosis.

### Math Reasoning

A single discovered retrieval harness improves accuracy by **+4.7 points** on average (34.1% → 38.8%) across five held-out models. It matches or exceeds the strongest fixed baselines on average, outperforming BM25 retrieval by 1.3 points overall. The harness transfers without retraining to models unseen during search.

### Agentic Coding (TerminalBench-2)

Meta-Harness evolves the full coding harness (system prompts, tool definitions, completion-checking logic, and context management). The proposer reads per-task execution traces to diagnose failure modes and propose targeted fixes.

- **Claude Opus 4.6**: **76.4%** pass rate — ranks **#2** among all Opus 4.6 agents
- **Claude Haiku 4.5**: **37.6%** — ranks **#1** among all Haiku 4.5 agents (surpassing Goose at 35.5%)

## BibTeX

```
@inproceedings{lee2026metaharness,
  title={Meta-Harness: End-to-End Optimization of Model Harnesses},
  author={Lee, Yoonho and Nair, Roshen and Zhang, Qizheng and Lee, Kangwook and Khattab, Omar and Finn, Chelsea},
  booktitle={Preprint},
  year={2026}
}
```
