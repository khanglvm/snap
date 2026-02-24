# SnapTerminal - Terminal Output Helpers

`SnapTerminal` provides a simple, testable interface for writing to the terminal.

## Import

```typescript
import * as SnapTerminal from 'snap-framework';
```

## API Reference

### `createTerminalOutput(stdout?, stderr?)`

Creates a terminal output interface with write methods.

```typescript
const terminal = SnapTerminal.createTerminalOutput();
// Or with custom streams:
const customTerminal = SnapTerminal.createTerminalOutput(customStdout, customStderr);
```

**Default:** Uses `process.stdout` and `process.stderr`

### TerminalOutput Interface

```typescript
interface TerminalOutput {
  line(message: string): void;
  lines(messages: readonly string[]): void;
  error(message: string): void;
}
```

#### `line(message)`

Writes a single line to stdout.

```typescript
terminal.line('Hello, world!');
// Output: Hello, world!
```

#### `lines(messages)`

Writes multiple lines to stdout.

```typescript
terminal.lines([
  'Line 1',
  'Line 2',
  'Line 3'
]);
// Output:
// Line 1
// Line 2
// Line 3
```

#### `error(message)`

Writes an error message to stderr.

```typescript
terminal.error('Something went wrong!');
// Output (stderr): Something went wrong!
```

## Usage in Actions

The `RuntimeContext` includes a `terminal` property:

```typescript
run: async (context) => {
  // Access terminal via context
  context.terminal.line('Starting operation...');
  context.terminal.lines(['Progress:', '  - Step 1 complete', '  - Step 2 complete']);

  // Errors
  context.terminal.error('Operation failed!');

  return { ok: true, mode: context.mode, exitCode: ExitCode.SUCCESS, data: {} };
}
```

## Complete Examples

### Basic Output

```typescript
import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';

const echoModule: ModuleContract = {
  moduleId: 'echo',
  description: 'Echo messages',
  actions: [
    {
      actionId: 'say',
      description: 'Echo a message',
      tui: { steps: ['collect-message'] },
      commandline: { requiredArgs: ['message'] },
      help: {
        summary: 'Echo a message to the terminal.',
        args: [{ name: 'message', required: true, description: 'Message to echo' }]
      },
      run: async (context) => {
        const message = String(context.args.message ?? '');

        // Output the message
        context.terminal.line(message);

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: { echoed: message }
        };
      }
    }
  ]
};
```

### Progress Updates

```typescript
const deployModule: ModuleContract = {
  moduleId: 'deploy',
  description: 'Deploy with progress',
  actions: [
    {
      actionId: 'start',
      description: 'Start deployment',
      tui: { steps: ['collect-input'] },
      commandline: { requiredArgs: ['environment'] },
      help: {
        summary: 'Deploy to environment with progress updates.',
        args: [{ name: 'environment', required: true, description: 'Target env' }]
      },
      run: async (context) => {
        const environment = String(context.args.environment ?? '');

        context.terminal.line(`Deploying to ${environment}...`);
        context.terminal.line('');

        // Simulate deployment steps
        const steps = [
          'Building application...',
          'Running tests...',
          'Uploading assets...',
          'Running migrations...',
          'Starting services...'
        ];

        for (const step of steps) {
          context.terminal.line(`  ✓ ${step}`);
          // Simulate work
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        context.terminal.line('');
        context.terminal.line('Deployment complete!');

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: { environment, status: 'deployed' }
        };
      }
    }
  ]
};
```

### Error Reporting

```typescript
const validationModule: ModuleContract = {
  moduleId: 'validate',
  description: 'Configuration validation',
  actions: [
    {
      actionId: 'check',
      description: 'Validate configuration',
      tui: { steps: ['collect-config'] },
      commandline: { requiredArgs: ['config'] },
      help: {
        summary: 'Validate configuration file.',
        args: [{ name: 'config', required: true, description: 'Config file path' }]
      },
      run: async (context) => {
        const configPath = String(context.args.config ?? '');

        context.terminal.line(`Validating ${configPath}...`);

        try {
          const config = await loadConfig(configPath);
          const errors = validateConfig(config);

          if (errors.length > 0) {
            context.terminal.error('Configuration validation failed:');
            context.terminal.lines(errors.map(e => `  ✗ ${e}`));

            return {
              ok: false,
              mode: context.mode,
              exitCode: ExitCode.VALIDATION_ERROR,
              errorMessage: errors.join('; ')
            };
          }

          context.terminal.line('Configuration is valid!');
          context.terminal.lines([
            `  Environment: ${config.environment}`,
            `  Region: ${config.region}`,
            `  Log level: ${config.logLevel}`
          ]);

          return {
            ok: true,
            mode: context.mode,
            exitCode: ExitCode.SUCCESS,
            data: { valid: true, config }
          };
        } catch (error) {
          context.terminal.error(`Failed to load config: ${error}`);

          return {
            ok: false,
            mode: context.mode,
            exitCode: ExitCode.RUNTIME_ERROR,
            errorMessage: 'Failed to load configuration'
          };
        }
      }
    }
  ]
};
```

