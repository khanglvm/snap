# Phase 01 — Foundation and contracts

## Context links
- Parent plan: `./plan.md`
- Inputs: `./scout/scout-01-report.md`, `./research/researcher-01-report.md`, `./research/researcher-02-report.md`
- Planner summary: `./reports/planner-report.md`

## Overview
- Date: 2026-02-09
- Description: define core framework contracts and registry model enforcing TUI + CLI + help triad.
- Priority: P0
- Implementation status: complete
- Review status: complete

## Key Insights
- Contract-first is required to prevent CLI/TUI/help drift.
- Greenfield repo allows clean architecture without migration baggage.

## Requirements
- Functional:
  - Define module/action contract types.
  - Enforce triad presence at registration time.
  - Define error taxonomy and exit-code map.
  - Define runtime context and lifecycle hooks.
- Non-functional:
  - Type-safe API surface.
  - Minimal public API for v1 (KISS).

## Architecture
<!-- Updated: Validation Session 1 - lock single-package layout for MVP -->
- Locked MVP packaging: single package layout (`src/*`) with modular folders; no monorepo split in v1.
- `core/contracts/*` for typed schemas and compile-time helpers.
- `core/registry/*` for module/action registration and validation.
- `core/errors/*` for standardized framework errors.

## Related code files
- Modify: none (greenfield)
- Create:
  - `src/core/contracts/module-contract.ts`
  - `src/core/contracts/action-contract.ts`
  - `src/core/contracts/help-contract.ts`
  - `src/core/registry/action-registry.ts`
  - `src/core/errors/framework-errors.ts`
- Delete: none

## Implementation Steps
1. Define TypeScript contract interfaces and helper builders.
2. Implement registry with startup validation.
3. Add triad completeness checks and diagnostic messages.
4. Add error codes and exit-code policy map.

## Todo list
- [x] Core contract interfaces defined
- [x] Registry implemented
- [x] Triad enforcement implemented
- [x] Error taxonomy added

## Success Criteria
- Registering incomplete action fails deterministically with clear diagnostics.
- Complete action contract can be registered and discovered.

## Risk Assessment
- Risk: over-modeling too early.
  - Mitigation: keep v1 contracts minimal and extensible.

## Security Considerations
- Validate user-defined metadata before rendering/executing.
- Avoid arbitrary code execution in registration path.

## Next steps
- Build runtime resolver + state machine in Phase 02.
