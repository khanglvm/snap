import type { StateMachine } from '../../runtime/state-machine.js';

export interface FlowController {
  next(): void;
  back(): void;
  jump(stepId: string): void;
  exit(): void;
  currentStepId(): string | undefined;
}

export const createFlowController = (stateMachine?: StateMachine): FlowController => {
  return {
    next(): void {
      stateMachine?.transition({ type: 'next' });
    },
    back(): void {
      stateMachine?.transition({ type: 'back' });
    },
    jump(stepId: string): void {
      stateMachine?.transition({ type: 'jump', targetNodeId: stepId });
    },
    exit(): void {
      stateMachine?.transition({ type: 'exit' });
    },
    currentStepId(): string | undefined {
      return stateMachine?.currentNode().id;
    }
  };
};