### Table Output

```typescript
const listModule: ModuleContract = {
  moduleId: 'list',
  description: 'List resources',
  actions: [
    {
      actionId: 'users',
      description: 'List all users',
      tui: { steps: [] },
      commandline: { requiredArgs: [] },
      help: {
        summary: 'List all users in the system.'
      },
      run: async (context) => {
        const users = await fetchUsers();

        context.terminal.line('Users:');
        context.terminal.line('');

        if (users.length === 0) {
          context.terminal.line('  No users found.');
        } else {
          // Simple table formatting
          const maxNameLength = Math.max(...users.map(u => u.name.length));
          const maxEmailLength = Math.max(...users.map(u => u.email.length));

          context.terminal.line(
            `  ${'Name'.padEnd(maxNameLength)}  ${'Email'.padEnd(maxEmailLength)}  Role`
          );
          context.terminal.line(
            `  ${'─'.repeat(maxNameLength)}  ${'─'.repeat(maxEmailLength)}  ──────`
          );

          for (const user of users) {
            context.terminal.line(
              `  ${user.name.padEnd(maxNameLength)}  ${user.email.padEnd(maxEmailLength)}  ${user.role}`
            );
          }

          context.terminal.line('');
          context.terminal.line(`  Total: ${users.length} user(s)`);
        }

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: { count: users.length, users }
        };
      }
    }
  ]
};
```

## Testing with Terminal Output

`createTerminalOutput` accepts custom Writable streams for testing:

```typescript
import { PassThrough } from 'node:stream';
import * as SnapTerminal from 'snap-framework';

describe('my action', () => {
  it('should output messages', async () => {
    // Create in-memory streams
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const outputChunks: string[] = [];

    stdout.on('data', (chunk) => outputChunks.push(chunk.toString()));

    const terminal = SnapTerminal.createTerminalOutput(stdout, stderr);

    // Use in your action or test
    terminal.line('Hello, world!');
    terminal.error('Error!');

    // Verify output
    expect(outputChunks).toContain('Hello, world!\n');
  });
});
```

## Mocking for Unit Tests

Simple mock for tests:

```typescript
const mockTerminal = {
  line: vi.fn(),
  lines: vi.fn(),
  error: vi.fn()
};

// Use in test
const context = {
  // ... other properties
  terminal: mockTerminal
};

await action.run(context);

expect(mockTerminal.line).toHaveBeenCalledWith('Starting...');
expect(mockTerminal.error).not.toHaveBeenCalled();
```

## Best Practices

1. **Use line() for single messages** - Most common case
2. **Use lines() for bulk output** - More efficient than multiple line() calls
3. **Use error() for errors only** - Goes to stderr, not stdout
4. **Add blank lines for readability** - `context.terminal.line('')` for spacing
5. **Keep output structured** - Use consistent formatting
6. **Consider non-TTY environments** - Avoid complex ANSI codes without detection
7. **Test output separately** - Use custom streams in tests

## Output Patterns

### Status Messages

```typescript
context.terminal.line('✓ Operation completed');
context.terminal.line('✗ Operation failed');
context.terminal.line('→ Processing...');
```

### Section Headers

```typescript
context.terminal.line('');
context.terminal.line('=== Deployment Summary ===');
context.terminal.line('');
```

### Key-Value Pairs

```typescript
context.terminal.line(`Environment: ${env}`);
context.terminal.line(`Region: ${region}`);
context.terminal.line(`Status: ${status}`);
```

### Lists

```typescript
context.terminal.line('Changes:');
context.terminal.lines([
  '  - Added user authentication',
  '  - Updated dependencies',
  '  - Fixed login bug'
]);
```

## Integration with Context

The `RuntimeContext` always has a `terminal` property:

```typescript
interface RuntimeContext {
  terminal: TerminalOutput;
  // ... other properties
}
```

No need to create your own in actions - just use `context.terminal`.
