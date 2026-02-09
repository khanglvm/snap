# Phase 06 — Sample modules and adoption

## Context links
- Plan: `./plan.md`
- Prior phases: `./phase-01-foundation-and-contracts.md` to `./phase-05-testing-and-quality-gates.md`
- Planner report: `./reports/planner-report.md`

## Overview
- Priority: P2
- Status: complete
- Description: add reference modules and adoption docs proving framework contract and runtime behavior for real teams.

## Key Insights
- Adoption fails if first module feels heavy.
- Sample should cover both interactive and non-interactive execution.
- Keep examples realistic but small.

## Requirements
- Functional:
  - Provide 2 sample modules with at least 2 actions each.
  - Each sample action includes TUI flow, commandline args/options, and complete help output.
  - Include quickstart for module authors.
- Non-functional:
  - Minimal boilerplate.
  - Consistent naming and folder conventions.

## Architecture
- Module shape:
  - `module/index` exports action contracts.
  - Action contracts registered via public API bootstrap.
- Adoption assets:
  - quickstart doc + “build first action in 10 minutes” path.

## Related code files
- Modify:
  - `README.md` (create if absent)
  - `src/cli-entry.ts`
- Create:
  - `src/modules/sample-system/module.ts`
  - `src/modules/sample-content/module.ts`
  - `docs/module-authoring-guide.md`
  - `docs/help-contract-spec.md`
- Delete: none

## Implementation Steps
1. Create two sample modules with distinct action types.
2. Register modules into bootstrap entry.
3. Validate each action triad and help coverage.
4. Write concise adoption docs and migration notes.
5. Run final quality gate suite.

## Todo list
- [x] Sample modules implemented
- [x] Bootstrap wiring complete
- [x] Authoring guide drafted
- [x] Help contract spec drafted
- [x] Final tests and smoke run complete

## Success Criteria
- New developer can add one action using docs without reading core internals.
- Sample actions run in TUI default and auto non-interactive mode.
- Help outputs satisfy strict contract for all sample actions.

## Risk Assessment
- Risk: samples diverge from real architecture.
  - Mitigation: enforce same contract checks as production modules.
- Risk: docs stale quickly.
  - Mitigation: docs tied to tested examples in CI.

## Security Considerations
- Samples avoid unsafe command execution patterns.
- Docs include explicit secret-handling and logging redaction notes.

## Next steps
- Hand off to implementation agent with phase-by-phase checklist execution.
