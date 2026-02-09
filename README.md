# Snap

Snap is a contract-first TypeScript framework for terminal workflows.

It runs one action contract in 2 modes:
- **TUI-first** (default for interactive terminals)
- **Auto CLI** (non-interactive when required args are already provided)

It also enforces deterministic, text-only help so both **humans** and **AI agents** can discover commands reliably.

## What this framework does

- Enforces action triad at registration: `tui + commandline + help`
- Uses one runtime engine for TUI and CLI paths
- Supports workflow transitions: `next`, `back`, `jump`, `exit`
- Supports resume checkpoints for interrupted flows
- Produces stable help output hierarchy:
  - `snap -h`
  - `snap -h <module>`
  - `snap -h <module> <action>`

## Repository

```bash
git clone git@github.com:khanglvm/snap.git
cd snap
```

## Quick start

```bash
npm install
npm run typecheck
npm run build
npm test
```

## Usage

```bash
npm run dev -- -h
npm run dev -- content slugify --text="Hello World"
npm run dev -- system node-info
```

## For module authors

- `docs/module-authoring-guide.md`
- `docs/help-contract-spec.md`
