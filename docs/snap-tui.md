# SnapTui - Typed TUI Flow Definitions

`SnapTui` provides type-safe helpers for defining structured TUI flows with validation and custom component support.

## Import

```typescript
import * as SnapTui from 'snap-framework';
```

## Core Concepts

### Structured vs. Legacy Flows

Snap supports two TUI definition styles:

1. **Legacy**: Simple string array of step IDs
   ```typescript
   tui: { steps: ['step1', 'step2'] }
   ```

2. **Structured**: Full component definitions with validation
   ```typescript
   tui: {
     flow: SnapTui.defineTuiFlow({
       entryStepId: 'step1',
       steps: [/* ... */]
     })
   }
   ```

### Component Types

SnapTui supports these component types:

- **text**: Single-line text input
- **select**: Single-choice selection
- **multiselect**: Multi-choice selection
- **confirm**: Boolean yes/no confirmation
- **custom**: Custom renderer (for advanced use cases)

## API Reference

### `defineTuiFlow(flow)`

Defines a validated TUI flow structure.

```typescript
const flow = SnapTui.defineTuiFlow({
  entryStepId: 'start',
  steps: [
    {
      stepId: 'start',
      title: 'Start Step',
      components: [/* ... */]
    }
  ]
});
```

**Validation:**
- At least one step required
- `entryStepId` must reference an existing step
- All components are validated

### `defineTuiStep(step)`

Defines a validated TUI step.

```typescript
const step = SnapTui.defineTuiStep({
  stepId: 'collect-name',
  title: 'Enter your name',
  components: [
    {
      componentId: 'name',
      type: 'text',
      label: 'Name',
      arg: 'name',
      required: true
    }
  ]
});
```

### `defineTuiComponent(component)`

Defines a validated TUI component.

```typescript
const component = SnapTui.defineTuiComponent({
  componentId: 'operation',
  type: 'select',
  label: 'Choose operation',
  arg: 'op',
  required: true,
  options: [
    { value: 'create', label: 'Create new' },
    { value: 'update', label: 'Update existing' }
  ]
});
```

**Component Options:**

| Field | Type | Description |
|-------|------|-------------|
| `componentId` | `string` | Unique identifier for the component |
| `type` | `'text'\|'select'\|'multiselect'\|'confirm'\|'custom'` | Component type |
| `label` | `string` | Display label for the prompt |
| `arg` | `string` | Argument key to store value in |
| `required` | `boolean` | Whether input is required |
| `options` | `TuiOption[]` | Options for select/multiselect |
| `initialValue` | `string` | Default value for text input |
| `placeholder` | `string` | Placeholder text |

### `defineTuiOptions(options)`

Defines validated select/multiselect options.

```typescript
const options = SnapTui.defineTuiOptions([
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' }
]);
```

### `defineCustomTuiComponent(component)`

Defines a custom TUI component with a renderer.

```typescript
const customComponent = SnapTui.defineCustomTuiComponent({
  componentId: 'searchable-select',
  label: 'Search and select',
  arg: 'target',
  renderer: 'searchable-select',
  config: {
    maxItems: 8,
    allowCustomValue: true
  }
});
```

## Complete Examples

### Basic Text Input

```typescript
import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';
import * as SnapTui from 'snap-framework';

const greeterModule: ModuleContract = {
  moduleId: 'greet',
  description: 'Greeting module',
  actions: [
    {
      actionId: 'hello',
      description: 'Say hello',
      tui: {
        flow: SnapTui.defineTuiFlow({
          entryStepId: 'collect-name',
          steps: [
            SnapTui.defineTuiStep({
              stepId: 'collect-name',
              title: 'Enter your name',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'name',
                  type: 'text',
                  label: 'Your name',
                  arg: 'name',
                  required: true,
                  placeholder: 'Enter your name here...'
                })
              ]
            })
          ]
        })
      },
      commandline: { requiredArgs: ['name'] },
      help: {
        summary: 'Say hello to someone.',
        args: [{ name: 'name', required: true, description: 'Name to greet' }]
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
```

### Select Component

```typescript
const deployModule: ModuleContract = {
  moduleId: 'deploy',
  description: 'Deployment module',
  actions: [
    {
      actionId: 'start',
      description: 'Start deployment',
      tui: {
        flow: SnapTui.defineTuiFlow({
          entryStepId: 'select-environment',
          steps: [
            SnapTui.defineTuiStep({
              stepId: 'select-environment',
              title: 'Select Environment',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'env',
                  type: 'select',
                  label: 'Environment',
                  arg: 'environment',
                  required: true,
                  options: SnapTui.defineTuiOptions([
                    { value: 'development', label: 'Development (Local)' },
                    { value: 'staging', label: 'Staging (Pre-production)' },
                    { value: 'production', label: 'Production (Live)' }
                  ])
                })
              ]
            })
          ]
        })
      },
      commandline: { requiredArgs: ['environment'] },
      help: {
        summary: 'Deploy to environment.',
        args: [{ name: 'environment', required: true, description: 'Target env' }]
      },
      run: async (context) => {
        const environment = String(context.args.environment ?? '');
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
```

### Multi-Step Flow with Multiple Components

