import { aliasFeatureModules, aliasSubmoduleRoutes } from './modules/index.js';

export const aliasApp = {
  modules: aliasFeatureModules,
  submodules: aliasSubmoduleRoutes,
  defaultSubmoduleId: 'claude-profile'
} as const;
