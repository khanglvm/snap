import { describe, expect, it } from 'vitest';
import type { ModuleContract } from '../../src/core/contracts/module-contract.js';
import { createRegistry } from '../../src/index.js';
import { ExitCode } from '../../src/core/errors/framework-errors.js';
import { dispatchAction } from '../../src/runtime/dispatch.js';

const flowModule: ModuleContract = {
  moduleId: 'flow',
  description: 'Flow-contract module',
  actions: [
    {
      actionId: 'entry',
      description: 'Use flow entry step as workflow cursor.',
      tui: {
        flow: {
          entryStepId: 'operation',
          steps: [
            {
              stepId: 'operation',
              title: 'Operation'
            },
            {
              stepId: 'confirm',
              title: 'Confirm'
            }
          ]
        }
      },
      commandline: { requiredArgs: ['op'] },
      help: {
        summary: 'Test flow-based TUI contract wiring.',
        args: [{ name: 'op', required: true, description: 'Operation id' }],
        examples: ['snap flow entry --op=list'],
        useCases: [{ name: 'flow', description: 'Flow smoke test', command: 'snap flow entry --op=list' }],
        keybindings: ['Enter confirm']
      },
      run: async (context) => ({
        ok: true,
        mode: context.mode,
        exitCode: ExitCode.SUCCESS,
        data: context.stateMachine?.currentNode().id
      })
    }
  ]
};

describe('integration tui flow contract', () => {
  it('accepts flow-only TUI contracts and starts from entry step', async () => {
    const registry = createRegistry([flowModule]);

    const result = await dispatchAction({
      registry,
      moduleId: 'flow',
      actionId: 'entry',
      args: {},
      isTTY: true
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('tui');
    expect(result.data).toBe('operation');
  });
});
