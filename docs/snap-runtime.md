# SnapRuntime - Standardized Action Results

`SnapRuntime` provides helpers for creating standardized action results and handling errors gracefully.

## Import

```typescript
import * as SnapRuntime from 'snap-framework';
```

## Core Concepts

### ActionResultEnvelope

All Snap actions return an `ActionResultEnvelope<T>`:

```typescript
interface ActionResultEnvelope<T = unknown> {
  ok: boolean;
  mode: RuntimeMode;  // 'tui' | 'cli'
  exitCode: ExitCode;
  data?: T;
  errorMessage?: string;
}
```

### Exit Codes

Snap provides standard exit codes:

```typescript
enum ExitCode {
  SUCCESS = 0,
  VALIDATION_ERROR = 1,
  RUNTIME_ERROR = 2,
  INTERRUPTED = 130  // User cancelled (Ctrl+C)
}
```

## API Reference

### `toSuccessResult(context, data, exitCode?)`

Creates a successful action result.

```typescript
const result = SnapRuntime.toSuccessResult(context, responseData);
// Returns: ActionResultEnvelope<T>
```

**Parameters:**
- `context` - The RuntimeContext from the action
- `data` - The data to return
- `exitCode` - Optional exit code (defaults to `ExitCode.SUCCESS`)

**Usage Example:**

```typescript
run: async (context) => {
  const data = { userId: 123, name: 'Alice' };
  return SnapRuntime.toSuccessResult(context, data);
}
```

### `toErrorResult(context, error, fallbackMessage, exitCode?)`

Creates an error action result with automatic cancellation handling.

```typescript
const result = SnapRuntime.toErrorResult(context, error, 'Operation failed');
// Returns: ActionResultEnvelope<T>
```

**Parameters:**
- `context` - The RuntimeContext from the action
- `error` - The error that occurred
- `fallbackMessage` - Message if error is not an Error instance
- `exitCode` - Optional exit code (defaults to `ExitCode.VALIDATION_ERROR`)

**Special Behavior:**
- Detects prompt cancellation errors automatically
- Returns `ExitCode.INTERRUPTED` for user cancellations
- Extracts error messages from Error instances

**Usage Example:**

```typescript
run: async (context) => {
  try {
    const result = await someOperation();
    return SnapRuntime.toSuccessResult(context, result);
  } catch (error) {
    return SnapRuntime.toErrorResult(
      context,
      error,
      'Failed to complete operation'
    );
  }
}
```

### `runActionSafely(input)`

Wraps action execution with automatic error handling and flow exit.

```typescript
const result = await SnapRuntime.runActionSafely({
  context,
  execute: async () => {
    // Your action logic here
    return resultData;
  },
  fallbackErrorMessage: 'Operation failed',
  onSuccess: (result) => {
    // Optional transform
    return transform(result);
  }
});
```

**Parameters:**
- `context` - The RuntimeContext from the action
- `execute` - Async function with action logic
- `fallbackErrorMessage` - Message if execution fails
- `onSuccess` - Optional result transformation function

**Behavior:**
1. Calls `execute()` with your action logic
2. Automatically calls `context.flow.exit()` on success
3. Catches errors and converts to error results
4. Handles prompt cancellations gracefully
5. Applies optional `onSuccess` transformation

## Complete Examples

### Basic Success/Error Pattern

```typescript
import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';
import * as SnapRuntime from 'snap-framework';

const fileModule: ModuleContract = {
  moduleId: 'file',
  description: 'File operations',
  actions: [
    {
      actionId: 'read',
      description: 'Read file contents',
      tui: { steps: ['collect-path', 'show-content'] },
      commandline: { requiredArgs: ['path'] },
      help: {
        summary: 'Read and display file contents.',
        args: [{ name: 'path', required: true, description: 'File path' }],
        examples: ['mytool file read --path=./file.txt']
      },
      run: async (context) => {
        try {
          const path = String(context.args.path ?? '');

          // File reading logic
          const content = await readFile(path);

          return SnapRuntime.toSuccessResult(context, content);
        } catch (error) {
          return SnapRuntime.toErrorResult(
            context,
            error,
            'Failed to read file'
          );
        }
      }
    }
  ]
};

export default fileModule;
```

### Using runActionSafely

