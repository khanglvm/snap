/**
 * Snap Framework Examples
 *
 * This file exports all example modules for easy importing and testing.
 */

import basicModule from './basic-module.js';
import advancedFlow from './advanced-flow.js';
import dxHelpers from './dx-helpers.js';
import customPrompt from './custom-prompt.js';
import uiComponents from './ui-components.js';

/**
 * All example modules
 *
 * Usage:
 * ```typescript
 * import { exampleModules } from './examples/index.js';
 * import { createRegistry, runMultiModuleCli } from 'snap-framework';
 *
 * const registry = createRegistry(exampleModules);
 * await runMultiModuleCli({ registry, cliName: 'examples' });
 * ```
 */
export const exampleModules = [
  basicModule,
  advancedFlow,
  dxHelpers,
  customPrompt,
  uiComponents
];

export { basicModule, advancedFlow, dxHelpers, customPrompt, uiComponents };
