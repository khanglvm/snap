import type { ModuleContract } from '../../snap.js';
import { shellReloadAction } from '../../actions/shell-reload/action.js';

const shellReloadModule: ModuleContract = {
  moduleId: 'shell-reload',
  description: 'Install shell reload alias (rl/src/reload/custom).',
  actions: [shellReloadAction]
};

export default shellReloadModule;
