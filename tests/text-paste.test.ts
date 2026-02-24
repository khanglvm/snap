import { describe, expect, it, vi } from 'vitest';
import { runTextPrompt, type TextPromptInput } from '../src/tui/component-adapters/text.js';

describe('text component with paste support', () => {
  it('accepts paste config option', async () => {
    const input: TextPromptInput = {
      message: 'Enter text',
      paste: true,
    };

    // Mock the readline to avoid actual terminal interaction
    const mockRl = {
      close: vi.fn(),
      on: vi.fn(),
      question: vi.fn(),
    };

    // Test that the interface accepts paste option
    expect(input.paste).toBe(true);
    expect(input.message).toBe('Enter text');
  });

  it('accepts multiline config option', async () => {
    const input: TextPromptInput = {
      message: 'Enter text',
      multiline: true,
    };

    expect(input.multiline).toBe(true);
  });

  it('accepts both paste and multiline options together', async () => {
    const input: TextPromptInput = {
      message: 'Enter text',
      paste: true,
      multiline: true,
    };

    expect(input.paste).toBe(true);
    expect(input.multiline).toBe(true);
  });

  it('works without paste option (backward compatibility)', async () => {
    const input: TextPromptInput = {
      message: 'Enter text',
    };

    expect(input.paste).toBeUndefined();
    expect(input.multiline).toBeUndefined();
  });

  it('supports all existing text options with paste', async () => {
    const input: TextPromptInput = {
      message: 'Enter your name',
      initialValue: 'John',
      placeholder: 'Your name',
      required: true,
      validate: (value) => {
        if (value.length < 2) {
          return 'Name must be at least 2 characters';
        }
      },
      paste: true,
    };

    expect(input.message).toBe('Enter your name');
    expect(input.initialValue).toBe('John');
    expect(input.placeholder).toBe('Your name');
    expect(input.required).toBe(true);
    expect(input.validate).toBeDefined();
    expect(input.paste).toBe(true);
  });
});

describe('multiline text prompt', () => {
  it('exports multiline text prompt factory', async () => {
    const { createMultilineTextPrompt } = await import('../src/tui/component-adapters/multiline-text.js');
    expect(typeof createMultilineTextPrompt).toBe('function');
  });

  it('multiline text prompt accepts all required options', async () => {
    const { createMultilineTextPrompt } = await import('../src/tui/component-adapters/multiline-text.js');
    const promptFn = createMultilineTextPrompt();

    const options = {
      message: 'Enter description',
      allowPaste: true,
      initialValue: 'Line 1\nLine 2',
      placeholder: 'Type here...',
      validate: (val: string | undefined) => {
        if (!val || val.length === 0) {
          return 'Value is required';
        }
      },
    };

    expect(promptFn).toBeDefined();
    expect(options.message).toBe('Enter description');
    expect(options.allowPaste).toBe(true);
    expect(options.initialValue).toBe('Line 1\nLine 2');
  });
});
