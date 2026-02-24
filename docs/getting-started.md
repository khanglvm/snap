# Getting Started with Snap

Snap is a contract-first TypeScript framework for terminal workflows that enforces the action triad: TUI flow, commandline args, and help metadata.

## Installation

```bash
npm install snap-framework
# or
yarn add snap-framework
# or
pnpm add snap-framework
```

## Quick Start

### 1. Create Your First Module

A minimal module consists of a `ModuleContract` with one or more actions. Each action must define:

- **tui**: Interactive flow steps (or structured flow)
- **commandline**: Required and optional arguments
- **help**: Summary, args, examples, and use cases
- **run**: The action handler function

```typescript
import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';

const greeterModule: ModuleContract = {
  moduleId: 'greet',
  description: 'Greeting module',
  actions: [
    {
      actionId: 'hello',
      description: 'Say hello to someone',
      tui: { steps: ['collect-name', 'confirm'] },
      commandline: { requiredArgs: ['name'] },
      help: {
        summary: 'Say hello to a person by name.',
        args: [
          {
            name: 'name',
            required: true,
            description: 'Name of the person to greet',
            example: '--name=Alice'
          }
        ],
        examples: ['mytool greet hello --name=Alice'],
        useCases: [
          {
            name: 'basic',
            description: 'Basic greeting',
            command: 'mytool greet hello --name=Alice'
          }
        ],
        keybindings: ['Enter confirm', 'Esc cancel']
      },
      run: async (context) => {
        const name = String(context.args.name ?? 'World');
        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: `Hello, ${name}!`
        };
      }
    }
  ]
};

export default greeterModule;
```

### 2. Create Your CLI Entry Point

#### Multi-Module CLI (Standard)

For tools with multiple modules:

```typescript
#!/usr/bin/env node
import { createRegistry, runMultiModuleCli } from 'snap-framework';
import greeterModule from './modules/greeter.js';
import calculatorModule from './modules/calculator.js';

const registry = createRegistry([
  greeterModule,
  calculatorModule
]);

await runMultiModuleCli({
  registry,
  cliName: 'mytool'
});
```

#### Single-Module CLI

For dedicated tools that only have one module:

```typescript
#!/usr/bin/env node
import { createRegistry, runSingleModuleCli } from 'snap-framework';
import greeterModule from './module.js';

const registry = createRegistry([greeterModule]);

await runSingleModuleCli({
  registry,
  moduleSelector: () => greeterModule,
  defaultActionId: 'hello'
});
```

#### Submodule CLI

For tools organized by feature submodules:

```typescript
#!/usr/bin/env node
import { runSubmoduleCli } from 'snap-framework';
import { app } from './app.js';

await runSubmoduleCli({
  app,
  cliName: 'mytool'
});
```

### 3. Make Your CLI Executable

Add to your `package.json`:

```json
{
  "name": "mytool",
  "version": "1.0.0",
  "bin": {
    "mytool": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc && node dist/cli.js",
    "typecheck": "tsc --noEmit"
  },
  "type": "module"
}
```

### 4. Run Your CLI

```bash
# Build and run
npm run build
npm run dev -- -h
npm run dev -- greet hello --name=Alice

# Or install globally and run
npm link
mytool -h
mytool greet hello --name=Alice
```

## Usage Modes

Snap automatically switches between two modes:

### TUI Mode (Interactive)

When required arguments are not provided via commandline, Snap launches an interactive TUI:

```bash
mytool greet hello
# → Launches interactive prompts
```

### CLI Mode (Auto)

When all required arguments are provided, Snap runs directly without prompts:

```bash
mytool greet hello --name=Alice
# → Runs immediately, outputs: Hello, Alice!
```

## Help System

Snap provides deterministic, text-only help at three levels:

```bash
# Top-level help (all modules)
mytool -h

# Module-level help
mytool -h greet

# Action-level help
mytool -h greet hello
```

## TypeScript Configuration

Ensure your `tsconfig.json` is configured correctly:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Next Steps

- Learn about **DX Helpers** for cleaner code:
  - [SnapArgs](./snap-args.md) - Type-safe argument reading
  - [SnapHelp](./snap-help.md) - Schema-driven help generation
  - [SnapRuntime](./snap-runtime.md) - Standardized action results
  - [SnapTui](./snap-tui.md) - Typed TUI flow definitions + advanced UI components
  - [SnapTerminal](./snap-terminal.md) - Terminal output helpers

- Check the [Component Reference](./component-reference.md) for all available UI components including:
  - Spinner (loader for async operations)
  - Password prompt (secure input)
  - Tasks (sequential operations)
  - Autocomplete (searchable selections)
  - Note (decorative message boxes)

- Explore [Integration Examples](./integration-examples.md) for common patterns

- Read the [Module Authoring Guide](./module-authoring-guide.md) for advanced topics
