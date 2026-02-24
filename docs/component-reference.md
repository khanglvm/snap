# Component Reference & API Coverage

This document provides a complete reference of all Snap components, including those available through the public API and internal/advanced components.

## Public API Components

### TUI Prompt Components (via `PromptToolkit`)

Accessed through `context.prompts`:

```typescript
interface PromptToolkit {
  text(input: TextPromptInput): Promise<string>;
  confirm(input: ConfirmPromptInput): Promise<boolean>;
  select(input: SelectPromptInput): Promise<string>;
  multiselect(input: MultiSelectPromptInput): Promise<string[]>;
  group<T = unknown>(steps: GroupStep<T>[]): Promise<Record<string, T>>;
  custom<T>(input: CustomPromptInput<T>): Promise<T>;
}
```

#### text

Single-line text input.

```typescript
const name = await context.prompts.text({
  message: 'Enter your name:',
  placeholder: 'John Doe',
  defaultValue: '',
  validate: (value) => {
    if (!value) return 'Name is required';
    return undefined;
  }
});
```

**Options:**
- `message`: Display message (required)
- `placeholder`: Placeholder text
- `defaultValue`: Initial value
- `validate`: Validation function returning error message or undefined

#### confirm

Yes/no confirmation.

```typescript
const confirmed = await context.prompts.confirm({
  message: 'Continue with deployment?'
});
```

**Options:**
- `message`: Display message (required)
- `initialValue`: Default selection (true/false)

#### select

Single-choice selection.

```typescript
const environment = await context.prompts.select({
  message: 'Select environment:',
  options: [
    { value: 'dev', label: 'Development' },
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' }
  ],
  initialValue: 'dev'
});
```

**Options:**
- `message`: Display message (required)
- `options`: Array of {value, label} (required)
- `initialValue`: Default selected value

#### multiselect

Multi-choice selection.

```typescript
const features = await context.prompts.multiselect({
  message: 'Select features:',
  options: [
    { value: 'auth', label: 'Authentication' },
    { value: 'db', label: 'Database' },
    { value: 'cache', label: 'Caching' }
  ],
  required: false
});
```

**Options:**
- `message`: Display message (required)
- `options`: Array of {value, label} (required)
- `required`: Whether at least one selection is required
- `initialValues`: Default selected values

#### group

Run multiple prompts and collect results.

```typescript
const results = await context.prompts.group([
  {
    key: 'name',
    run: async () => await context.prompts.text({ message: 'Name:' })
  },
  {
    key: 'email',
    run: async () => await context.prompts.text({ message: 'Email:' })
  }
]);
// results = { name: '...', email: '...' }
```

**Options:**
- Array of `{ key: string, run: () => Promise<T> }`

#### custom

Custom prompt with validation and parsing.

```typescript
const port = await context.prompts.custom({
  message: 'Enter port number:',
  defaultValue: '3000',
  required: true,
  parse: (raw) => parseInt(raw, 10),
  validate: (value) => {
    if (isNaN(value)) return 'Must be a number';
    if (value < 1 || value > 65535) return 'Must be between 1-65535';
    return undefined;
  }
});
```

**Options:**
- `message`: Display message (required)
- `defaultValue`: Default value
- `required`: Whether value is required
- `parse`: Function to parse string to target type
- `validate`: Validation function returning error message or undefined
- `onValue`: Callback when value changes
- `onSubmit`: Callback when form is submitted
- `onCancel`: Callback when user cancels
- `signal`: AbortSignal for cancellation

## Internal/Advanced Components

These components exist in the codebase but are not directly exported through the main public API. They can be accessed directly if needed.

### Spinner

Located at: `/Users/khang/Documents/repo/snap/src/tui/component-adapters/spinner.ts`

**Usage Pattern:**

```typescript
import { createSpinner } from './src/tui/component-adapters/spinner.js';

const spinner = createSpinner({ message: 'Loading...' });

spinner.start('Starting operation...');
// ... do work
spinner.message('Still working...');
// ... more work
spinner.stop('Complete!');
```

**Interface:**

```typescript
interface Spinner {
  start(message?: string): void;
  stop(message?: string): void;
  message(message: string): void;
}
```

**Note:** Not currently exported through the main Snap API. To use in your module, import directly from the source path or use terminal output for progress messages.

### Password Prompt

Located at: `/Users/khang/Documents/repo/snap/src/tui/component-adapters/password.ts`

**Usage Pattern:**

```typescript
import { runPasswordPrompt } from './src/tui/component-adapters/password.js';

const password = await runPasswordPrompt({
  message: 'Enter password:',
  required: true,
  mask: '•'
});
```

**Interface:**

```typescript
interface PasswordPromptInput {
  message: string;
  required?: boolean;
  validate?: (value: string) => string | Error | undefined;
  mask?: string;
}
```

**Note:** Not currently exported through the main Snap API.

## Gaps and Missing Components

### Loader Component

**Status:** Not available as a distinct TUI component in the public API.

**Workaround:** Use one of these approaches:

