# SnapHelp - Schema-Driven Help Generation

`SnapHelp` provides helpers for defining argument schemas once and automatically generating both commandline contracts and help documentation.

## Import

```typescript
import * as SnapHelp from 'snap-framework';
```

## Core Concepts

### Define Once, Use Everywhere

Define your argument schema once, and SnapHelp generates:

1. **Commandline contract** - `requiredArgs` and `optionalArgs`
2. **Help specification** - Formatted help arguments
3. **Full help contract** - Complete help metadata

## API Reference

### `defineArgSchema(schema)`

Defines a typed argument schema map.

```typescript
const schema = SnapHelp.defineArgSchema({
  name: {
    description: 'User name',
    required: true,
    example: '--name=Alice'
  },
  verbose: {
    description: 'Enable verbose output',
    required: false,
    example: '--verbose'
  }
});
```

**Schema Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `description` | `string` | **required** | Human-readable description |
| `required` | `boolean` | `false` | Whether the argument is required |
| `example` | `string` | `undefined` | Example usage string |
| `includeInCommandline` | `boolean` | `true` | Include in commandline contract |
| `includeInHelp` | `boolean` | `true` | Include in help output |
| `helpName` | `string` | *(key name)* | Override display name in help |

### `commandlineFromArgSchema(schema)`

Generates a `CommandlineContract` from an arg schema.

```typescript
const commandline = SnapHelp.commandlineFromArgSchema(schema);
// Returns: { requiredArgs: string[], optionalArgs: string[] }
```

**Usage Example:**

```typescript
const DEPLOY_ARG_SCHEMA = SnapHelp.defineArgSchema({
  environment: {
    description: 'Target deployment environment',
    required: true,
    example: '--environment=production'
  },
  region: {
    description: 'AWS region',
    required: false,
    example: '--region=us-east-1'
  }
});

const deployAction: ActionContract = {
  // ...
  commandline: SnapHelp.commandlineFromArgSchema(DEPLOY_ARG_SCHEMA),
  // ...
};
```

### `helpArgsFromArgSchema(schema)`

Generates help argument specs from an arg schema.

```typescript
const helpArgs = SnapHelp.helpArgsFromArgSchema(schema);
// Returns: HelpArgumentSpec[]
```

**Usage Example:**

```typescript
const helpArgs = SnapHelp.helpArgsFromArgSchema(DEPLOY_ARG_SCHEMA);
// Returns:
// [
//   { name: 'environment', required: true, description: '...', example: '...' },
//   { name: 'region', required: false, description: '...', example: '...' }
// ]
```

### `buildHelpFromArgSchema(input)`

Generates a complete `HelpContract` from an arg schema.

```typescript
const help = SnapHelp.buildHelpFromArgSchema({
  summary: 'Deploy application to environment',
  argSchema: DEPLOY_ARG_SCHEMA,
  examples: ['mytool deploy --environment=production'],
  useCases: [
    {
      name: 'production',
      description: 'Deploy to production',
      command: 'mytool deploy --environment=production'
    }
  ],
  keybindings: ['Enter confirm', 'Esc cancel']
});
```

**Input Options:**

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `summary` | `string` | Yes | Short action description |
| `argSchema` | `ArgSchemaMap` | Yes | Argument definition schema |
| `examples` | `string[]` | No | Command examples |
| `useCases` | `HelpUseCaseSpec[]` | No | Detailed use cases |
| `keybindings` | `string[]` | No | Key bindings (defaults to Enter/Esc) |

## Complete Example

Here's a complete module using `SnapHelp` helpers:

