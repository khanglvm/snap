import { SnapHelp, SnapRuntime, SnapTui, type ActionContract } from '../../snap.js';
import { executeClaudeProfileOperation } from '../../claude-profile/index.js';
import { renderOperationOutput } from '../common.js';
import { parseClaudeProfileCliInput, collectClaudeProfileTuiInput } from './input.js';
import { CLAUDE_PROFILE_ARG_SCHEMA, CLAUDE_PROFILE_HELP } from './meta.js';

export const claudeProfileAction: ActionContract = {
  actionId: 'claude-profile',
  description: 'Manage Claude Code profile aliases and shell sync.',
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
              options: [
                { value: 'list', label: 'List profiles' },
                { value: 'show', label: 'Show profile' },
                { value: 'upsert', label: 'Create/update profile' },
                { value: 'rename', label: 'Rename profile' },
                { value: 'remove', label: 'Remove profile' },
                { value: 'sync', label: 'Sync profile(s)' }
              ]
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
              componentId: 'to',
              type: 'text',
              label: 'Rename target',
              arg: 'to'
            },
            {
              componentId: 'env',
              type: 'text',
              label: 'Env mappings',
              arg: 'env'
            },
            {
              componentId: 'skip-permissions',
              type: 'confirm',
              label: 'Enable dangerous skip permissions',
              arg: 'skip-permissions'
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
  commandline: SnapHelp.commandlineFromArgSchema(CLAUDE_PROFILE_ARG_SCHEMA),
  help: CLAUDE_PROFILE_HELP,
  run: async (context) => {
    return SnapRuntime.runActionSafely({
      context,
      fallbackErrorMessage: 'Unknown alias error',
      execute: async () => {
        const operationInput =
          context.mode === 'tui'
            ? await collectClaudeProfileTuiInput(context)
            : parseClaudeProfileCliInput(context.args);

        const result = await executeClaudeProfileOperation(operationInput);
        return renderOperationOutput(result.summary, result.details);
      }
    });
  }
};
