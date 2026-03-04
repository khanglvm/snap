import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';

class MockInput extends EventEmitter {
  isTTY = true;
  readonly setRawMode = vi.fn();
  readonly resume = vi.fn();
  readonly off = vi.fn((event: string, listener: (...args: unknown[]) => void) => {
    super.off(event, listener as any);
    return this;
  });
}

class MockOutput {
  isTTY = true;
  readonly writes: string[] = [];

  write(chunk: string): boolean {
    this.writes.push(String(chunk));
    return true;
  }
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('runPasswordPrompt', () => {
  it('throws for required non-interactive prompt', async () => {
    const { runPasswordPrompt } = await import('../../src/tui/component-adapters/password.js');

    await expect(runPasswordPrompt({
      message: 'API key',
      required: true,
      input: { isTTY: false } as any,
      output: { isTTY: false, write: () => true } as any
    })).rejects.toThrow('Password required: API key');
  });

  it('accepts masked input and submits on Enter', async () => {
    const input = new MockInput();
    const output = new MockOutput();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        emitKeypressEvents: vi.fn()
      };
    });

    const { runPasswordPrompt } = await import('../../src/tui/component-adapters/password.js');

    const resultPromise = runPasswordPrompt({
      message: 'API key',
      required: true,
      input: input as any,
      output: output as any,
      mask: '*'
    });

    input.emit('keypress', 'a', { name: 'a' });
    input.emit('keypress', 'b', { name: 'b' });
    input.emit('keypress', 'c', { name: 'c' });
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await resultPromise;
    expect(result).toBe('abc');
    expect(input.setRawMode).toHaveBeenCalledWith(true);
    expect(input.setRawMode).toHaveBeenCalledWith(false);
  });
});
