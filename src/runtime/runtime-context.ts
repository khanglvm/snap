import type { RuntimeMode } from '../core/contracts/action-contract.js';
import type { CliArgs } from '../dx/args/index.js';
import type { FlowController } from '../dx/runtime/index.js';
import type { TerminalOutput } from '../dx/terminal/index.js';
import type { StateMachine } from './state-machine.js';
import type { PromptToolkit } from '../tui/prompt-toolkit.js';

export interface RuntimeContext {
  moduleId: string;
  actionId: string;
  mode: RuntimeMode;
  args: CliArgs;
  flow: FlowController;
  terminal: TerminalOutput;
  prompts: PromptToolkit;
  stateMachine?: StateMachine;
}
