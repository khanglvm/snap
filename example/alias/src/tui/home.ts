import { isCancel, select } from '@clack/prompts';
import type { ModuleContract } from '../snap.js';

export interface AliasHomeSelection {
  moduleId: string;
  argv: string[];
}

export interface RunAliasHomeTuiInput {
  modules: ModuleContract[];
}

const toModuleOptions = (modules: ModuleContract[]) =>
  modules.map((moduleContract) => ({
    value: moduleContract.moduleId,
    label: moduleContract.moduleId,
    hint: moduleContract.description
  }));

const resolveDefaultActionArgv = (moduleContract: ModuleContract): string[] => {
  const defaultActionId = moduleContract.actions[0]?.actionId;
  if (!defaultActionId || defaultActionId === moduleContract.moduleId) {
    return [moduleContract.moduleId];
  }
  return [moduleContract.moduleId, defaultActionId];
};

export const runAliasHomeTui = async (
  input: RunAliasHomeTuiInput
): Promise<AliasHomeSelection | undefined> => {
  if (input.modules.length === 0) {
    return undefined;
  }

  const selectedModuleId = await select<string>({
    message: 'Choose a module',
    options: toModuleOptions(input.modules)
  });

  if (isCancel(selectedModuleId)) {
    return undefined;
  }

  const selectedModule = input.modules.find((moduleContract) => moduleContract.moduleId === selectedModuleId);
  if (!selectedModule) {
    return undefined;
  }
  return {
    moduleId: selectedModule.moduleId,
    argv: resolveDefaultActionArgv(selectedModule)
  };
};
