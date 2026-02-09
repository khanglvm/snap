# Module Authoring Guide

## Goal

Define actions once with full triad contract:

- `tui` flow steps
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

## Register Module

Add module to registry bootstrapping in `/Users/khang/Documents/repo/snap/src/cli-entry.ts`.

## Validation Rules

Registration fails if any action misses triad data (`tui`, `commandline`, `help`).
