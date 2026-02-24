import { ActionRegistry } from './core/registry/action-registry.js';
import type { ModuleContract } from './core/contracts/module-contract.js';
export { parseCliInput, runMultiModuleCli, runSingleModuleCli } from './cli/cli-runner.js';
export type { SubmoduleRoute } from './cli/cli-runner.js';
export { runSubmoduleCli } from './cli/cli-runner.js';
export * as SnapArgs from './dx/args/index.js';
export * as SnapHelp from './dx/help/index.js';
export * as SnapRuntime from './dx/runtime/index.js';
export * as SnapTerminal from './dx/terminal/index.js';
export * as SnapTui from './dx/tui/index.js';
export { createPromptToolkit } from './tui/prompt-toolkit.js';
export type { PromptToolkit } from './tui/prompt-toolkit.js';
export { runCustomPrompt, createCustomPromptRunner } from './tui/custom/index.js';
export type { CustomPromptInput, CustomPromptRunner } from './tui/custom/index.js';
export { createSpinner, spinner } from './tui/component-adapters/spinner.js';
export type { Spinner, SpinnerOptions } from './tui/component-adapters/spinner.js';
export { runPasswordPrompt } from './tui/component-adapters/password.js';
export type { PasswordPromptInput } from './tui/component-adapters/password.js';
export { createMultilineTextPrompt } from './tui/component-adapters/multiline-text.js';
export type { MultilineTextOptions } from './tui/component-adapters/multiline-text.js';

export const createRegistry = (modules: ModuleContract[]): ActionRegistry => {
  const registry = new ActionRegistry();
  for (const moduleContract of modules) {
    registry.registerModule(moduleContract);
  }
  return registry;
};
