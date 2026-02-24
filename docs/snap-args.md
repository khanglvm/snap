# SnapArgs - Type-Safe Argument Reading

`SnapArgs` provides typed helper functions for reading and parsing command-line arguments and environment variables.

## Import

```typescript
import * as SnapArgs from 'snap-framework';
```

## API Reference

### `readStringArg(args, ...keys)`

Reads a string argument from multiple possible keys, returning the first non-empty value.

```typescript
const name = SnapArgs.readStringArg(context.args, 'name', 'username', 'user');
// Returns: string | undefined
```

**Usage Example:**

```typescript
run: async (context) => {
  const name = SnapArgs.readStringArg(context.args, 'name', 'username');
  if (!name) {
    return { ok: false, errorMessage: 'Name is required' };
  }
  return { ok: true, data: `Hello, ${name}` };
}
```

### `readRequiredStringArg(args, key, message?)`

Reads a required string argument, throwing an error if not present.

```typescript
const name = SnapArgs.readRequiredStringArg(context.args, 'name', 'Name is required');
// Returns: string (throws if missing)
```

**Usage Example:**

```typescript
run: async (context) => {
  try {
    const name = SnapArgs.readRequiredStringArg(context.args, 'name');
    return { ok: true, data: `Hello, ${name}` };
  } catch (error) {
    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### `readBooleanArg(args, ...keys)`

Reads a boolean argument, parsing common string representations.

```typescript
const verbose = SnapArgs.readBooleanArg(context.args, 'verbose', 'v');
// Returns: boolean | undefined
```

**Supported string values:**
- **True**: `'1'`, `'true'`, `'yes'`, `'y'`, `'on'`
- **False**: `'0'`, `'false'`, `'no'`, `'n'`, `'off'`

**Usage Example:**

```typescript
run: async (context) => {
  const verbose = SnapArgs.readBooleanArg(context.args, 'verbose', 'v');
  const debug = SnapArgs.readBooleanArg(context.args, 'debug');

  if (verbose) {
    context.terminal.line('Verbose mode enabled');
  }

  return { ok: true, data: { debug, verbose } };
}
```

### `parseBooleanLike(value)`

Parses a boolean-like string value into a boolean.

```typescript
const isTrue = SnapArgs.parseBooleanLike('yes');  // true
const isFalse = SnapArgs.parseBooleanLike('0');   // false
const isUndefined = SnapArgs.parseBooleanLike(undefined);  // undefined
```

**Usage Example:**

```typescript
run: async (context) => {
  const forceValue = context.args.force;

  if (forceValue !== undefined) {
    const force = SnapArgs.parseBooleanLike(forceValue);
    // Use force boolean
  }

  return { ok: true, data: {} };
}
```

### `collectUpperSnakeCaseEnvArgs(args, prefix)`

Collects environment variables with a given prefix into a typed object.

```typescript
const envArgs = SnapArgs.collectUpperSnakeCaseEnvArgs(context.args, 'MYAPP_');
// Returns: Partial<Record<UpperSnakeCaseKey, string>>
```

**Usage Example:**

```typescript
// With environment variables: MYAPP_API_KEY, MYAPP_TIMEOUT
run: async (context) => {
  const envArgs = SnapArgs.collectUpperSnakeCaseEnvArgs(context.args, 'MYAPP_');

  const apiKey = envArgs.MYAPP_API_KEY;
  const timeout = envArgs.MYAPP_TIMEOUT;

  return { ok: true, data: { apiKey, timeout } };
}
```

## Complete Example Module

Here's a complete module using `SnapArgs` helpers:

```typescript
import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';
import * as SnapArgs from 'snap-framework';

