import { describe, expect, it } from 'vitest';
import { createPromptToolkit, type PromptToolkit } from '../src/tui/prompt-toolkit.js';

describe('PromptToolkit Interface - Component Gap Analysis', () => {
  it('has text prompt', () => {
    const toolkit = createPromptToolkit();
    expect(typeof toolkit.text).toBe('function');
  });

  it('has confirm prompt', () => {
    const toolkit = createPromptToolkit();
    expect(typeof toolkit.confirm).toBe('function');
  });

  it('has select prompt', () => {
    const toolkit = createPromptToolkit();
    expect(typeof toolkit.select).toBe('function');
  });

  it('has multiselect prompt', () => {
    const toolkit = createPromptToolkit();
    expect(typeof toolkit.multiselect).toBe('function');
  });

  it('has group prompt', () => {
    const toolkit = createPromptToolkit();
    expect(typeof toolkit.group).toBe('function');
  });

  it('has custom prompt', () => {
    const toolkit = createPromptToolkit();
    expect(typeof toolkit.custom).toBe('function');
  });

  it('does NOT have spinner in PromptToolkit', () => {
    const toolkit = createPromptToolkit();
    expect(toolkit).not.toHaveProperty('spinner');
  });

  it('does NOT have password in PromptToolkit', () => {
    const toolkit = createPromptToolkit();
    expect(toolkit).not.toHaveProperty('password');
  });

  it('does NOT have log in PromptToolkit', () => {
    const toolkit = createPromptToolkit();
    expect(toolkit).not.toHaveProperty('log');
  });

  it('does NOT have intro in PromptToolkit', () => {
    const toolkit = createPromptToolkit();
    expect(toolkit).not.toHaveProperty('intro');
  });

  it('does NOT have outro in PromptToolkit', () => {
    const toolkit = createPromptToolkit();
    expect(toolkit).not.toHaveProperty('outro');
  });
});

describe('Component Adapters - What Exists vs What is Exposed', () => {
  it('spinner adapter exists but is not in PromptToolkit', async () => {
    const { createSpinner } = await import('../src/tui/component-adapters/spinner.js');
    const spinner = createSpinner({ message: 'Test' });
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.message).toBe('function');
  });

  it('password adapter exists but is not in PromptToolkit', async () => {
    const { runPasswordPrompt } = await import('../src/tui/component-adapters/password.js');
    expect(typeof runPasswordPrompt).toBe('function');
  });
});

describe('Component Gap Summary', () => {
  it('documents available components in PromptToolkit', () => {
    const toolkit = createPromptToolkit();
    const availableMethods = Object.keys(toolkit);

    // These ARE available via context.prompts
    expect(availableMethods).toEqual(
      expect.arrayContaining(['text', 'confirm', 'select', 'multiselect', 'group', 'custom'])
    );
  });

  it('documents missing components from @clack/prompts', () => {
    const toolkit = createPromptToolkit();
    const availableMethods = Object.keys(toolkit);

    // These are NOT available via context.prompts but exist in @clack/prompts
    const missingComponents = ['spinner', 'password', 'log', 'intro', 'outro'];

    for (const component of missingComponents) {
      expect(availableMethods).not.toContain(component);
    }
  });
});
