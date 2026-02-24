import type { CommandlineContract, RuntimeMode } from '../core/contracts/action-contract.js';
import type { CliArgs } from '../dx/args/index.js';

export interface RuntimeResolutionInput {
  isTTY: boolean;
  providedArgs: CliArgs;
  commandline: CommandlineContract;
}

export const hasRequiredArgs = (
  requiredArgs: string[],
  providedArgs: CliArgs
): boolean => requiredArgs.every((arg) => providedArgs[arg] !== undefined && providedArgs[arg] !== '');

export const resolveRuntimeMode = (input: RuntimeResolutionInput): RuntimeMode => {
  if (!input.isTTY) return 'commandline';
  if (hasRequiredArgs(input.commandline.requiredArgs, input.providedArgs)) return 'commandline';
  return 'tui';
};
