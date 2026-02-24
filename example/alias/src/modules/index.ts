import type { ModuleContract, SubmoduleRoute } from '../snap.js';
import claudeProfileModule from './claude-profile/module.js';
import shellReloadModule from './shell-reload/module.js';
import stealthPnpmModule from './stealth-pnpm/module.js';

export const aliasFeatureModules: ModuleContract[] = [
  claudeProfileModule,
  shellReloadModule,
  stealthPnpmModule
];

const toDefaultAction = (moduleContract: ModuleContract): string =>
  moduleContract.actions[0]?.actionId ?? moduleContract.moduleId;

export const aliasSubmoduleRoutes: SubmoduleRoute[] = aliasFeatureModules.map((moduleContract) => ({
  moduleId: moduleContract.moduleId,
  defaultActionId: toDefaultAction(moduleContract),
  helpDefaultTarget: 'action'
}));
