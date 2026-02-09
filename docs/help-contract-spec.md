# Help Contract Spec

## Output Contract

Help renderer must produce deterministic text sections in this order:

1. `# HELP`
2. `MODULE: <module-id>`
3. `ACTION: <action-id|*>`
4. Section blocks:
   - `## MODULE`
   - `## ACTIONS`
   - `## SUMMARY`
   - `## ARGS`
   - `## EXAMPLES`
   - `## USE-CASES`
   - `## KEYBINDINGS`

Each line item in section body uses `- <content>`.

## CLI Levels

- `hub -h` => module overview list.
- `hub -h <module>` => module scoped list.
- `hub -h <module> <action>` => action detail.

## Validation

Missing target returns non-zero exit code with deterministic error message.
