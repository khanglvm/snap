# Phase 04 — Help system and AI readability

## Context links
- Parent plan: `./plan.md`
- Depends on: `./phase-01-foundation-and-contracts.md`, `./phase-02-runtime-and-state-machine.md`
- Research: `./research/researcher-01-report.md`

## Overview
- Date: 2026-02-09
- Description: implement strict hierarchical help outputs for module/action/use-case discovery.
- Priority: P1
- Implementation status: complete
- Review status: complete

## Key Insights
- Text-only can be AI-safe if sections are fixed and deterministic.
- Help hierarchy must mirror command hierarchy exactly.

## Requirements
<!-- Updated: Validation Session 1 - lock text-only strict help contract for MVP -->
- Functional:
  - Implement `hub -h`, `hub -h <module>`, `hub -h <module> <use-case>`.
  - Render strict text-only sections with stable ordering and markers.
  - Include keybindings/navigation notes for TUI-relevant actions.
  - Enforce every action defines complete help metadata.
- Non-functional:
  - No prose drift across runs.
  - Human-readable and parser-friendly formatting.

## Architecture
- `help-registry-view` queries contracts and returns normalized help model.
- `help-renderer` outputs strict sections and delimiters.
- `diagnostic-renderer` prints missing args/error guidance in same format family.

## Related code files
- Modify: none (greenfield)
- Create:
  - `src/help/help-model.ts`
  - `src/help/help-renderer.ts`
  - `src/help/hierarchy-resolver.ts`
  - `src/cli/help-command.ts`
- Delete: none

## Implementation Steps
1. Define strict help section schema and formatting rules.
2. Implement hierarchy resolver for module/action/use-case.
3. Implement renderers for normal help and error-help.
4. Wire help command to parser/runtime paths.

## Todo list
- [x] Help schema defined
- [x] Hierarchy resolver implemented
- [x] Renderer implemented
- [x] CLI integration complete

## Success Criteria
- All help levels print deterministic sections.
- Agent can discover command usage without interacting with TUI.

## Risk Assessment
- Risk: over-verbose help harms scanability.
  - Mitigation: concise defaults + expanded use-case mode.

## Security Considerations
- Ensure help/examples never include secrets.
- Validate untrusted metadata before rendering.

## Next steps
- Add test matrix and quality gates in Phase 05.
