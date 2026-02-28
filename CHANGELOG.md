# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.10] - 2026-02-28

### Fixed
- Seeded multiline prompt readline buffer from `initialValue`, so editing existing values supports character-by-character backspace/delete behavior.
- Improved multiline paste recovery when terminal submit flow collapses newline-separated URLs into a concatenated single line.
- Added regression coverage for concatenated submit recovery and initial-value editability.

## [0.3.9] - 2026-02-28

### Fixed
- Added multiline paste recovery for cases where readline submit flow only exposes the last pasted line.
- Recovery now uses recent raw paste chunks to reconstruct full multi-line content when the submit payload is unexpectedly single-line.
- Added regression coverage for the “last line only after multiline paste” scenario.

## [0.3.8] - 2026-02-26

### Fixed
- Prevented premature submit during non-bracketed multi-line paste bursts where newline Enter events were treated as user submit before all pasted lines arrived.
- Added explicit paste-burst detection from raw input stream and suppressed Enter-submit only during the short paste window.
- Kept bracketed paste behavior intact and avoided false suppression after paste-end marker.
- Added regression coverage for non-bracketed multi-line paste with delayed second-line arrival.

## [0.3.7] - 2026-02-26

### Fixed
- Fixed Enter-submit race in multiline prompt where pasted multi-line input could lose the final line and submit only the first line.
- Enter submit now waits briefly for the corresponding readline `line` event (with fallback timeout), preserving pending paste buffer content.
- Prompt rendering now prefers live readline buffer content so pending pasted lines are visible before submit.
- Added regression coverage for the “first line only after multiline paste” scenario.

## [0.3.6] - 2026-02-26

### Fixed
- Prevented accidental submit during terminal-native multi-line paste by detecting bracketed paste mode (`ESC[200~ ... ESC[201~`) and suppressing Enter submit while paste is in progress.
- Improved multiline prompt handling in Ghostty/macOS when pasted newlines are delivered via terminal stream instead of explicit paste shortcuts.
- Added regression coverage for bracketed multi-line paste to ensure pasted content is preserved until the user explicitly submits.

## [0.3.5] - 2026-02-26

### Fixed
- Added an additional Ghostty/macOS fallback for `Shift+Enter` when emitted as plain `1`, `3`, `~` keypress chars (no modifier metadata).
- Added submit-time sanitation of residual Ghostty shift-enter tokens (`13~`, related escape variants) so pasted/echoed artifacts become real newlines in multiline prompts.
- Added regression coverage for plain-char `13~` keypress and residual token sanitation.

## [0.3.4] - 2026-02-26

### Fixed
- Fixed `picocolors` ESM/CJS interop in multiline and password adapters to prevent runtime errors like `pc.cyan is not a function`.
- Keeps Ghostty `Shift+Enter` (`13~`) fallback and custom password input fixes from `0.3.3`.

## [0.3.3] - 2026-02-26

### Fixed
- Added a robust `Shift+Enter` fallback for Ghostty/macOS when terminals emit literal suffix tokens like `13~` via line events without keypress modifiers.
- Kept `Enter` submit behavior intact while allowing newline insertion from both keypress and fallback sequence paths.
- Replaced raw `@clack/prompts` password rendering with a stable raw-mode password input path to avoid visual cursor/glyph jitter (including the 3-character middle-glyph jump case).
- Added regression tests for Ghostty `13~` fallback handling and password input behavior.

## [0.3.2] - 2026-02-26

### Fixed
- Added Ghostty macOS fallback handling for `Shift+Enter` escape sequence variants like `13~`, so multiline prompts insert newline instead of echoing sequence text.
- Added regression coverage for the `13~` modified-enter sequence path.

## [0.3.1] - 2026-02-26

### Fixed
- Multiline text prompt now submits on `Enter` in raw input mode, restoring submit behavior in macOS terminals like JetBrains and Ghostty.
- Added `Shift+Enter` (and `Alt+Enter` fallback) support to insert newline in multiline prompt mode.
- Restored terminal state reliably by disabling raw mode and detaching keypress listeners on prompt cleanup.
- Added regression tests covering `Enter` submit and `Shift+Enter` newline behavior for multiline prompts.

## [0.2.0] - 2025-02-24

### Added
- **New Components**: Added `spinner` component for loading states during long-running operations
- **New Components**: Added `password` component for secure text input
- **New Terminal Features**: Added structured logging with `log.info()`, `log.success()`, `log.warn()`, `log.error()` utilities
- **Documentation**: Comprehensive Getting Started guide with installation and quick start examples
- **Documentation**: SnapArgs documentation - type-safe argument reading helpers
- **Documentation**: SnapHelp documentation - schema-driven help generation
- **Documentation**: SnapRuntime documentation - standardized action result helpers
- **Documentation**: SnapTui documentation - typed TUI flow definitions and components
- **Documentation**: SnapTerminal documentation - terminal output and logging helpers
- **Documentation**: Integration examples demonstrating common patterns
- **Examples**: Full example project in `example/` directory
- **Tests**: Added comprehensive test coverage for new components and documentation examples

### Changed
- Enhanced `TerminalOutput` interface with `info()`, `success()`, and `warn()` methods
- Updated `.gitignore` with comprehensive Node.js package patterns
- Removed `.idea/` folder from git tracking

### Fixed
- Fixed issue where users couldn't discover available components (now fully documented)

## [0.1.1] - 2025-02-10

### Added
- Initial release of Snap framework
- Contract-first TypeScript framework for terminal workflows
- Core contracts: ActionContract, ModuleContract, HelpContract, TuiContract
- CLI runners: multi-module, single-module, and submodule support
- DX helpers: SnapArgs, SnapHelp, SnapRuntime, SnapTui, SnapTerminal
- TUI components: text, confirm, select, multiselect, cancel, group
- Help system with deterministic, text-only output