```typescript
import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';
import * as SnapHelp from 'snap-framework';

// Define argument schema once
const DEPLOY_ARG_SCHEMA = SnapHelp.defineArgSchema({
  environment: {
    description: 'Target deployment environment',
    required: true,
    example: '--environment=production'
  },
  region: {
    description: 'AWS region for deployment',
    required: false,
    example: '--region=us-east-1'
  },
  'skip-tests': {
    description: 'Skip pre-deployment tests',
    required: false,
    example: '--skip-tests',
    helpName: 'skip-tests'
  },
  rollback: {
    description: 'Enable automatic rollback on failure',
    required: false,
    example: '--rollback=true'
  }
});

// Generate help from schema
const DEPLOY_HELP = SnapHelp.buildHelpFromArgSchema({
  summary: 'Deploy application to the specified environment with optional configuration.',
  argSchema: DEPLOY_ARG_SCHEMA,
  examples: [
    'mytool deploy start --environment=production',
    'mytool deploy start --environment=staging --region=us-west-2',
    'mytool deploy start --environment=production --skip-tests --rollback=true'
  ],
  useCases: [
    {
      name: 'production',
      description: 'Standard production deployment',
      command: 'mytool deploy start --environment=production'
    },
    {
      name: 'staging-with-region',
      description: 'Deploy to staging in specific region',
      command: 'mytool deploy start --environment=staging --region=us-west-2'
    },
    {
      name: 'fast-deploy',
      description: 'Quick deployment skipping tests',
      command: 'mytool deploy start --environment=production --skip-tests'
    }
  ]
});

const deployModule: ModuleContract = {
  moduleId: 'deploy',
  description: 'Deployment management',
  actions: [
    {
      actionId: 'start',
      description: 'Start a deployment',
      tui: {
        steps: ['collect-environment', 'collect-options', 'confirm']
      },
      // Generate commandline from schema
      commandline: SnapHelp.commandlineFromArgSchema(DEPLOY_ARG_SCHEMA),
      // Use pre-built help
      help: DEPLOY_HELP,
      run: async (context) => {
        const { environment, region, skipTests, rollback } = context.args;

        context.terminal.line(`Deploying to ${environment}...`);

        if (region) {
          context.terminal.line(`Region: ${region}`);
        }

        if (skipTests) {
          context.terminal.line('Skipping pre-deployment tests');
        }

        if (rollback) {
          context.terminal.line('Automatic rollback enabled');
        }

        // Deployment logic here...

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

## Advanced Patterns

### Schema Composition

Combine schemas for reusability:

```typescript
const COMMON_ARGS = SnapHelp.defineArgSchema({
  verbose: {
    description: 'Enable verbose logging',
    required: false,
    example: '--verbose'
  },
  'dry-run': {
    description: 'Show what would be done without making changes',
    required: false,
    example: '--dry-run',
    helpName: 'dry-run'
  }
});

const DEPLOY_SPECIFIC_ARGS = SnapHelp.defineArgSchema({
  environment: {
    description: 'Target environment',
    required: true,
    example: '--environment=production'
  }
});

// Combine for action help
const DEPLOY_HELP = SnapHelp.buildHelpFromArgSchema({
  summary: 'Deploy to environment',
  argSchema: { ...COMMON_ARGS, ...DEPLOY_SPECIFIC_ARGS },
  examples: ['mytool deploy --environment=production --verbose']
});
```

### Conditional Schema Inclusion

Use `includeInCommandline` or `includeInHelp` to control where arguments appear:

```typescript
const SCHEMA = SnapHelp.defineArgSchema({
  // Appears in both commandline and help
  name: {
    description: 'Resource name',
    required: true
  },

  // Only in help (e.g., for documentation)
  'api-key': {
    description: 'API key for authentication',
    required: false,
    includeInCommandline: false  // Not part of commandline contract
  },

  // Only in commandline (e.g., internal flag)
  _internal: {
    description: 'Internal flag',
    required: false,
    includeInHelp: false  // Not shown in help
  }
});
```

### Custom Help Names

Use `helpName` to override the display name in help:

```typescript
const SCHEMA = SnapHelp.defineArgSchema({
  'skip-tests': {
    description: 'Skip pre-deployment tests',
    required: false,
    helpName: 'skip-tests'  // Use kebab-case in help
  }
});
```

## Migration Pattern

Migrate existing actions to use SnapHelp:

**Before:**

```typescript
{
  commandline: {
    requiredArgs: ['environment', 'region'],
    optionalArgs: ['verbose', 'force']
  },
  help: {
    summary: 'Deploy to environment',
    args: [
      { name: 'environment', required: true, description: '...' },
      { name: 'region', required: true, description: '...' },
      // ... more args
    ]
  }
}
```

**After:**

```typescript
const SCHEMA = SnapHelp.defineArgSchema({
  environment: { description: '...', required: true },
  region: { description: '...', required: true },
  verbose: { description: '...', required: false },
  force: { description: '...', required: false }
});

{
  commandline: SnapHelp.commandlineFromArgSchema(SCHEMA),
  help: SnapHelp.buildHelpFromArgSchema({
    summary: 'Deploy to environment',
    argSchema: SCHEMA
  })
}
```

## Best Practices

1. **Define schemas at module level** - Share schemas across actions
2. **Use descriptive examples** - Help users understand expected values
3. **Provide use cases** - Show real-world usage patterns
4. **Consistent naming** - Use kebab-case for argument names
5. **Document all flags** - Even boolean flags need descriptions
6. **Use helpName** - When the arg key differs from display name
