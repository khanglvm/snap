import type { ActionContract } from '../core/contracts/action-contract.js';
import type { ModuleContract } from '../core/contracts/module-contract.js';
import type { ActionHelpView } from './help-model.js';

export const resolveHelpHierarchy = (
  modules: ModuleContract[],
  moduleId?: string,
  actionId?: string
): ActionHelpView[] => {
  const scopedModules = moduleId ? modules.filter((m) => m.moduleId === moduleId) : modules;

  return scopedModules.flatMap((moduleContract) => {
    if (!actionId) {
      return [
        {
          moduleId: moduleContract.moduleId,
          sections: [
            {
              title: 'MODULE',
              lines: [moduleContract.description]
            },
            {
              title: 'ACTIONS',
              lines: moduleContract.actions.map((action) => `${action.actionId} - ${action.description}`)
            }
          ]
        }
      ];
    }

    const action = moduleContract.actions.find((item) => item.actionId === actionId);
    if (!action) return [];

    return [toActionHelp(moduleContract.moduleId, action)];
  });
};

const toActionHelp = (moduleId: string, action: ActionContract): ActionHelpView => ({
  moduleId,
  actionId: action.actionId,
  sections: [
    { title: 'SUMMARY', lines: [action.help.summary] },
    {
      title: 'ARGS',
      lines: action.help.args.map((arg) => `${arg.required ? '*' : '-'} ${arg.name}: ${arg.description}`)
    },
    { title: 'EXAMPLES', lines: action.help.examples },
    {
      title: 'USE-CASES',
      lines: action.help.useCases.map((useCase) => `${useCase.name}: ${useCase.command}`)
    },
    { title: 'KEYBINDINGS', lines: action.help.keybindings }
  ]
});