```typescript
const userModule: ModuleContract = {
  moduleId: 'user',
  description: 'User management',
  actions: [
    {
      actionId: 'create',
      description: 'Create a new user',
      tui: {
        flow: SnapTui.defineTuiFlow({
          entryStepId: 'collect-basic',
          steps: [
            {
              stepId: 'collect-basic',
              title: 'Basic Information',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'name',
                  type: 'text',
                  label: 'Full name',
                  arg: 'name',
                  required: true
                }),
                SnapTui.defineTuiComponent({
                  componentId: 'email',
                  type: 'text',
                  label: 'Email address',
                  arg: 'email',
                  required: true
                })
              ]
            },
            {
              stepId: 'collect-roles',
              title: 'Assign Roles',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'roles',
                  type: 'multiselect',
                  label: 'User roles',
                  arg: 'roles',
                  required: true,
                  options: SnapTui.defineTuiOptions([
                    { value: 'admin', label: 'Administrator' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'viewer', label: 'Viewer' }
                  ])
                })
              ]
            },
            {
              stepId: 'confirm',
              title: 'Confirm Creation',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'confirmed',
                  type: 'confirm',
                  label: 'Create this user?',
                  arg: 'confirmed',
                  required: true
                })
              ]
            }
          ]
        })
      },
      commandline: {
        requiredArgs: ['name', 'email'],
        optionalArgs: ['roles']
      },
      help: {
        summary: 'Create a new user account.',
        args: [
          { name: 'name', required: true, description: 'User full name' },
          { name: 'email', required: true, description: 'User email' },
          { name: 'roles', required: false, description: 'Comma-separated roles' }
        ]
      },
      run: async (context) => {
        const name = String(context.args.name ?? '');
        const email = String(context.args.email ?? '');
        const rolesArg = context.args.roles;

        let roles: string[] = ['viewer'];
        if (Array.isArray(rolesArg)) {
          roles = rolesArg as string[];
        } else if (typeof rolesArg === 'string') {
          roles = rolesArg.split(',');
        }

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: { name, email, roles }
        };
      }
    }
  ]
};
```

### Custom Component

```typescript
const advancedModule: ModuleContract = {
  moduleId: 'advanced',
  description: 'Advanced operations',
  actions: [
    {
      actionId: 'select-resource',
      description: 'Select from resources',
      tui: {
        flow: SnapTui.defineTuiFlow({
          entryStepId: 'search',
          steps: [
            {
              stepId: 'search',
              title: 'Select Resource',
              components: [
                SnapTui.defineCustomTuiComponent({
                  componentId: 'resource',
                  label: 'Search resources',
                  arg: 'resource',
                  renderer: 'searchable-select',
                  config: {
                    maxItems: 10,
                    allowCustomValue: false,
                    searchPlaceholder: 'Type to search...'
                  }
                })
              ]
            }
          ]
        })
      },
      commandline: { requiredArgs: ['resource'] },
      help: {
        summary: 'Select a resource.',
        args: [{ name: 'resource', required: true, description: 'Resource ID or name' }]
      },
      run: async (context) => {
        const resource = String(context.args.resource ?? '');
        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: { resource }
        };
      }
    }
  ]
};
```

## Advanced Patterns

### Conditional Step Display

Use flow control to skip steps:

```typescript
run: async (context) => {
  const skipConfig = SnapArgs.readBooleanArg(context.args, 'skip-config');

  if (skipConfig) {
    context.flow.jump('confirm');
  } else {
    context.flow.next();
  }

  // ... rest of logic
}
```

### Dynamic Options

Options can be computed at runtime:

```typescript
const getEnvironmentOptions = async (): Promise<TuiOptionContract[]> => {
  const envs = await fetchEnvironments();
  return envs.map(env => ({
    value: env.name,
    label: `${env.name} (${env.region})`
  }));
};

// Use in flow
flow: SnapTui.defineTuiFlow({
  entryStepId: 'select-env',
  steps: [
    {
      stepId: 'select-env',
      title: 'Select Environment',
      components: [
        {
          componentId: 'env',
          type: 'select',
          label: 'Environment',
          arg: 'environment',
          required: true,
          options: await getEnvironmentOptions()
        }
      ]
    }
  ]
})
```

### Type Safety

Define interfaces for your data:

```typescript
interface CreateUserInput {
  name: string;
  email: string;
  roles: string[];
  confirmed: boolean;
}

run: async (context): Promise<ActionResultEnvelope<CreateUserInput>> => {
  // TypeScript knows the shape
  return {
    ok: true,
    mode: context.mode,
    exitCode: ExitCode.SUCCESS,
    data: {
      name: String(context.args.name),
      email: String(context.args.email),
      roles: context.args.roles as string[],
      confirmed: Boolean(context.args.confirmed)
    }
  };
}
```

## Best Practices

1. **Use structured flows** - Better validation and IDE support
2. **Group related inputs** - One step per logical grouping
3. **Provide clear labels** - Help users understand each field
4. **Use confirm for destructive actions** - Always confirm deletes, etc.
5. **Set reasonable defaults** - Reduce user typing with `initialValue`
6. **Validate arg names** - Match component `arg` to action's expected args
7. **Keep steps focused** - One logical operation per step

## Component Validation

SnapTui validates at definition time:

```typescript
// Throws: componentId cannot be empty
SnapTui.defineTuiComponent({
  componentId: '',
  type: 'text',
  label: 'Label',
  arg: 'x'
});

// Throws: options required for select
SnapTui.defineTuiComponent({
  componentId: 'x',
  type: 'select',
  label: 'Label',
  arg: 'x',
  options: []  // Empty!
});

// Throws: empty options array
SnapTui.defineTuiOptions([]);
```
