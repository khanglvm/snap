import type { RuntimeMode } from '../core/contracts/action-contract.js';
import type { StateMachine } from './state-machine.js';

export interface RuntimeContext {
  moduleId: string;
  actionId: string;
  mode: RuntimeMode;
  args: Record<string, string | boolean>;
  stateMachine?: StateMachine;
}
