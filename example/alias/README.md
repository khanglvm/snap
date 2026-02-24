# Alias CLI

Dedicated terminal tool package named `alias`, built on the Snap contract-first framework.
The package entrypoint uses Snap's `runSubmoduleCli` helper for argv parsing + module routing.

## Run (Dev)

```bash
npm run --prefix example/alias dev -- -h
npm run --prefix example/alias dev -- --op=list
```

## Build + Dedicated Command

```bash
npm run --prefix example/alias build
node example/alias/bin/alias.js --op=list
```

## Commands

```bash
# Open interactive module picker (Clack select/radio UI)
alias

# In interactive mode:
# - Esc = go back to previous screen (at module root: back to module list)
# - Ctrl+C = exit immediately
# - After each action, press any key to return to that module's root menu

# Show module/actions help
alias -h

# Show action-specific help
alias claude-profile -h
alias shell-reload -h
alias stealth-pnpm -h

# List profiles
alias --op=list

# Create or update profile
alias --op=upsert --name=cc \
  --ANTHROPIC_API_KEY=sk-ant-... \
  --ANTHROPIC_BASE_URL=https://api.anthropic.com \
  --ANTHROPIC_DEFAULT_OPUS_MODEL=claude-opus-4-1-20250805 \
  --ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-3-5-haiku-latest \
  --ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-4-20250514 \
  --SOME_UNKNOWN_ENV_KEY=test

# Show profile
alias --op=show --name=cc

# Rename profile
alias --op=rename --name=cc --to=cc_work

# Re-sync one or all profile aliases into shell rc
alias --op=sync --name=cc_work
alias --op=sync

# Remove profile
alias --op=remove --name=cc_work

# Install shell reload alias (rl/src/reload/custom)
alias shell-reload --op=install
alias shell-reload --op=install --name=reload

# Install stealth pnpm aliases (di/da/dr)
alias stealth-pnpm --op=install
alias stealth-pnpm --op=install --overwrite=true
```

## Imported modules

- `claude-profile`
- `shell-reload`
- `stealth-pnpm`

`src/app.ts` wires these feature modules as one alias app with default routing:
- `alias --op=...` routes to `claude-profile`
- `alias <module> --op=...` routes to that sub-module

## Source Layout

- `src/modules/*`: one module per feature (`claude-profile`, `shell-reload`, `stealth-pnpm`)
- `src/app.ts`: app-level module registry + submodule routing defaults
- `src/actions/*`: one folder per action (`claude-profile`, `shell-reload`, `stealth-pnpm`)
- `src/claude-profile/*`: profile domain logic split by concern (env/config/parse/sync/operations)
- `src/shared/*`: shared shell/file helpers
- `src/snap.ts`: framework helper imports (args/help/runtime/tui)

AI commit is intentionally not included in this alias package.

## Files Managed

- `~/.claude-alias.json`
- `~/.claude-alias-runner.js`
- `~/.zshrc` or `~/.bashrc` / `~/.bash_profile` (managed blocks per alias)

## Focused env variables

Pass focused env vars directly with uppercase flags:

- `--ANTHROPIC_API_KEY=...`
- `--ANTHROPIC_AUTH_TOKEN=...`
- `--ANTHROPIC_BASE_URL=...`
- `--ANTHROPIC_DEFAULT_OPUS_MODEL=...`
- `--ANTHROPIC_DEFAULT_HAIKU_MODEL=...`
- `--ANTHROPIC_DEFAULT_SONNET_MODEL=...`

Use one login env var per profile: `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN`.

## Other env variables

Helper: for `--op=upsert`, pass other env vars as `--ENV_NAME=value`.
Example: `--CLAUDE_CODE_USE_VERTEX=true --HTTP_PROXY=http://proxy.local:8080`.

Known Claude Code env names from docs:

