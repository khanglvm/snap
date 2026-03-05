import type { ActionContract, ActionResultEnvelope, RuntimeMode } from '../core/contracts/action-contract.js';
import { ExitCode } from '../core/errors/framework-errors.js';
import type { CliArgs } from '../dx/args/index.js';
import { createFlowController } from '../dx/runtime/index.js';
import { createTerminalOutput } from '../dx/terminal/index.js';
import { isPromptCancelledError, isPromptRetryError } from '../tui/component-adapters/cancel.js';
import { createPromptToolkit } from '../tui/prompt-toolkit.js';
import type { RuntimeContext } from './runtime-context.js';
import { ResumeStore } from './resume-store.js';
import { StateMachine, type WorkflowNode } from './state-machine.js';

export interface EngineInput {
  moduleId: string;
  action: ActionContract;
  mode: RuntimeMode;
  args: CliArgs;
  workflowId?: string;
  workflowNodes?: WorkflowNode[];
  resumeStore?: ResumeStore;
}

const resolveWorkflowNodes = (action: ActionContract): WorkflowNode[] => {
  if (action.tui.flow?.steps && action.tui.flow.steps.length > 0) {
    return action.tui.flow.steps.map((step) => ({
      id: step.stepId,
      label: step.title
    }));
  }

  if (action.tui.steps && action.tui.steps.length > 0) {
    return action.tui.steps.map((step) => ({ id: step, label: step }));
  }

  return [{ id: 'default', label: 'default' }];
};

export const executeAction = async (input: EngineInput): Promise<ActionResultEnvelope> => {
  const nodes = input.workflowNodes ?? resolveWorkflowNodes(input.action);
  const workflowId = input.workflowId ?? `${input.moduleId}.${input.action.actionId}`;

  let initialNodeId: string | undefined;
  if (input.resumeStore) {
    const checkpoint = await input.resumeStore.load();
    if (checkpoint?.workflowId === workflowId) {
      initialNodeId = checkpoint.nodeId;
    }
  }
  if (!initialNodeId && input.action.tui.flow?.entryStepId) {
    initialNodeId = input.action.tui.flow.entryStepId;
  }

  const stateMachine = new StateMachine(workflowId, nodes, initialNodeId);
  const context: RuntimeContext = {
    moduleId: input.moduleId,
    actionId: input.action.actionId,
    mode: input.mode,
    args: input.args,
    flow: createFlowController(stateMachine),
    terminal: createTerminalOutput(),
    prompts: createPromptToolkit({
      onPromptResolved: () => {
        if (input.mode !== 'tui') return;
        stateMachine.transition({ type: 'next' });
      },
      onPromptCancelled: () => {
        if (input.mode !== 'tui') return 'cancel';
        if (stateMachine.snapshot().cursor <= 0) return 'cancel';
        stateMachine.transition({ type: 'back' });
        return 'retry';
      }
    }),
    stateMachine
  };

  try {
    while (true) {
      let result;
      try {
        result = await input.action.run(context);
      } catch (error) {
        if (isPromptRetryError(error)) {
          continue;
        }

        if (isPromptCancelledError(error)) {
          if (input.resumeStore) {
            await input.resumeStore.clear();
          }
          return {
            ok: false,
            mode: input.mode,
            exitCode: ExitCode.INTERRUPTED,
            errorMessage: undefined
          };
        }

        throw error;
      }

      if (input.resumeStore) {
        if (stateMachine.snapshot().exited || result.ok) {
          await input.resumeStore.clear();
        } else {
          await input.resumeStore.save(stateMachine.checkpoint());
        }
      }
      return { ...result, mode: input.mode, exitCode: result.exitCode ?? ExitCode.SUCCESS };
    }
  } catch (error) {
    if (input.resumeStore) {
      await input.resumeStore.save(stateMachine.checkpoint());
    }
    return {
      ok: false,
      mode: input.mode,
      exitCode: ExitCode.INTERNAL_ERROR,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
