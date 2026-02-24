export type {
  ClaudeProfile,
  ClaudeProfileConfig,
  ClaudeProfileOperation,
  ClaudeProfileOperationInput,
  ClaudeProfileOperationResult
} from './claude-profile/index.js';

export {
  CLAUDE_PROFILE_LOGIN_ENV_KEYS,
  CLAUDE_PROFILE_NON_LOGIN_ENV_KEYS,
  KNOWN_CLAUDE_ENV_KEYS,
  KNOWN_CLAUDE_CODE_ENV_KEYS,
  KNOWN_CLAUDE_CODE_OTHER_ENV_KEYS,
  KNOWN_CLAUDE_CODE_OTHER_ENV_WITH_DESCRIPTIONS,
  buildOtherEnvVariableHelper,
  parseEnvInput,
  normalizeClaudeProfileOperation as normalizeOperation,
  readClaudeProfileConfig,
  executeClaudeProfileOperation
} from './claude-profile/index.js';

export { parseBooleanLike as parseOptionalBoolean } from '../../../src/dx/args/index.js';
export { detectShellProfile } from './shared/shell-profile.js';
