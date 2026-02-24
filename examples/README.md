# Snap Framework Examples

This directory contains practical examples demonstrating various features of the Snap framework.

## Examples Overview

### basic-module.ts
The simplest possible Snap module showing:
- Minimal module structure
- TUI flow with step array
- Commandline argument definition
- Help documentation
- Basic action handler

**Run:**
```bash
npm run dev -- basic greet --name=Alice
```

### advanced-flow.ts
Demonstrates structured TUI flows with:
- `SnapTui.defineTuiFlow` for type-safe flow definitions
- Multi-step workflows
- Multiple component types (text, select, multiselect, confirm)
- Complex argument handling

**Run:**
```bash
npm run dev -- advanced create-user
```

### dx-helpers.ts
Shows all DX helper groups:
- `SnapArgs` - Type-safe argument reading
- `SnapHelp` - Schema-driven help generation
- `SnapRuntime` - Standardized action results with error handling
- `SnapTerminal` - Terminal output utilities
- `SnapTui` - Typed TUI component definitions

**Run:**
```bash
npm run dev -- deploy start
```

### custom-prompt.ts
Advanced prompt patterns:
- Custom prompts with validation
- Parsing to different types (numbers, JSON)
- Error messages and constraints

**Run:**
```bash
npm run dev -- custom configure
```

### ui-components.ts
Advanced UI components:
- **createSpinner/spinner** - Async operation loader
- **runPasswordPrompt** - Secure password input
- **SnapTui.tasks** - Sequential async operations
- **SnapTui.note** - Decorative message boxes
- **SnapTui.runAutocompletePrompt** - Searchable selections
- **SnapTerminal.intro/outro/log** - Structured output

**Run:**
```bash
npm run dev -- ui spinner-example
npm run dev -- ui password-example
npm run dev -- ui tasks-example
npm run dev -- ui autocomplete-example
npm run dev -- ui note-example
npm run dev -- ui full-example
```

## Running Examples

1. Build the project:
```bash
npm run build
```

2. Run any example:
```bash
# Interactive mode (TUI)
npm run dev -- <module> <action>

# CLI mode with arguments
npm run dev -- <module> <action> --arg=value

# Help
npm run dev -- -h
npm run dev -- <module> -h
npm run dev -- <module> <action> -h
```

## Examples Command Reference

### Basic Module
```bash
# Greet with default output
npm run dev -- basic greet --name=Alice

# Greet with loud option
npm run dev -- basic greet --name="Bob" --loud=true
```

### Advanced Flow
```bash
# Interactive user creation
npm run dev -- advanced create-user

# CLI with all arguments
npm run dev -- advanced create-user \
  --name="Jane Doe" \
  --email=jane@example.com \
  --roles=admin,editor \
  --sendWelcome=true
```

### DX Helpers (Deploy)
```bash
# Interactive deployment
npm run dev -- deploy start

# CLI deployment
npm run dev -- deploy start --environment=production --region=us-east-1

# Dry run
npm run dev -- deploy start --environment=staging --dry-run=true
```

### Custom Prompt
```bash
# Configure with validation
npm run dev -- custom configure

# With port specified
npm run dev -- custom configure --port=8080

# JSON input
npm run dev -- custom json-input --json='{"key":"value"}'
```

### UI Components
```bash
# Spinner example (loader for async operations)
npm run dev -- ui spinner-example --environment=production

# Password example (secure input)
npm run dev -- ui password-example --username=admin

# Tasks example (sequential operations)
npm run dev -- ui tasks-example

# Autocomplete example (searchable selection)
npm run dev -- ui autocomplete-example

# Note example (decorative boxes)
npm run dev -- ui note-example

# Full example (all components together)
npm run dev -- ui full-example --name=Alice
```

## Learning Path

1. **Start with `basic-module.ts`** - Understand the core contract structure
2. **Review `advanced-flow.ts`** - Learn structured flows and multi-step workflows
3. **Study `dx-helpers.ts`** - See how to use all DX helper groups effectively
4. **Explore `custom-prompt.ts`** - Advanced patterns for validation and parsing
5. **Dive into `ui-components.ts`** - Learn spinner, password, tasks, autocomplete, and more

## Key Patterns Demonstrated

### 1. Schema-Driven Development
```typescript
const SCHEMA = SnapHelp.defineArgSchema({
  name: { description: '...', required: true }
});

// Generate commandline and help from schema
commandline: SnapHelp.commandlineFromArgSchema(SCHEMA),
help: SnapHelp.buildHelpFromArgSchema({ summary: '...', argSchema: SCHEMA })
```

### 2. Safe Action Execution
```typescript
run: async (context) => {
  return SnapRuntime.runActionSafely({
    context,
    fallbackErrorMessage: 'Operation failed',
    execute: async () => {
      // Your logic here
      return result;
    }
  });
}
```

### 3. Type-Safe Arguments
```typescript
const port = SnapArgs.readRequiredStringArg(context.args, 'port');
const verbose = SnapArgs.readBooleanArg(context.args, 'verbose') ?? false;
```

### 4. Structured TUI Flows
```typescript
tui: {
  flow: SnapTui.defineTuiFlow({
    entryStepId: 'start',
    steps: [
      SnapTui.defineTuiStep({
        stepId: 'start',
        title: 'Start',
        components: [
          SnapTui.defineTuiComponent({
            componentId: 'field',
            type: 'text',
            label: 'Field',
            arg: 'field',
            required: true
          })
        ]
      })
    ]
  })
}
```

## Adapting Examples

To create your own module:

1. Copy the example that best matches your use case
2. Rename the module ID and actions
3. Modify the TUI flow, commandline args, and help
4. Implement your action logic in the `run` function
5. Register your module in the CLI entry point

## Testing Examples

Each example is designed to be testable:

```typescript
import { createRegistry } from 'snap-framework';
import { exampleModules } from './examples/index.js';

const registry = createRegistry(exampleModules);

// Test dispatch
const result = await registry.dispatch({
  moduleId: 'basic',
  actionId: 'greet',
  args: { name: 'Test' }
});

console.log(result);
```
