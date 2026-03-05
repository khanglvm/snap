import { describe, expect, it } from 'vitest';
import type { ActionContract } from '../../src/core/contracts/action-contract.js';
import { ExitCode } from '../../src/core/errors/framework-errors.js';
import { executeAction } from '../../src/runtime/engine.js';
import {
  PromptCancelledError,
  PromptRetryError
} from '../../src/tui/component-adapters/cancel.js';

const help = {
  summary: 'test',
  args: [],
  examples: [],
  useCases: [],
  keybindings: []
};

const baseAction = {
  actionId: 'test',
  description: 'test action',
  tui: { steps: ['root', 'child'] },
  commandline: { requiredArgs: [] },
  help
};

describe('engine prompt navigation', () => {
  it('retries action when prompt layer asks for retry', async () => {
    let attempts = 0;
    const action: ActionContract = {
      ...baseAction,
      run: async (context) => {
        attempts += 1;
        if (attempts === 1) {
          throw new PromptRetryError();
        }
        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: `attempt-${attempts}`
        };
      }
    };

    const result = await executeAction({
      moduleId: 'm',
      action,
      mode: 'tui',
      args: {}
    });

    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(ExitCode.SUCCESS);
    expect(result.data).toBe('attempt-2');
    expect(attempts).toBe(2);
  });

  it('maps prompt cancellation to interrupted exit code', async () => {
    const action: ActionContract = {
      ...baseAction,
      run: async () => {
        throw new PromptCancelledError();
      }
    };

    const result = await executeAction({
      moduleId: 'm',
      action,
      mode: 'tui',
      args: {}
    });

    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(ExitCode.INTERRUPTED);
    expect(result.errorMessage).toBeUndefined();
  });
});
