# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
