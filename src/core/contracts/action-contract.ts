import type { HelpContract } from './help-contract.js';
import type { RuntimeContext } from '../../runtime/runtime-context.js';

export type RuntimeMode = 'tui' | 'commandline';

export interface CommandlineContract {
  requiredArgs: string[];
  optionalArgs?: string[];
}

export interface TuiContract {
  steps: string[];
}

export interface ActionResultEnvelope<T = unknown> {
  ok: boolean;
  mode: RuntimeMode;
  exitCode: number;
  data?: T;
  errorMessage?: string;
}

export interface ActionContract {
  actionId: string;
  description: string;
  tui: TuiContract;
  commandline: CommandlineContract;
  help: HelpContract;
  run: (context: RuntimeContext) => Promise<ActionResultEnvelope>;
}
