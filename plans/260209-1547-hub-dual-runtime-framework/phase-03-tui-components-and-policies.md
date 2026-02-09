# Phase 03 — TUI components and policies

## Context links
- Parent plan: `./plan.md`
- Depends on: `./phase-02-runtime-and-state-machine.md`
- Research: `./research/researcher-01-report.md`

## Overview
- Date: 2026-02-09
- Description: implement clack-based component adapters, accessibility footer, and policy-driven edge handling.
- Priority: P1
- Implementation status: complete
- Review status: complete

## Key Insights
- Use clack primitives fully, wrap them in framework contracts.
- Accessibility line helps both humans and AI snapshots understand current state.

## Requirements
- Functional:
  - Support clack prompts/core patterns (select, multiselect, confirm, text, groups, task logs/spinners).
  - Implement framework wrapper components with validation hooks.
  - Add accessibility footer with current node, selection, keybind hints.
  - Enforce ESC/Ctrl+C/error/invalid-input policies with configurable actions.
- Non-functional:
  - Async-safe prompt flows.
  - Non-TTY fallback to runtime resolver path.

## Architecture
- `tui/component-adapters/*` wraps clack APIs.
- `tui/accessibility-footer.ts` renders stable context text.
- `tui/interrupt-handlers.ts` maps cancel signals to policy engine.

## Related code files
- Modify: none (greenfield)
- Create:
  - `src/tui/component-adapters/select.ts`
  - `src/tui/component-adapters/multiselect.ts`
  - `src/tui/component-adapters/confirm.ts`
  - `src/tui/component-adapters/text.ts`
  - `src/tui/component-adapters/group.ts`
  - `src/tui/accessibility-footer.ts`
  - `src/tui/interrupt-handlers.ts`
- Delete: none

## Implementation Steps
1. Implement component wrappers and shared adapter interfaces.
2. Implement input validation and cancellation normalization.
3. Add accessibility footer renderer.
4. Integrate policy engine hooks for edge-case handling.

## Todo list
- [x] Core component wrappers implemented
- [x] Validation/cancel normalization implemented
- [x] Accessibility footer implemented
- [x] Policy hooks integrated

## Success Criteria
- TUI flows execute with consistent keybinding/interrupt behavior.
- Accessibility footer appears on each interactive step.

## Risk Assessment
- Risk: terminal compatibility differences.
  - Mitigation: isolate adapter layer and test across OS.

## Security Considerations
- Sanitize untrusted text displayed in terminal.
- Avoid leaking sensitive values in prompts and logs.

## Next steps
- Implement strict help contract and hierarchy in Phase 04.
