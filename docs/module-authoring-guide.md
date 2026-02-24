# Module Authoring Guide

## Goal

Define actions once with full triad contract:

- `tui` flow steps (legacy `steps` or structured `flow`)
- `commandline` required/optional args
- `help` metadata

## Minimal Module Shape

```ts
import type { ModuleContract } from '../core/contracts/module-contract.js';
import { ExitCode } from '../core/errors/framework-errors.js';

const moduleContract: ModuleContract = {
  moduleId: 'example',
  description: 'Example module',
  actions: [
    {
      actionId: 'run',
      description: 'Run example action',
      tui: { steps: ['collect-input', 'confirm'] },
      commandline: { requiredArgs: ['name'] },
      help: {
        summary: 'Run example with one name argument.',
        args: [{ name: 'name', required: true, description: 'Target name' }],
        examples: ['hub example run --name=alice'],
        useCases: [{ name: 'default', description: 'Basic usage', command: 'hub example run --name=alice' }],
        keybindings: ['Enter confirm', 'Esc cancel']
      },
      run: async (context) => ({
        ok: true,
        mode: context.mode,
        exitCode: ExitCode.SUCCESS,
        data: `hello ${String(context.args.name ?? '')}`
      })
    }
  ]
};

export default moduleContract;
```

## Structured TUI Flow (Optional)

Use `tui.flow` when you need explicit component/step definitions:

```ts
tui: {
  flow: {
    entryStepId: 'operation',
    steps: [
      {
        stepId: 'operation',
        title: 'Choose operation',
        components: [
          {
            componentId: 'op',
            type: 'select',
            label: 'Operation',
            arg: 'op',
            required: true,
            options: [
              { value: 'list', label: 'List profiles' },
              { value: 'upsert', label: 'Create/update profile' }
            ]
          }
        ]
      }
    ]
  }
}
```

`tui.steps` remains supported and backward compatible.

## Custom TUI Components

For advanced prompts (for example custom searchable selectors inspired by Clack patterns), declare custom components in flow metadata:

```ts
import { SnapTui } from '../src/index.js';

const flow = SnapTui.defineTuiFlow({
  entryStepId: 'choose',
  steps: [
    {
      stepId: 'choose',
      title: 'Choose target',
      components: [
        SnapTui.defineCustomTuiComponent({
          componentId: 'target',
          label: 'Target',
          arg: 'target',
          renderer: 'searchable-select',
          config: { maxItems: 8, allowCustomValue: true }
        })
      ]
    }
  ]
});
```

`renderer` identifies your adapter implementation while preserving a typed, framework-level contract.

## Register Module

Add module to registry bootstrapping in `/Users/khang/Documents/repo/snap/src/cli-entry.ts`.

## CLI Bootstrapping Helpers

Use Snap CLI helpers so module/tool authors do not re-implement argv parsing and dispatch:

```ts
import { createRegistry, runMultiModuleCli, runSingleModuleCli, runSubmoduleCli } from '../src/index.js';
```

- `runMultiModuleCli`: standard `tool <module> <action> --args`.
- `runSingleModuleCli`: dedicated tool package mapped to one module, with optional default action.
- `runSubmoduleCli`: dedicated tool package with multiple sub-modules (`tool <submodule> ...`) plus optional default sub-module.
  - Supports `-h/--help`.
  - Parses `--key=value`, `--key value`, and boolean flags.
  - Routes help and action dispatch through framework runtime.

## DX Helpers

Snap exposes optional helpers so action authors avoid low-level terminal and argv plumbing:

```ts
import { SnapArgs, SnapHelp, SnapRuntime, SnapTui } from '../src/index.js';
```

- `SnapArgs`: typed argument readers and parsers (`readStringArg`, `readBooleanArg`, `collectUpperSnakeCaseEnvArgs`).
- `SnapHelp`: help/commandline builder from arg schema (`defineArgSchema`, `buildHelpFromArgSchema`, `commandlineFromArgSchema`).
- `SnapRuntime`: action result helpers (`runActionSafely`, standardized success/error envelopes).
- `SnapTui`: typed TUI flow/component definitions (`defineTuiFlow`, `defineCustomTuiComponent`).

Action runtime context already includes friendly APIs:

```ts
context.prompts.text(...)
context.prompts.select(...)
context.terminal.line(...)
context.flow.next()
```

Interactive prompt calls are rendered with Clack components through Snap adapters, including option hints and cancellation handling.

No direct `process.stdout` / state-machine wiring is required in module actions.

## Validation Rules

Registration fails if any action misses triad data (`tui`, `commandline`, `help`).
A valid `tui` must provide either non-empty `steps` or non-empty `flow.steps`.
