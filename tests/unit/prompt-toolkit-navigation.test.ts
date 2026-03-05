import { describe, expect, it, vi } from 'vitest';
import { createPromptToolkit } from '../../src/tui/prompt-toolkit.js';
import {
  PromptCancelledError,
  PromptRetryError
} from '../../src/tui/component-adapters/cancel.js';

describe('prompt-toolkit navigation lifecycle', () => {
  it('runs onPromptResolved after prompt success', async () => {
    const onPromptResolved = vi.fn();
    const toolkit = createPromptToolkit({
      onPromptResolved,
      adapters: {
        text: async () => 'hello'
      }
    });

    const value = await toolkit.text({ message: 'Message' });

    expect(value).toBe('hello');
    expect(onPromptResolved).toHaveBeenCalledTimes(1);
  });

  it('throws PromptRetryError when cancellation callback requests retry', async () => {
    const onPromptCancelled = vi.fn().mockResolvedValue('retry');
    const toolkit = createPromptToolkit({
      onPromptCancelled,
      adapters: {
        select: async () => {
          throw new PromptCancelledError();
        }
      }
    });

    await expect(
      toolkit.select({
        message: 'Select',
        options: [{ value: 'one', label: 'One' }]
      })
    ).rejects.toBeInstanceOf(PromptRetryError);
    expect(onPromptCancelled).toHaveBeenCalledTimes(1);
  });
});