```text
ANTHROPIC_API_KEY
ANTHROPIC_CUSTOM_HEADERS
ANTHROPIC_FOUNDRY_API_KEY
ANTHROPIC_FOUNDRY_BASE_URL
ANTHROPIC_FOUNDRY_RESOURCE
ANTHROPIC_MODEL
ANTHROPIC_SMALL_FAST_MODEL
ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION
AWS_BEARER_TOKEN_BEDROCK
BASH_DEFAULT_TIMEOUT_MS
BASH_MAX_OUTPUT_LENGTH
BASH_MAX_TIMEOUT_MS
CLAUDE_AUTOCOMPACT_PCT_OVERRIDE
CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
CLAUDE_CODE_API_KEY_HELPER_TTL_MS
CLAUDE_CODE_CLIENT_CERT
CLAUDE_CODE_CLIENT_KEY_PASSPHRASE
CLAUDE_CODE_CLIENT_KEY
CLAUDE_CODE_EFFORT_LEVEL
CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS
CLAUDE_CODE_DISABLE_AUTO_MEMORY
CLAUDE_CODE_DISABLE_BACKGROUND_TASKS
CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY
CLAUDE_CODE_EXIT_AFTER_STOP_DELAY
CLAUDE_CODE_PROXY_RESOLVES_HOSTS
CLAUDE_CODE_TASK_LIST_ID
CLAUDE_CODE_TEAM_NAME
CLAUDE_CODE_TMPDIR
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC
CLAUDE_CODE_DISABLE_TERMINAL_TITLE
CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION
CLAUDE_CODE_ENABLE_TASKS
CLAUDE_CODE_ENABLE_TELEMETRY
CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS
CLAUDE_CODE_HIDE_ACCOUNT_INFO
CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL
CLAUDE_CODE_MAX_OUTPUT_TOKENS
CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS
CLAUDE_CODE_PLAN_MODE_REQUIRED
CLAUDE_CODE_SHELL
CLAUDE_CODE_SHELL_PREFIX
CLAUDE_CODE_SKIP_BEDROCK_AUTH
CLAUDE_CODE_SKIP_FOUNDRY_AUTH
CLAUDE_CODE_SKIP_VERTEX_AUTH
CLAUDE_CODE_SUBAGENT_MODEL
CLAUDE_CODE_USE_BEDROCK
CLAUDE_CODE_USE_FOUNDRY
CLAUDE_CODE_USE_VERTEX
CLAUDE_CONFIG_DIR
CLAUDE_ENV_FILE
CLAUDE_PROJECT_DIR
DISABLE_AUTOUPDATER
DISABLE_BUG_COMMAND
DISABLE_COST_WARNINGS
DISABLE_ERROR_REPORTING
DISABLE_INSTALLATION_CHECKS
DISABLE_NON_ESSENTIAL_MODEL_CALLS
DISABLE_PROMPT_CACHING
DISABLE_PROMPT_CACHING_HAIKU
DISABLE_PROMPT_CACHING_OPUS
DISABLE_PROMPT_CACHING_SONNET
DISABLE_TELEMETRY
ENABLE_TOOL_SEARCH
FORCE_AUTOUPDATE_PLUGINS
HTTP_PROXY
HTTPS_PROXY
IS_DEMO
MAX_MCP_OUTPUT_TOKENS
MAX_THINKING_TOKENS
MCP_CLIENT_SECRET
MCP_OAUTH_CALLBACK_PORT
MCP_TIMEOUT
MCP_TOOL_TIMEOUT
NO_PROXY
OTEL_METRICS_EXPORTER
SLASH_COMMAND_TOOL_CHAR_BUDGET
USE_BUILTIN_RIPGREP
VERTEX_REGION_CLAUDE_3_5_HAIKU
VERTEX_REGION_CLAUDE_3_7_SONNET
VERTEX_REGION_CLAUDE_4_0_OPUS
VERTEX_REGION_CLAUDE_4_0_SONNET
VERTEX_REGION_CLAUDE_4_1_OPUS
```

Unknown uppercase env keys are also supported, for example `--SOME_UNKNOWN_ENV_KEY=test`.
