import type { ActionContract } from '../contracts/action-contract.js';
import type { ModuleContract } from '../contracts/module-contract.js';
import {
  ExitCode,
  FrameworkError,
  FrameworkErrorCode
} from '../errors/framework-errors.js';

export interface ActionRef {
  moduleId: string;
  action: ActionContract;
}

export class ActionRegistry {
  private readonly modules = new Map<string, ModuleContract>();
  private readonly actions = new Map<string, ActionRef>();

  registerModule(moduleContract: ModuleContract): void {
    if (this.modules.has(moduleContract.moduleId)) {
      throw new FrameworkError(
        FrameworkErrorCode.DUPLICATE_MODULE,
        ExitCode.VALIDATION_ERROR,
        `Duplicate module registration: ${moduleContract.moduleId}`
      );
    }

    this.modules.set(moduleContract.moduleId, moduleContract);

    for (const action of moduleContract.actions) {
      this.assertTriad(moduleContract.moduleId, action);
      const key = this.actionKey(moduleContract.moduleId, action.actionId);
      if (this.actions.has(key)) {
        throw new FrameworkError(
          FrameworkErrorCode.DUPLICATE_ACTION,
          ExitCode.VALIDATION_ERROR,
          `Duplicate action registration: ${key}`
        );
      }
      this.actions.set(key, { moduleId: moduleContract.moduleId, action });
    }
  }

  listModules(): ModuleContract[] {
    return [...this.modules.values()].sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  }

  getModule(moduleId: string): ModuleContract {
    const moduleContract = this.modules.get(moduleId);
    if (!moduleContract) {
      throw new FrameworkError(
        FrameworkErrorCode.MODULE_NOT_FOUND,
        ExitCode.VALIDATION_ERROR,
        `Module not found: ${moduleId}`
      );
    }
    return moduleContract;
  }

  getAction(moduleId: string, actionId: string): ActionContract {
    const key = this.actionKey(moduleId, actionId);
    const actionRef = this.actions.get(key);
    if (!actionRef) {
      throw new FrameworkError(
        FrameworkErrorCode.ACTION_NOT_FOUND,
        ExitCode.VALIDATION_ERROR,
        `Action not found: ${key}`
      );
    }
    return actionRef.action;
  }

  private actionKey(moduleId: string, actionId: string): string {
    return `${moduleId}.${actionId}`;
  }

  private assertTriad(moduleId: string, action: ActionContract): void {
    const hasTui = Array.isArray(action.tui?.steps) && action.tui.steps.length > 0;
    const hasCommandline = Array.isArray(action.commandline?.requiredArgs);
    const hasHelp =
      typeof action.help?.summary === 'string' &&
      Array.isArray(action.help?.args) &&
      Array.isArray(action.help?.examples) &&
      Array.isArray(action.help?.useCases) &&
      Array.isArray(action.help?.keybindings);

    if (!hasTui || !hasCommandline || !hasHelp) {
      throw new FrameworkError(
        FrameworkErrorCode.TRIAD_INCOMPLETE,
        ExitCode.VALIDATION_ERROR,
        `Triad incomplete for action ${moduleId}.${action.actionId}`
      );
    }
  }
}
