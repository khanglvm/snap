import { installPnpmAliases } from '../../pnpm-alias-service.js';
import { SnapHelp, SnapRuntime, SnapTui, type ActionContract } from '../../snap.js';
import { renderOperationOutput } from '../common.js';
import { collectStealthPnpmInstallTuiInput, parseStealthPnpmInstallCliInput } from './input.js';
import { STEALTH_PNPM_ARG_SCHEMA, STEALTH_PNPM_HELP } from './meta.js';

const executeStealthPnpmInstall = async (input: {
  overwrite: boolean;
  confirm: (message: string) => Promise<boolean>;
}): Promise<{ summary: string; details: string[] }> => {
  let result = await installPnpmAliases({ overwrite: input.overwrite });

  if (result.conflict && !input.overwrite) {
    const confirmed = await input.confirm('pnpm aliases already exist. Override?');
    if (!confirmed) {
      throw new Error('Cancelled by user.');
    }

    result = await installPnpmAliases({ overwrite: true });
  }

  if (!result.ok) {
    throw new Error(result.errorMessage ?? 'Failed to install stealth pnpm aliases.');
  }

  return {
    summary: result.summary ?? 'Installed stealth pnpm aliases.',
    details: result.details ?? []
  };
};

export const stealthPnpmAction: ActionContract = {
  actionId: 'stealth-pnpm',
  description: 'Install stealth pnpm aliases (di, da, dr).',
  tui: {
    steps: ['operation', 'confirm', 'review'],
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
              options: [{ value: 'install', label: 'Install di/da/dr aliases' }]
            }
          ]
        },
        {
          stepId: 'confirm',
          title: 'Confirm install',
          components: [
            {
              componentId: 'overwrite',
              type: 'confirm',
              label: 'Overwrite existing aliases',
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
  commandline: SnapHelp.commandlineFromArgSchema(STEALTH_PNPM_ARG_SCHEMA),
  help: STEALTH_PNPM_HELP,
  run: async (context) => {
    return SnapRuntime.runActionSafely({
      context,
      fallbackErrorMessage: 'Unknown stealth-pnpm error',
      execute: async () => {
        const input =
          context.mode === 'tui'
            ? await collectStealthPnpmInstallTuiInput(context)
            : parseStealthPnpmInstallCliInput(context.args);

        const result = await executeStealthPnpmInstall({
          overwrite: input.overwrite,
          confirm: (message) => context.prompts.confirm({ message, initialValue: false })
        });

        return renderOperationOutput(result.summary, result.details);
      }
    });
  }
};
