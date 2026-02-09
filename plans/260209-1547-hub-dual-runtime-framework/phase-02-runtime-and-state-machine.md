# Phase 02 — Runtime and state machine

## Context links
- Parent plan: `./plan.md`
- Depends on: `./phase-01-foundation-and-contracts.md`
- Research: `./research/researcher-01-report.md`, `./research/researcher-02-report.md`

## Overview
- Date: 2026-02-09
- Description: implement shared runtime engine and workflow state machine for TUI-default + auto non-interactive behavior.
- Priority: P0
- Implementation status: complete
- Review status: complete

## Key Insights
- One execution engine must serve both TUI and command paths.
- Mode resolution must be deterministic and safe in non-TTY contexts.

## Requirements
- Functional:
  - Implement runtime resolver: default TUI, auto headless when required args provided.
  - Implement state-machine transitions for flow nodes including `next/back/jump/exit`.
  - Implement persisted resume checkpoints for interrupted multi-step workflows.
  - Implement in-process module loading and action dispatch.
  - Implement unified result envelope and exit semantics.
- Non-functional:
  - Deterministic behavior for CI/automation.
  - No duplicated business logic across adapters.

## Architecture
<!-- Updated: Validation Session 1 - include jump + resume in MVP -->
- `runtime/mode-resolver.ts` decides interactive vs non-interactive.
- `runtime/engine.ts` executes action handlers with shared context.
- `runtime/state-machine.ts` handles transitions: next/back/jump/exit.
- `runtime/resume-store.ts` persists and restores workflow checkpoints.
- `runtime/dispatch.ts` maps parser result to action contract.

## Related code files
- Modify: none (greenfield)
- Create:
  - `src/runtime/mode-resolver.ts`
  - `src/runtime/engine.ts`
  - `src/runtime/state-machine.ts`
  - `src/runtime/resume-store.ts`
  - `src/runtime/dispatch.ts`
  - `src/runtime/runtime-context.ts`
- Delete: none

## Implementation Steps
1. Implement mode resolver with strict decision tree.
2. Implement shared runtime executor and result envelope.
3. Implement workflow state-machine and transition guards including jump.
4. Implement resume checkpoint store and restore path.
5. Wire dispatch path from parser to runtime.

## Todo list
- [x] Mode resolver implemented
- [x] Runtime engine implemented
- [x] State machine with jump implemented
- [x] Resume checkpoint store implemented
- [x] Dispatch integration complete

## Success Criteria
- Same action handler runs correctly from both TUI and command invocation.
- Missing args in non-TTY returns strict help/error output without prompt hang.

## Risk Assessment
- Risk: mode ambiguity in mixed argument scenarios.
  - Mitigation: explicit precedence rules and diagnostics.

## Security Considerations
- Validate parsed input before dispatch.
- Enforce safe defaults for cancellation/timeouts.

## Next steps
- Build TUI component adapters and edge policies in Phase 03.
