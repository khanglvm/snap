# Researcher 02 Report

_Date: 2026-02-09 (Asia/Saigon)_
_Target: TypeScript Node.js framework for unified CLI/TUI (human + AI)_

## Executive Summary
- Use a 4-layer test strategy: unit, integration, transcript snapshot, e2e.
- Use `tsup` for build outputs and `tsx` for dev ergonomics.
- Keep plugin/module loading in-process and explicit.
- Guardrails needed for command injection, secret leakage, and terminal escape issues.

## 1) Testing Strategy for Terminal Frameworks
Test pyramid:
1. Unit (majority): parser, validation, flow transitions
2. Integration: command execution and IO behavior
3. Transcript snapshot: deterministic terminal output frames/events
4. E2E: smoke critical flows via real process/PTY

Flake controls:
- deterministic env (TZ, locale, seeded randomness)
- retries only for e2e/transcript where justified
- quarantine policy for unstable tests

CI matrix (minimal):
- OS: ubuntu, macos, windows
- Node: active LTS + current
- job split: lint/typecheck/unit, integration, transcript, e2e-smoke

## 2) TypeScript Packaging/Build
Baseline strategy:
- Build with `tsup` (ESM/CJS + d.ts)
- Dev run with `tsx`
- Published CLI uses compiled `bin` entry
- `exports` map for framework API surface

Suggested shape:
- `src/core/*`
- `src/cli-entry.ts`
- `src/public-api.ts`
- outputs in `dist/`

## 3) Developer Bootstrap API Patterns
Recommended fluent bootstrap style:
- `createHub().use(...).command(...).start()`
- capability plugins with explicit setup/dispose hooks
- command objects with metadata + run(ctx,args)
- typed context injection and lifecycle hooks

Avoid:
- hidden globals
- excessive DI abstraction in v1
- implicit runtime auto-discovery magic

## 4) Security + Reliability Guardrails
Security:
- never shell-execute unsanitized input
- redact secrets from logs/transcripts
- sanitize untrusted terminal output
- plugin compatibility checks + trust policy

Reliability:
- timeouts and cancellation via AbortController
- stable exit code taxonomy
- crash-safe top-level handlers
- atomic writes for config/session artifacts

Ship gate checklist:
- shell wrapper audit
- secret redaction tests
- transcript sanitization
- plugin version checks
- cross-platform path/encoding tests

## Sources
- https://nodejs.org/api/packages.html
- https://github.com/egoist/tsup
- https://github.com/privatenumber/tsx
- https://vitest.dev/guide/
- https://playwright.dev/docs/test-cli
- https://owasp.org/www-community/attacks/Command_Injection
- https://owasp.org/www-project-top-ten/
- https://oclif.io/

## Unresolved questions
1. Keep plugin runtime local-only in v1 or support dynamic package loading?
2. Preferred transcript golden format: ANSI snapshot vs structured events vs both?
3. Need compliance constraints (e.g., FIPS) now or later?
