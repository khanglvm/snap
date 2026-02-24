import type { TuiFlowContract } from '../../core/contracts/tui-contract.js';
import { defineTuiStep } from './components.js';

export const defineTuiFlow = <TFlow extends TuiFlowContract>(flow: TFlow): TFlow => {
  if (!flow.steps || flow.steps.length === 0) {
    throw new Error('TUI flow must include at least one step.');
  }

  const steps = flow.steps.map((step) => defineTuiStep(step));

  if (flow.entryStepId && !steps.some((step) => step.stepId === flow.entryStepId)) {
    throw new Error(`TUI flow entry step does not exist: ${flow.entryStepId}`);
  }

  return {
    ...flow,
    steps
  };
};
