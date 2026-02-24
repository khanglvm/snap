import type { ModuleContract } from '../../snap.js';
import { stealthPnpmAction } from '../../actions/stealth-pnpm/action.js';

const stealthPnpmModule: ModuleContract = {
  moduleId: 'stealth-pnpm',
  description: 'Install stealth pnpm aliases (di, da, dr).',
  actions: [stealthPnpmAction]
};

export default stealthPnpmModule;
