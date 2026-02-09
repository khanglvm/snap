import { ExitCode, FrameworkError } from '../core/errors/framework-errors.js';
import type { ActionResultEnvelope } from '../core/contracts/action-contract.js';
import type { ActionRegistry } from '../core/registry/action-registry.js';
import { executeAction } from './engine.js';
import { resolveRuntimeMode } from './mode-resolver.js';
import { FileResumeStore } from './resume-store.js';

export interface DispatchInput {
  registry: ActionRegistry;
  moduleId: string;
  actionId: string;
  args: Record<string, string | boolean>;
  isTTY: boolean;
  resumeFilePath?: string;
}

export const dispatchAction = async (input: DispatchInput): Promise<ActionResultEnvelope> => {
  try {
    const action = input.registry.getAction(input.moduleId, input.actionId);
    const mode = resolveRuntimeMode({
      isTTY: input.isTTY,
      providedArgs: input.args,
      commandline: action.commandline
    });

    const missingRequired = action.commandline.requiredArgs.filter(
      (arg) => input.args[arg] === undefined || input.args[arg] === ''
    );

    if (mode === 'commandline' && missingRequired.length > 0) {
      return {
        ok: false,
        mode,
        exitCode: ExitCode.VALIDATION_ERROR,
        errorMessage: `Missing required args: ${missingRequired.join(', ')}`
      };
    }

    const resumeStore = input.resumeFilePath ? new FileResumeStore(input.resumeFilePath) : undefined;

    return executeAction({
      moduleId: input.moduleId,
      action,
      mode,
      args: input.args,
      resumeStore
    });
  } catch (error) {
    if (error instanceof FrameworkError) {
      return {
        ok: false,
        mode: 'commandline',
        exitCode: error.exitCode,
        errorMessage: error.message
      };
    }
    return {
      ok: false,
      mode: 'commandline',
      exitCode: ExitCode.INTERNAL_ERROR,
      errorMessage: error instanceof Error ? error.message : 'Unknown dispatch error'
    };
  }
};
