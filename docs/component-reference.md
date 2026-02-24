# Component Reference & API Coverage

This document provides a complete reference of all Snap components available through the public API.

## Basic Prompt Components (via `PromptToolkit`)

Accessed through `context.prompts` in your action handlers:

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

### text
Single-line text input with validation.

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

### confirm
Yes/no confirmation prompt.

```typescript
const confirmed = await context.prompts.confirm({
  message: 'Continue with deployment?'
});
```

### select
Single-choice selection from options.

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

### multiselect
Multi-choice selection from options.

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

### group
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

### custom
Custom prompt with validation and parsing to different types.

```typescript
const port = await context.prompts.custom<number>({
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

## Advanced UI Components (via SnapTui)

Import these from `snap-framework` or access via `SnapTui` namespace:

### Spinner (createSpinner/spinner)

**Loader component for async operations.**

```typescript
import { createSpinner } from 'snap-framework';
// or
const spinner = SnapTui.createSpinner();

spinner.start('Loading...');
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

### Password Prompt (runPasswordPrompt)

**Secure text input for sensitive data.**

```typescript
import { runPasswordPrompt } from 'snap-framework';

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

### Progress (createProgress/progress)

**Progress indicator for quantified operations.**

```typescript
const progress = SnapTui.createProgress();

progress.start('Processing files...');
progress.message('File 1 of 10...');
progress.message('File 2 of 10...');
progress.stop('✓ All files processed');
```

**Interface:**
```typescript
interface Progress {
  start(message: string): void;
  message(message: string): void;
  stop(message?: string): void;
}
```

### Tasks (tasks)

**Sequential async operations with visual feedback.**

```typescript
const results = await SnapTui.tasks([
  {
    title: 'Install dependencies',
    task: async (msg) => {
      msg('Installing packages...');
      await installPackages();
      return 'Dependencies installed';
    }
  },
  {
    title: 'Run tests',
    task: async (msg) => {
      msg('Running test suite...');
      await runTests();
      return 'All tests passed';
    }
  },
  {
    title: 'Build',
    task: async (msg) => {
      msg('Compiling...');
      await build();
      return 'Build complete';
    }
  }
]);
```

**Interface:**
```typescript
interface Task {
  title: string;
  task: (message: (msg: string) => void) => Promise<string>;
}

interface TasksOptions {
  onCancel?: (results: Record<string, string>) => void;
}
```

### Note (note)

**Decorative message box for important information.**

```typescript
SnapTui.note({
  message: 'This operation may take several minutes.\nPlease do not close your terminal.',
  title: 'INFO'
});

// With custom formatting
SnapTui.note({
  message: 'You can use --help to see all options.',
  title: 'TIP',
  format: (line) => `💡 ${line}`
});
```

**Interface:**
```typescript
interface NoteInput {
  message: string;
  title?: string;
  format?: (line: string) => string;
}
```

### Autocomplete (runAutocompletePrompt)

**Searchable selection for large option lists.**

```typescript
const selected = await SnapTui.runAutocompletePrompt({
  message: 'Select a package:',
  options: [
    { value: 'react', label: 'React', hint: 'A JavaScript library for UIs' },
    { value: 'vue', label: 'Vue.js', hint: 'Progressive framework' },
    { value: 'svelte', label: 'Svelte', hint: 'Cybernetically enhanced web apps' }
  ],
  placeholder: 'Search packages...',
  maxItems: 5,
  required: true
});
```

**Interface:**
```typescript
interface AutocompleteOption {
  value: string;
  label: string;
  hint?: string;
}

interface AutocompleteInput {
  message: string;
  options: AutocompleteOption[];
  placeholder?: string;
  initialValue?: string;
  maxItems?: number;
  required?: boolean;
  validate?: (value: string) => string | Error | undefined;
}
```

## Terminal Utilities (via SnapTerminal)

### Intro/Outro

**Consistent welcome and closing messages.**

```typescript
import * as SnapTerminal from 'snap-framework';

