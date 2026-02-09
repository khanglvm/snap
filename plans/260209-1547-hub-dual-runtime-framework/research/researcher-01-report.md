# Researcher 01 Report

- Conducted: 2026-02-09 (Asia/Saigon)
- Scope: greenfield TypeScript Node.js framework unifying TUI + CLI for human + AI operators
- Bias: YAGNI/KISS/DRY, minimal moving parts, deterministic output

## Executive takeaways

1. Use **single-source action contracts** as core artifact; generate CLI, TUI, and help from same schema.
2. Treat TUI as a **state machine wrapper** over the same command executor used by CLI.
3. For AI compatibility, make help output **strict text sections** + stable keys (no ANSI, no prose drift).
4. `@clack/prompts` is strong for interactive UX, but cancellation/interrupt handling must be centralized and explicit.
5. `@bomb.sh/args` is suitable for typed parsing + discoverability; pair it with contract-driven metadata for rich help.

---

## 1) Architecture patterns: single-source contracts for TUI + CLI + docs

### Recommended pattern: Action Contract Registry
Define every action once:

```ts
type ActionContract = {
  id: "module.action.useCase";
  summary: string;
  args: ArgSpec[];
  options: OptionSpec[];
  interactive: PromptPlan[];   // optional
  execute: (ctx: RunContext) => Promise<Result>;
  examples: string[];
  aiNotes?: string[];
};
```

Build layers:

- **Contract layer**: pure metadata + validator + executor binding.
- **Execution layer**: shared runtime, idempotent, no UI logic.
- **Interface adapters**:
  - CLI adapter (`@bomb.sh/args`) maps argv -> ctx
  - TUI adapter (`@clack/prompts`) maps prompts -> same ctx
  - Help adapter renders strict docs from contract

Why this wins:
- DRY: one action definition.
- KISS: no duplicated business logic between TUI/CLI.
- YAGNI: only add prompt plans for actions that need interactivity.

### Contract-driven generation targets
- Command tree (`module action [use-case]`)
- Flags and defaults
- Validation rules and coercion
- Example snippets
- Help docs (human + AI mode)

---

## 2) Clack capabilities/constraints relevant here

Observed/known patterns from official package/docs:

- Prompt primitives: `select`, `multiselect`, `confirm`, text-like inputs.
- Flow control: `isCancel(value)` + `cancel()` pattern after each prompt.
- Interrupt model: ESC/Ctrl+C should map to unified cancel path (do not continue execution).
- Async tasks/logging: spinner/task progress style pattern (`intro/outro`, task wrappers) for long-running steps.
- Grouped flows: compose multiple prompts sequentially, capture object payload, short-circuit on cancel.

Practical constraints:
- Terminal UX can break under non-TTY; detect and auto-fallback to CLI flags.
- Avoid deep nested prompt flows; keep <=3 levels to reduce abandonment.
- Cancellation must be treated as first-class result (`status: "cancelled"`) not exception spam.

---

## 3) `@bomb.sh/args` usage patterns for robust parsing/discoverability

Recommended usage model:

- Keep top-level parser thin; load command modules lazily.
- Explicit command metadata in contract:
  - `name`, `aliases`, `summary`, `examples`, `deprecated`, `hidden`
- Use parser for:
  - strict unknown-flag errors
  - typed coercion
  - defaulting
  - per-command help
- Discoverability:
  - support `--help`, `help <module>`, `help <module> <action>`
  - add “related commands” list from same registry
  - always print next-step hints after errors

Rule: parser does parsing; **contract executor does business logic**.

---

## 4) Help system design (hierarchical, AI-optimized text-only)

### Output contract (strict sections, stable ordering)

For every help response, always print:

1. `PATH` (module/action/use-case)
2. `PURPOSE`
3. `USAGE`
4. `ARGS`
5. `OPTIONS`
6. `EXAMPLES`
7. `EXIT_CODES`
8. `RELATED`
9. `MACHINE_READABLE_SCHEMA` (compact JSON)

Design notes:
- No ANSI colors in AI mode.
- No variable phrasing; keep section headers exact.
- Keep line lengths predictable; avoid tables if parser stability matters.
- Add `--format ai|human|json`; default human for TTY, ai for non-interactive agents.

---

## 5) Edge-case navigation policies for state-machine terminal UX

Use finite states:

`Idle -> CollectingInput -> Validating -> Confirming -> Executing -> Completed | Cancelled | Failed`

Mandatory policies:
- Invalid input: inline error + retry count (max 3), then suggest `--help`.
- Cancel (ESC/Ctrl+C): immediate transition to `Cancelled`, print resumable hint.
- Go back: support one-step back in prompt flows (`Back` option in selects).
- Jump: allow “jump to section” only in long forms; otherwise YAGNI.
- Exit: always available, same semantics as cancel.
- Recoverability: if execution not started, lossless exit; if started, print rollback/retry guidance.

Error taxonomy:
- `E_INPUT_INVALID`
- `E_USER_CANCELLED`
- `E_RUNTIME_FAILURE`
- `E_DEPENDENCY_UNAVAILABLE`

Use same codes in CLI/TUI/help docs for deterministic automation.

---

## Suggested baseline stack (minimal)

- Node.js LTS + TypeScript strict mode
- `@bomb.sh/args` for argv parsing
- `@clack/prompts` for interactive flows
- `zod` (or equivalent) for contract validation
- one shared `ActionRegistry` package inside monorepo/app

---

## Source URLs

- https://www.npmjs.com/package/@clack/prompts
- https://github.com/bombshell-dev/clack
- https://bomb.sh
- https://www.npmjs.com/search?q=%40bomb.sh%2Fargs
- https://github.com/search?q=%40bomb.sh%2Fargs&type=repositories

## Unresolved questions

- Exact latest API surface of `@bomb.sh/args` (official reference pages were not directly retrievable in-session).
- Preferred canonical doc URL for Bomb.sh args module (site path ambiguity).
- Whether framework should support resumable prompt sessions (persisted checkpoints) in v1 or defer (YAGNI).