const deployModule: ModuleContract = {
  moduleId: 'deploy',
  description: 'Deployment management',
  actions: [
    {
      actionId: 'start',
      description: 'Start a deployment',
      tui: {
        steps: ['collect-environment', 'collect-options', 'confirm'],
        flow: {
          entryStepId: 'collect-environment',
          steps: [
            {
              stepId: 'collect-environment',
              title: 'Select Environment',
              components: [
                {
                  componentId: 'env',
                  type: 'select',
                  label: 'Environment',
                  arg: 'environment',
                  required: true,
                  options: [
                    { value: 'development', label: 'Development' },
                    { value: 'staging', label: 'Staging' },
                    { value: 'production', label: 'Production' }
                  ]
                }
              ]
            },
            {
              stepId: 'collect-options',
              title: 'Deployment Options',
              components: [
                {
                  componentId: 'verbose',
                  type: 'confirm',
                  label: 'Enable verbose logging',
                  arg: 'verbose'
                },
                {
                  componentId: 'force',
                  type: 'confirm',
                  label: 'Force deployment (skip checks)',
                  arg: 'force'
                }
              ]
            },
            {
              stepId: 'confirm',
              title: 'Confirm Deployment'
            }
          ]
        }
      },
      commandline: {
        requiredArgs: ['environment'],
        optionalArgs: ['verbose', 'force']
      },
      help: {
        summary: 'Deploy application to the specified environment.',
        args: [
          {
            name: 'environment',
            required: true,
            description: 'Target deployment environment',
            example: '--environment=production'
          },
          {
            name: 'verbose',
            required: false,
            description: 'Enable verbose output',
            example: '--verbose=true'
          },
          {
            name: 'force',
            required: false,
            description: 'Skip pre-deployment checks',
            example: '--force=yes'
          }
        ],
        examples: [
          'mytool deploy start --environment=production',
          'mytool deploy start --environment=staging --verbose=true'
        ],
        useCases: [
          {
            name: 'production',
            description: 'Deploy to production',
            command: 'mytool deploy start --environment=production'
          }
        ],
        keybindings: ['Enter confirm', 'Esc cancel']
      },
      run: async (context) => {
        // Read required environment
        const environment = SnapArgs.readRequiredStringArg(
          context.args,
          'environment',
          'Environment is required'
        );

        // Read optional boolean flags
        const verbose = SnapArgs.readBooleanArg(context.args, 'verbose') ?? false;
        const force = SnapArgs.readBooleanArg(context.args, 'force') ?? false;

        if (verbose) {
          context.terminal.line(`Deploying to ${environment}...`);
        }

        if (force) {
          context.terminal.line('Warning: Skipping pre-deployment checks!');
        }

        // Perform deployment logic here...

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: `Deployed to ${environment}`
        };
      }
    }
  ]
};

export default deployModule;
```

## Environment Variable Integration

Combine commandline args with environment variables:

```typescript
run: async (context) => {
  // Try commandline first, fall back to environment
  const apiKey = SnapArgs.readStringArg(
    context.args,
    'api-key',
    'apiKey',
    'API_KEY'
  );

  if (!apiKey) {
    return {
      ok: false,
      errorMessage: 'API key must be provided via --api-key or API_KEY env var'
    };
  }

  return { ok: true, data: { apiKey } };
}
```

## Best Practices

1. **Always validate required args**: Use `readRequiredStringArg` for critical arguments
2. **Provide fallback values**: Use `??` operator for optional defaults
3. **Support multiple key aliases**: Use variadic args for flexible naming
4. **Parse booleans safely**: Always use `readBooleanArg` for flag arguments
5. **Collect environment prefixes**: Use `collectUpperSnakeCaseEnvArgs` for env var grouping

## Type Safety

`SnapArgs` provides full TypeScript type safety:

```typescript
import type { CliArgs } from 'snap-framework';

const args: CliArgs = {
  name: 'Alice',
  verbose: 'true',
  count: '42'
};

// TypeScript knows these return types
const name: string | undefined = SnapArgs.readStringArg(args, 'name');
const verbose: boolean | undefined = SnapArgs.readBooleanArg(args, 'verbose');
```
