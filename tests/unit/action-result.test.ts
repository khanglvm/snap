import { describe, expect, it } from 'vitest';
import { toErrorResult } from '../../src/dx/runtime/action-result.js';
import { ExitCode } from '../../src/core/errors/framework-errors.js';
import { PromptCancelledError } from '../../src/tui/component-adapters/cancel.js';
import type { RuntimeContext } from '../../src/runtime/runtime-context.js';

const createContext = (): RuntimeContext =>
  ({
    moduleId: 'test',
    actionId: 'example',
    mode: 'tui',
    args: {},
    flow: {
      next: () => undefined,
      back: () => undefined,
      jump: () => undefined,
      exit: () => undefined,
      currentStepId: () => undefined
    },
    terminal: {
      line: () => undefined,
      lines: () => undefined,
      error: () => undefined
    },
    prompts: {
      text: async () => '',
      confirm: async () => true,
      select: async () => 'ok',
      multiselect: async () => [],
      group: async () => ({}),
      custom: async () => 'ok'
    }
  }) as RuntimeContext;

describe('action-result', () => {
  it('maps prompt cancellation to interrupted exit code', () => {
    const context = createContext();
    const result = toErrorResult(context, new PromptCancelledError(), 'fallback');

    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(ExitCode.INTERRUPTED);
    expect(result.errorMessage).toBeUndefined();
  });

  it('keeps validation error code for regular errors', () => {
    const context = createContext();
    const result = toErrorResult(context, new Error('boom'), 'fallback');

    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(ExitCode.VALIDATION_ERROR);
    expect(result.errorMessage).toBe('boom');
  });
});
