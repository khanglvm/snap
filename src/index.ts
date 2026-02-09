import { ActionRegistry } from './core/registry/action-registry.js';
import type { ModuleContract } from './core/contracts/module-contract.js';

export const createRegistry = (modules: ModuleContract[]): ActionRegistry => {
  const registry = new ActionRegistry();
  for (const moduleContract of modules) {
    registry.registerModule(moduleContract);
  }
  return registry;
};
