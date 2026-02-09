---
title: "Hub Dual-Runtime Framework Plan"
description: "Implementation plan for a contract-first TypeScript framework that unifies TUI-default and auto headless CLI execution with strict AI-readable help."
status: completed
priority: P2
effort: 6 phases / ~8-10d
branch: no-git
tags: [framework, cli, tui, clack, bombsh-args, ai-readable-help, state-machine]
created: 2026-02-09
---

# Plan Overview

Goal: build `hub` framework for human + AI terminal usage with one action contract enforcing `tui + commandline + help`.

## Inputs
- Scout: `./scout/scout-01-report.md`
- Research: `./research/researcher-01-report.md`, `./research/researcher-02-report.md`
- Summary: `./reports/planner-report.md`

## Locked decisions
- Default runtime mode = TUI.
- Auto non-interactive run when required CLI args are sufficient.
- Use clack prompts/core broadly.
- In-process module loading only.
- Text-first strict help sections for AI/human readability.
- Workflow model = state machine.

## Phases
1. **Phase 01** (complete, 100%)
   - Foundation contracts and triad enforcement
   - `./phase-01-foundation-and-contracts.md`
2. **Phase 02** (complete, 100%)
   - Runtime resolver and shared state-machine engine
   - `./phase-02-runtime-and-state-machine.md`
3. **Phase 03** (complete, 100%)
   - TUI component adapters and policy handling
   - `./phase-03-tui-components-and-policies.md`
4. **Phase 04** (complete, 100%)
   - Hierarchical help system and AI-readable format
   - `./phase-04-help-system-and-ai-readability.md`
5. **Phase 05** (complete, 100%)
   - Testing pyramid and quality/security gates
   - `./phase-05-testing-and-quality-gates.md`
6. **Phase 06** (complete, 100%)
   - Sample modules and adoption assets
   - `./phase-06-sample-modules-and-adoption.md`

## Dependency chain
`01 -> 02 -> 03 -> 04 -> 05 -> 06`

## Delivery gates
- Triad enforcement active at registration.
- Runtime mode resolver deterministic in TTY/non-TTY.
- Help output deterministic across all hierarchy levels.
- Test matrix green on target OS/Node set.

## Open items to confirm
- Package layout preference (single package vs monorepo).
- CI provider and mandatory OS/Node support for MVP.

## Validation Log

### Session 1 — 2026-02-09
**Trigger:** Initial plan creation validation interview.
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Which package layout should we lock for MVP implementation?
   - Options: Single package (Recommended) | Monorepo now | Hybrid scaffold
   - **Answer:** Single package (Recommended)
   - **Rationale:** Reduces setup complexity, keeps velocity high for greenfield MVP.

2. **[Risk]** What OS matrix do you want as required quality gate for MVP?
   - Options: Linux + macOS + Windows (Recommended) | Linux only | Linux + macOS
   - **Answer:** Linux + macOS + Windows (Recommended)
   - **Rationale:** Terminal behavior differs by OS; cross-platform gate is required for framework trust.

3. **[Scope]** How should we finalize the help output contract for MVP?
   - Options: Text-only strict sections (Recommended) | Text + optional JSON | Text + required JSON
   - **Answer:** Text-only strict sections (Recommended)
   - **Rationale:** Aligns product goal and keeps MVP focused on deterministic text contract.

4. **[Tradeoffs]** How much state-machine complexity should we include in MVP?
   - Options: No resume/jump in MVP (Recommended) | Add jump only | Add jump + resume
   - **Answer:** Add jump + resume
   - **Rationale:** Stronger workflow UX requirement accepted despite extra implementation cost.

#### Confirmed Decisions
- Package layout: single package — optimize MVP speed.
- CI OS gate: Linux + macOS + Windows — enforce terminal compatibility.
- Help contract: text-only strict sections — deterministic AI/human read path.
- State-machine scope: include jump + resume — richer workflow support in MVP.

#### Action Items
- [ ] Update phase-02 with jump + resume architecture and tasks.
- [ ] Update phase-05 with mandatory 3-OS CI matrix requirement.
- [ ] Mark package layout and text-help contract as locked in phase docs.

#### Impact on Phases
- Phase 01: record single-package architecture decision.
- Phase 02: add persisted resume + node jump support requirements/architecture/tests.
- Phase 04: lock text-only strict help contract in requirements.
- Phase 05: mandate Linux+macOS+Windows CI matrix for MVP.
