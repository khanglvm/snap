import type { ModuleContract } from '../../snap.js';
import { claudeProfileAction } from '../../actions/claude-profile/action.js';

const claudeProfileModule: ModuleContract = {
  moduleId: 'claude-profile',
  description: 'Manage Claude Code profile aliases and shell sync.',
  actions: [claudeProfileAction]
};

export default claudeProfileModule;