SnapTerminal.intro('Welcome to My Tool');
SnapTerminal.outro('Thank you for using My Tool');
```

### Log

**Structured logging with different levels.**

```typescript
SnapTerminal.log.info('Processing started...');
SnapTerminal.log.success('Operation completed!');
SnapTerminal.log.warn('Configuration file not found, using defaults');
SnapTerminal.log.error('Failed to connect to service');
```

## Terminal Output (via context.terminal)

Basic terminal output available in all actions:

```typescript
context.terminal.line('Single line of output');
context.terminal.lines(['Line 1', 'Line 2', 'Line 3']);
context.terminal.error('Error message');
```

## Component Import Summary

| Component | Import From | Also Available Via |
|-----------|-------------|-------------------|
| text, confirm, select, multiselect, group, custom | `createPromptToolkit()` | `context.prompts` |
| createSpinner, spinner | `'snap-framework'` | `SnapTui.createSpinner` |
| runPasswordPrompt | `'snap-framework'` | Direct import only |
| createProgress, progress | - | `SnapTui.createProgress` |
| tasks | - | `SnapTui.tasks` |
| note | - | `SnapTui.note` |
| runAutocompletePrompt | - | `SnapTui.runAutocompletePrompt` |
| intro, outro | - | `SnapTerminal.intro`, `SnapTerminal.outro` |
| log | - | `SnapTerminal.log` |

## Example: Using Multiple Components

```typescript
import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';
import { createSpinner, runPasswordPrompt } from 'snap-framework';
import * as SnapTui from 'snap-framework';
import * as SnapTerminal from 'snap-framework';

const myModule: ModuleContract = {
  moduleId: 'my',
  description: 'My module',
  actions: [{
    actionId: 'action',
    description: 'My action',
    tui: { steps: ['step1'] },
    commandline: { requiredArgs: [] },
    help: { summary: 'My action' },
    run: async (context) => {
      // Intro
      SnapTerminal.intro('Starting operation');

      // Note
      SnapTui.note({
        message: 'This will take a few moments.',
        title: 'INFO'
      });

      // Spinner
      const spinner = createSpinner();
      spinner.start('Processing...');
      await doWork();
      spinner.stop('✓ Complete');

      // Autocomplete
      const selection = await SnapTui.runAutocompletePrompt({
        message: 'Choose an option:',
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' }
        ]
      });

      // Tasks
      const results = await SnapTui.tasks([
        {
          title: 'Task 1',
          task: async () => 'Done'
        }
      ]);

      // Log
      SnapTerminal.log.success('All operations complete');

      // Outro
      SnapTerminal.outro('Finished!');

      return {
        ok: true,
        mode: context.mode,
        exitCode: ExitCode.SUCCESS,
        data: { selection, results }
      };
    }
  }]
};
```

## Not Available (Use Alternatives)

### Progress Bar
Snap uses spinner-style progress indicators rather than percentage-based progress bars. Use `createSpinner` or `createProgress` for visual feedback.

### Table Display
Use terminal output with formatted strings:

```typescript
context.terminal.line('Name          Email           Role');
context.terminal.line('───────────── ─────────────── ──────');
for (const user of users) {
  context.terminal.line(
    `${user.name.padEnd(13)} ${user.email.padEnd(16)} ${user.role}`
  );
}
```

### Forms with Field Dependencies
Use conditional flow control in your action:

```typescript
run: async (context) => {
  const useFeature = await context.prompts.confirm({
    message: 'Enable this feature?'
  });

  if (useFeature) {
    const option = await context.prompts.select({
      message: 'Choose configuration:',
      options: [/* ... */]
    });
    // ... configure feature
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

### AutocompleteOption
```typescript
interface AutocompleteOption {
  value: string;
  label: string;
  hint?: string;
}
```

### TuiComponentContract (Flow Definitions)
```typescript
type TuiComponentContract =
  | TextTuiComponent      // type: 'text'
  | SelectTuiComponent    // type: 'select'
  | MultiSelectTuiComponent  // type: 'multiselect'
  | ConfirmTuiComponent   // type: 'confirm'
  | TuiCustomComponentContract;  // type: 'custom'
```
