# Phase 05 — Testing and quality gates

## Context links
- Runtime/help phases: `./phase-02-runtime-and-state-machine.md`, `./phase-04-help-system-and-ai-readability.md`
- Research: `./research/researcher-02-report.md`
- Overview: `./plan.md`

## Overview
- Priority: P1
- Status: complete
- Description: define deterministic tests and CI gates for contract correctness, runtime behavior, help stability, and security guardrails.

## Key Insights
- Need 4-layer testing: unit, integration, transcript snapshot, e2e smoke.
- Deterministic env controls are mandatory for terminal tests.
- Security tests must cover injection, redaction, and escape sanitization.

## Requirements
<!-- Updated: Validation Session 1 - require 3-OS CI matrix for MVP -->
- Functional:
  - Add tests for contract triad enforcement.
  - Add runtime mode-selection tests (default TUI vs auto non-interactive).
  - Add help output contract/snapshot tests.
  - Add cancel/timeout/exit code tests.
- Non-functional:
  - CI matrix includes Linux + macOS + Windows and target Node versions.
  - Flake policy documented and enforced.

## Architecture
- Test layers:
  - unit: validators, resolver, state transitions.
  - integration: runtime + adapters + registry.
  - transcript: deterministic output frames.
  - e2e-smoke: critical user paths with real process.
- Quality gates:
  - lint + typecheck + tests + security assertions.

## Related code files
- Modify: none (greenfield)
- Create:
  - `vitest.config.ts`
  - `tests/unit/*.test.ts`
  - `tests/integration/*.test.ts`
  - `tests/transcript/*.test.ts`
  - `tests/e2e/*.test.ts`
  - `.github/workflows/ci.yml`
- Delete: none

## Implementation Steps
1. Configure test tooling and deterministic env defaults.
2. Implement unit and integration suites for core/runtime/help.
3. Add transcript snapshots with stable formatter policy.
4. Add e2e smoke for top workflows.
5. Configure CI gates and failure policy.

## Todo list
- [x] Test tooling configured
- [x] Unit/integration suites implemented
- [x] Transcript snapshots implemented
- [x] E2E smoke implemented
- [x] CI gates and matrix configured

## Success Criteria
- All quality gates pass on target matrix.
- Runtime/help regressions caught before merge.
- Security-sensitive behaviors covered by tests.

## Risk Assessment
- Risk: flaky terminal tests.
  - Mitigation: deterministic env + focused e2e scope.
- Risk: long CI runtime.
  - Mitigation: split jobs, run smoke in PR and full nightly optional.

## Security Considerations
- Test command injection defenses and unsafe shell wrapping.
- Test secret redaction and terminal escape sanitization paths.

## Next steps
- Deliver sample modules and adoption assets in Phase 06.
