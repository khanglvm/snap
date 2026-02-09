import { ExitCode } from '../core/errors/framework-errors.js';
import type { ActionContract, ActionResultEnvelope, RuntimeMode } from '../core/contracts/action-contract.js';
import type { RuntimeContext } from './runtime-context.js';
import { ResumeStore } from './resume-store.js';
import { StateMachine, type WorkflowNode } from './state-machine.js';

export interface EngineInput {
  moduleId: string;
  action: ActionContract;
  mode: RuntimeMode;
  args: Record<string, string | boolean>;
  workflowId?: string;
  workflowNodes?: WorkflowNode[];
  resumeStore?: ResumeStore;
}

export const executeAction = async (input: EngineInput): Promise<ActionResultEnvelope> => {
  const nodes = input.workflowNodes ?? input.action.tui.steps.map((step) => ({ id: step, label: step }));
  const workflowId = input.workflowId ?? `${input.moduleId}.${input.action.actionId}`;

  let initialNodeId: string | undefined;
  if (input.resumeStore) {
    const checkpoint = await input.resumeStore.load();
    if (checkpoint?.workflowId === workflowId) {
      initialNodeId = checkpoint.nodeId;
    }
  }

  const stateMachine = new StateMachine(workflowId, nodes, initialNodeId);
  const context: RuntimeContext = {
    moduleId: input.moduleId,
    actionId: input.action.actionId,
    mode: input.mode,
    args: input.args,
    stateMachine
  };

  try {
    const result = await input.action.run(context);
    if (input.resumeStore) {
      if (stateMachine.snapshot().exited || result.ok) {
        await input.resumeStore.clear();
      } else {
        await input.resumeStore.save(stateMachine.checkpoint());
      }
    }
    return { ...result, mode: input.mode, exitCode: result.exitCode ?? ExitCode.SUCCESS };
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
