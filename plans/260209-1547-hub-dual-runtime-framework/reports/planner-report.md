# Planner Report

## Summary
Created full implementation plan for hub dual-runtime framework in active plan dir. Plan is contract-first, state-machine-driven, and enforces per-action triad: `tui + commandline + help`. Sequence is 6 phases from foundation to adoption, with strict quality gates.

## Rationale
- YAGNI: skip dynamic plugin loading, marketplace, resumable sessions in v1.
- KISS: one execution engine, two adapters, one help contract.
- DRY: single action contract generates runtime behavior and help surface.
- User-lock alignment: default TUI, auto non-interactive run on sufficient args, clack-heavy interaction model, in-process loading, text-only machine-readable help.

## Key trade-offs
- Chosen: rigid text help contract over flexible prose.
  - Pro: deterministic for AI/tools.
  - Con: less expressive docs style.
- Chosen: in-process module loading only.
  - Pro: simpler security/runtime model.
  - Con: no external plugin discovery in v1.
- Chosen: state-machine orchestration for both runtime paths.
  - Pro: predictable edge handling.
  - Con: upfront modeling cost.

## Unresolved questions
1. Repo/package layout preference: single package vs monorepo from day 1?
2. Canonical `@bomb.sh/args` reference/API location to lock exact parser contract?
3. CI provider preference and mandatory OS coverage at MVP gate?
4. Should machine-readable help include optional JSON mode later, while still keeping text contract primary?