1. **Use terminal output with messages:**
   ```typescript
   context.terminal.line('Loading...');
   // ... do work
   context.terminal.line('✓ Complete');
   ```

2. **Import spinner directly (advanced):**
   ```typescript
   import { createSpinner } from './src/tui/component-adapters/spinner.js';

   const spinner = createSpinner();
   spinner.start('Loading...');
   // ... work
   spinner.stop('Done!');
   ```

3. **Use custom prompt for progress:**
   ```typescript
   const progress = await context.prompts.custom({
     message: 'Processing...',
     defaultValue: '0',
     parse: (v) => parseInt(v, 10)
   });
   ```

### Progress Bar

**Status:** Not available.

**Workaround:** Use terminal output:

```typescript
const total = 100;
for (let i = 0; i <= total; i += 10) {
  const bar = '█'.repeat(i / 10) + '░'.repeat(10 - i / 10);
  process.stdout.write(`\r[${bar}] ${i}%`);
  await doWork();
}
process.stdout.write('\n');
```

### Dynamic/Editable List

**Status:** Not available as a built-in component.

**Workaround:** Use multiselect or implement custom prompt:

```typescript
// Use multiselect for selection
const items = await context.prompts.multiselect({
  message: 'Select items to edit:',
  options: existingItems.map(item => ({ value: item.id, label: item.name }))
});

// Then prompt for edits
for (const itemId of items) {
  const newValue = await context.prompts.text({
    message: `Edit ${itemId}:`
  });
  // ... update item
}
```

### Table Display

**Status:** Not available as a TUI component.

**Workaround:** Use terminal output with formatted strings:

```typescript
context.terminal.line('');
context.terminal.line('Name          Email           Role');
context.terminal.line('───────────── ─────────────── ──────');
for (const user of users) {
  context.terminal.line(
    `${user.name.padEnd(13)} ${user.email.padEnd(16)} ${user.role}`
  );
}
```

### Forms with Field Dependencies

**Status:** Not natively supported (conditional display).

**Workaround:** Use flow control:

```typescript
run: async (context) => {
  const useAuth = await context.prompts.confirm({
    message: 'Enable authentication?'
  });

  if (useAuth) {
    const provider = await context.prompts.select({
      message: 'Auth provider:',
      options: [
        { value: 'oauth', label: 'OAuth' },
        { value: 'basic', label: 'Basic Auth' }
      ]
    });
    // ... configure auth
  }

  return { ok: true, /* ... */ };
}
```

## Component Type Reference

### TuiOptionContract

```typescript
interface TuiOptionContract {
  value: string;
  label: string;
}
```

### TuiComponentContract

```typescript
type TuiComponentContract =
  | TextTuiComponent
  | SelectTuiComponent
  | MultiSelectTuiComponent
  | ConfirmTuiComponent
  | TuiCustomComponentContract;
```

### TextTuiComponent

```typescript
interface TextTuiComponent {
  componentId: string;
  type: 'text';
  label: string;
  arg: string;
  required?: boolean;
  initialValue?: string;
  placeholder?: string;
}
```

### SelectTuiComponent

```typescript
interface SelectTuiComponent {
  componentId: string;
  type: 'select';
  label: string;
  arg: string;
  required?: boolean;
  options: TuiOptionContract[];
  initialValue?: string;
}
```

### MultiSelectTuiComponent

```typescript
interface MultiSelectTuiComponent {
  componentId: string;
  type: 'multiselect';
  label: string;
  arg: string;
  required?: boolean;
  options: TuiOptionContract[];
  initialValues?: string[];
}
```

### ConfirmTuiComponent

```typescript
interface ConfirmTuiComponent {
  componentId: string;
  type: 'confirm';
  label: string;
  arg: string;
  required?: boolean;
  initialValue?: boolean;
}
```

### TuiCustomComponentContract

```typescript
interface TuiCustomComponentContract<TConfig = Record<string, unknown>> {
  componentId: string;
  type: 'custom';
  label: string;
  arg: string;
  required?: boolean;
  renderer: string;
  config: TConfig;
}
```

## Recommendations for Missing Components

### For Authors Who Need a Loader

Use terminal output for most cases:

```typescript
context.terminal.line('Processing...');
await performOperation();
context.terminal.line('✓ Complete');
```

This is the most compatible approach across TUI and CLI modes.

### For Password Input

Direct import (note: path may change in future versions):

```typescript
import { runPasswordPrompt } from './src/tui/component-adapters/password.js';

// But be aware this is an internal implementation detail
// Consider submitting a PR to expose it through the public API
```

Alternatively, use text input with masked display (not truly secure but prevents casual shoulder-surfing):

```typescript
const password = await context.prompts.custom({
  message: 'Enter password:',
  required: true
});
```

### Future Enhancements

If you need these components, consider:

1. **Submitting an issue** requesting the feature
2. **Submitting a PR** to add the component to the public API
3. **Using internal imports** with awareness that paths may change

The Snap framework is actively developed and component coverage may expand based on community needs.
