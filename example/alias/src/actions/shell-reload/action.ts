import { installReloadAlias } from '../../reload-alias-service.js';
import { SnapHelp, SnapRuntime, SnapTui, type ActionContract } from '../../snap.js';
import { renderOperationOutput } from '../common.js';
import { collectShellReloadInstallTuiInput, parseShellReloadInstallCliInput } from './input.js';
import { SHELL_RELOAD_ARG_SCHEMA, SHELL_RELOAD_HELP } from './meta.js';

const executeReloadInstall = async (input: {
  aliasName: string;
  overwrite: boolean;
  confirm: (message: string) => Promise<boolean>;
}): Promise<{ summary: string; details: string[] }> => {
  let result = await installReloadAlias({
    aliasName: input.aliasName,
    overwrite: input.overwrite
  });

  if (result.conflict && !input.overwrite) {
    const confirmed = await input.confirm(`Alias "${input.aliasName}" already exists. Override?`);
    if (!confirmed) {
      throw new Error('Cancelled by user.');
    }

    result = await installReloadAlias({
      aliasName: input.aliasName,
      overwrite: true
    });
  }

  if (!result.ok) {
    throw new Error(result.errorMessage ?? 'Failed to install shell reload alias.');
  }

  return {
    summary: result.summary ?? 'Installed shell reload alias.',
    details: result.details ?? []
  };
};

export const shellReloadAction: ActionContract = {
  actionId: 'shell-reload',
  description: 'Install shell reload alias (rl/src/reload/custom).',
  tui: {
    steps: ['operation', 'collect-input', 'review'],
    flow: SnapTui.defineTuiFlow({
      entryStepId: 'operation',
      steps: [
        {
          stepId: 'operation',
          title: 'Choose operation',
          components: [
            {
              componentId: 'op',
              type: 'select',
              label: 'Operation',
              arg: 'op',
              required: true,
              options: [{ value: 'install', label: 'Install shell reload alias' }]
            }
          ]
        },
        {
          stepId: 'collect-input',
          title: 'Collect inputs',
          components: [
            {
              componentId: 'name',
              type: 'text',
              label: 'Alias name',
              arg: 'name'
            },
            {
              componentId: 'overwrite',
              type: 'confirm',
              label: 'Overwrite existing alias',
              arg: 'overwrite'
            }
          ]
        },
        {
          stepId: 'review',
          title: 'Apply operation'
        }
      ]
    })
  },
  commandline: SnapHelp.commandlineFromArgSchema(SHELL_RELOAD_ARG_SCHEMA),
  help: SHELL_RELOAD_HELP,
  run: async (context) => {
    return SnapRuntime.runActionSafely({
      context,
      fallbackErrorMessage: 'Unknown shell-reload error',
      execute: async () => {
        const input =
          context.mode === 'tui'
            ? await collectShellReloadInstallTuiInput(context)
            : parseShellReloadInstallCliInput(context.args);

        const result = await executeReloadInstall({
          aliasName: input.aliasName,
          overwrite: input.overwrite,
          confirm: (message) => context.prompts.confirm({ message, initialValue: false })
        });

        return renderOperationOutput(result.summary, result.details);
      }
    });
  }
};