```typescript
const deployModule: ModuleContract = {
  moduleId: 'deploy',
  description: 'Deployment management',
  actions: [
    {
      actionId: 'start',
      description: 'Start deployment',
      tui: { steps: ['collect-input', 'confirm', 'deploy'] },
      commandline: { requiredArgs: ['environment'] },
      help: {
        summary: 'Deploy to environment.',
        args: [{ name: 'environment', required: true, description: 'Target env' }]
      },
      run: async (context) => {
        return SnapRuntime.runActionSafely({
          context,
          fallbackErrorMessage: 'Deployment failed',
          execute: async () => {
            const environment = String(context.args.environment ?? '');

            // Deployment logic here
            await deployToEnvironment(environment);

            // Return success data
            return {
              environment,
              status: 'deployed',
              timestamp: new Date().toISOString()
            };
          },
          onSuccess: (result) => {
            // Optional: Transform result before returning
            context.terminal.line(`Deployed to ${result.environment}`);
            return result;
          }
        });
      }
    }
  ]
};
```

### Complex Error Handling

```typescript
const apiModule: ModuleContract = {
  moduleId: 'api',
  description: 'API operations',
  actions: [
    {
      actionId: 'fetch',
      description: 'Fetch from API',
      tui: { steps: ['collect-url', 'show-response'] },
      commandline: { requiredArgs: ['url'] },
      help: {
        summary: 'Fetch data from API endpoint.',
        args: [{ name: 'url', required: true, description: 'API URL' }]
      },
      run: async (context) => {
        return SnapRuntime.runActionSafely({
          context,
          fallbackErrorMessage: 'API request failed',
          execute: async () => {
            const url = String(context.args.url ?? '');
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
          },
          onSuccess: (data) => {
            context.terminal.line(`Fetched ${Object.keys(data).length} fields`);
            return data;
          }
        });
      }
    }
  ]
};
```

### Handling Different Exit Codes

```typescript
const validationModule: ModuleContract = {
  moduleId: 'validate',
  description: 'Validation tools',
  actions: [
    {
      actionId: 'check',
      description: 'Validate configuration',
      tui: { steps: ['collect-config', 'show-results'] },
      commandline: { requiredArgs: ['config'] },
      help: {
        summary: 'Validate configuration file.',
        args: [{ name: 'config', required: true, description: 'Config path' }]
      },
      run: async (context) => {
        try {
          const configPath = String(context.args.config ?? '');
          const config = await loadConfig(configPath);

          const errors = validateConfig(config);

          if (errors.length > 0) {
            // Validation failed - use validation error exit code
            return {
              ok: false,
              mode: context.mode,
              exitCode: ExitCode.VALIDATION_ERROR,
              errorMessage: errors.join('; ')
            };
          }

          return SnapRuntime.toSuccessResult(context, { valid: true });
        } catch (error) {
          // Runtime error - use runtime error exit code
          return SnapRuntime.toErrorResult(
            context,
            error,
            'Failed to validate configuration',
            ExitCode.RUNTIME_ERROR
          );
        }
      }
    }
  ]
};
```

## Flow Control Integration

SnapRuntime integrates with `FlowController`:

```typescript
import type { FlowController } from 'snap-framework';

run: async (context) => {
  const flow = context.flow;

  // Conditionally exit flow
  if (someCondition) {
    flow.exit();
    return SnapRuntime.toSuccessResult(context, { earlyExit: true });
  }

  // Continue to next step
  flow.next();

  return SnapRuntime.toSuccessResult(context, { completed: true });
}
```

**Note:** `runActionSafely` automatically calls `flow.exit()` on success.

## Prompt Cancellation Handling

SnapRuntime automatically detects when users cancel prompts (Ctrl+C or Esc):

```typescript
run: async (context) => {
  return SnapRuntime.runActionSafely({
    context,
    fallbackErrorMessage: 'Operation failed',
    execute: async () => {
      // User cancels here - handled automatically
      const name = await context.prompts.text({
        message: 'Enter your name:'
      });

      return { name };
    }
  });
  // If cancelled, returns:
  // { ok: false, exitCode: ExitCode.INTERRUPTED, errorMessage: undefined }
}
```

## Best Practices

1. **Always use runActionSafely** - Provides consistent error handling
2. **Provide clear fallback messages** - Help users understand failures
3. **Use appropriate exit codes** - Match exit code to error type
4. **Transform results in onSuccess** - Keep execute logic pure
5. **Let cancellations flow through** - Don't override INTERRUPTED exit code
6. **Return structured data** - Make success data type-safe and useful

## Type Safety

```typescript
interface DeployResult {
  environment: string;
  status: 'deployed' | 'failed';
  url?: string;
}

run: async (context): Promise<ActionResultEnvelope<DeployResult>> => {
  return SnapRuntime.runActionSafely<DeployResult>({
    context,
    fallbackErrorMessage: 'Deployment failed',
    execute: async () => {
      return {
        environment: 'production',
        status: 'deployed',
        url: 'https://example.com'
      };
    }
  });
}
```
