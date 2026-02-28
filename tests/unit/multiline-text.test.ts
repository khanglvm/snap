import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';

const TIMEOUT = Symbol('timeout');

class MockInput extends EventEmitter {
  isTTY = true;
  readonly setRawMode = vi.fn();
  readonly resume = vi.fn();
}

class MockOutput {
  readonly writes: string[] = [];

  write(chunk: string): boolean {
    this.writes.push(String(chunk));
    return true;
  }
}

interface MockReadline {
  line: string;
  close: ReturnType<typeof vi.fn>;
  on: (event: string, handler: (...args: unknown[]) => void) => MockReadline;
  emit: (event: string, ...args: unknown[]) => void;
  write: ReturnType<typeof vi.fn>;
}

const createMockReadline = (): MockReadline => {
  const handlers = new Map<string, ((...args: unknown[]) => void)[]>();

  const rl: MockReadline = {
    line: '',
    close: vi.fn(),
    on: (event: string, handler: (...args: unknown[]) => void) => {
      const existing = handlers.get(event) || [];
      existing.push(handler);
      handlers.set(event, existing);
      return rl;
    },
    emit: (event: string, ...args: unknown[]) => {
      for (const handler of handlers.get(event) || []) {
        handler(...args);
      }
    },
    write: vi.fn((_: unknown, key?: { ctrl?: boolean; name?: string }) => {
      if (key?.ctrl && key.name === 'u') {
        rl.line = '';
      }
    })
  };

  return rl;
};

const withTimeout = async <T>(promise: Promise<T>, ms = 80): Promise<T | symbol> => {
  return Promise.race([
    promise,
    new Promise<symbol>((resolve) => {
      setTimeout(() => resolve(TIMEOUT), ms);
    })
  ]);
};

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('createMultilineTextPrompt keyboard behavior', () => {
  it('submits with Enter key in raw input mode', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider endpoints',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    rl.line = 'https://example.com/v1';
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await withTimeout(resultPromise);
    expect(result).toBe('https://example.com/v1');
  });

  it('inserts newline with Shift+Enter and submits with Enter', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider models',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    rl.line = 'model-one';
    input.emit('keypress', '\r', { name: 'enter', shift: true });
    rl.line = 'model-two';
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await withTimeout(resultPromise);
    expect(result).toBe('model-one\nmodel-two');
  });

  it('treats Ghostty 13~ sequence as Shift+Enter newline', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider models',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    rl.line = 'model-one';
    input.emit('keypress', '13~', { sequence: '13~' });
    rl.line = 'model-two';
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await withTimeout(resultPromise);
    expect(result).toBe('model-one\nmodel-two');
  });

  it('handles Ghostty 13~ suffix via line event fallback', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider models',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    rl.emit('line', 'model-one13~');
    rl.line = 'model-two';
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await withTimeout(resultPromise);
    expect(result).toBe('model-one\nmodel-two');
  });

  it('handles Ghostty 13~ emitted as plain keypress chars', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider models',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    rl.line = 'model-one1';
    input.emit('keypress', '1', {});
    rl.line = 'model-one13';
    input.emit('keypress', '3', {});
    rl.line = 'model-one13~';
    input.emit('keypress', '~', {});
    rl.line = 'model-two';
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await withTimeout(resultPromise);
    expect(result).toBe('model-one\nmodel-two');
  });

  it('sanitizes residual 13~ token on submit', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider models',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    rl.line = 'model-one13~model-two';
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await withTimeout(resultPromise);
    expect(result).toBe('model-one\nmodel-two');
  });

  it('does not submit on Enter during bracketed multi-line paste', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider models',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    input.emit('data', Buffer.from('\u001b[200~'));
    rl.emit('line', 'model-one');
    rl.emit('line', 'model-two');
    input.emit('keypress', '\r', { name: 'enter' });

    const duringPaste = await withTimeout(resultPromise);
    expect(duringPaste).toBe(TIMEOUT);

    input.emit('data', Buffer.from('\u001b[201~'));
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await resultPromise;
    expect(result).toBe('model-one\nmodel-two');
  });

  it('captures pending second line on Enter submit after multi-line paste', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider endpoints',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    rl.emit('line', 'https://ramclouds.me/');
    rl.line = 'https://ramclouds.me/v1';
    input.emit('keypress', '\r', { name: 'enter' });
    rl.emit('line', 'https://ramclouds.me/v1');

    const result = await resultPromise;
    expect(result).toBe('https://ramclouds.me/\nhttps://ramclouds.me/v1');
  });

  it('does not submit on non-bracketed paste newline Enter before next pasted line arrives', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider endpoints',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    input.emit('data', Buffer.from('https://ramclouds.me/\n'));
    rl.emit('line', 'https://ramclouds.me/');
    input.emit('keypress', '\r', { name: 'enter' });

    const prematureSubmit = await withTimeout(resultPromise);
    expect(prematureSubmit).toBe(TIMEOUT);

    rl.emit('line', 'https://ramclouds.me/v1');
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await resultPromise;
    expect(result).toBe('https://ramclouds.me/\nhttps://ramclouds.me/v1');
  });

  it('recovers full multiline paste when readline submit path only exposes last line', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider endpoints',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    input.emit('data', Buffer.from('https://ramclouds.me/\nhttps://ramclouds.me/v1'));
    rl.line = 'https://ramclouds.me/v1';
    await new Promise((resolve) => setTimeout(resolve, 90));
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await resultPromise;
    expect(result).toBe('https://ramclouds.me/\nhttps://ramclouds.me/v1');
  });

  it('recovers full multiline paste when submit line is concatenated without newline', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider endpoints',
      allowPaste: true,
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    input.emit('data', Buffer.from('https://ai.megallm.io\nhttps://ai.megallm.io/v1'));
    rl.line = 'https://ai.megallm.iohttps://ai.megallm.io/v1';
    await new Promise((resolve) => setTimeout(resolve, 90));
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await resultPromise;
    expect(result).toBe('https://ai.megallm.io\nhttps://ai.megallm.io/v1');
  });

  it('seeds readline line from initial value so edits can backspace one character at a time', async () => {
    const input = new MockInput();
    const output = new MockOutput();
    const rl = createMockReadline();

    vi.doMock('node:readline', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:readline')>();
      return {
        ...actual,
        createInterface: vi.fn(() => rl),
        emitKeypressEvents: vi.fn()
      };
    });

    const { createMultilineTextPrompt } = await import('../../src/tui/component-adapters/multiline-text.js');
    const prompt = createMultilineTextPrompt();

    const resultPromise = prompt({
      message: 'Provider endpoints',
      allowPaste: true,
      initialValue: 'https://ai.megallm.io/v1',
      input: input as unknown as NodeJS.ReadStream,
      output: output as unknown as NodeJS.WriteStream
    });

    expect(rl.line).toBe('https://ai.megallm.io/v1');
    rl.line = 'https://ai.megallm.io/v';
    input.emit('keypress', '\r', { name: 'enter' });

    const result = await resultPromise;
    expect(result).toBe('https://ai.megallm.io/v');
  });
});
