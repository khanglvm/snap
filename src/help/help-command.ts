import { ExitCode } from '../core/errors/framework-errors.js';
import type { ActionResultEnvelope } from '../core/contracts/action-contract.js';
import type { ActionRegistry } from '../core/registry/action-registry.js';
import { resolveHelpHierarchy } from './hierarchy-resolver.js';
import { renderHelp } from './help-renderer.js';

export interface HelpCommandInput {
  registry: ActionRegistry;
  moduleId?: string;
  actionId?: string;
}

export const runHelpCommand = (input: HelpCommandInput): ActionResultEnvelope<string> => {
  const modules = input.registry.listModules();
  const views = resolveHelpHierarchy(modules, input.moduleId, input.actionId);

  if (views.length === 0) {
    return {
      ok: false,
      mode: 'commandline',
      exitCode: ExitCode.VALIDATION_ERROR,
      errorMessage: 'No help target found'
    };
  }

  return {
    ok: true,
    mode: 'commandline',
    exitCode: ExitCode.SUCCESS,
    data: renderHelp(views)
  };
};
