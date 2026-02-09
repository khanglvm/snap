import type { ActionContract } from './action-contract.js';

export interface ModuleContract {
  moduleId: string;
  description: string;
  actions: ActionContract[];
}
