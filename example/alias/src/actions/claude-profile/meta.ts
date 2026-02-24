import { SnapHelp } from '../../snap.js';
import { buildOtherEnvVariableHelper, KNOWN_CLAUDE_ENV_KEYS } from '../../claude-profile/index.js';

const FOCUSED_ENV_FLAGS_HELP = KNOWN_CLAUDE_ENV_KEYS.map((key) => `--${key}=...`).join(', ');
const OTHER_ENV_VARIABLES_HELP = buildOtherEnvVariableHelper();

export const CLAUDE_PROFILE_ARG_SCHEMA = SnapHelp.defineArgSchema({
  op: {
    required: true,
    description: 'Operation: list|show|upsert|rename|remove|sync.',
    example: '--op=upsert'
  },
  name: {
    description: 'Alias name for show/upsert/remove/rename/sync(single).',
    example: '--name=cc'
  },
  to: {
    description: 'Target alias name when op=rename.',
    example: '--to=cc_work'
  },
  'skip-permissions': {
    description:
      'Enable/disable --dangerously-skip-permissions. Supported values: true|false|1|0|yes|no|on|off.',
    example: '--skip-permissions=true'
  },
  FOCUSED_ENV_VARIABLES: {
    includeInCommandline: false,
    helpName: 'FOCUSED_ENV_VARIABLES',
    description: `Focused env presets for op=upsert: ${FOCUSED_ENV_FLAGS_HELP}.`,
    example: '--ANTHROPIC_API_KEY=... --ANTHROPIC_BASE_URL=https://api.anthropic.com'
  },
  OTHER_ENV_VARIABLES: {
    includeInCommandline: false,
    helpName: 'OTHER_ENV_VARIABLES',
    description: OTHER_ENV_VARIABLES_HELP,
    example: '--CLAUDE_CODE_USE_VERTEX=true --HTTP_PROXY=http://proxy.local:8080'
  }
});

export const CLAUDE_PROFILE_HELP = SnapHelp.buildHelpFromArgSchema({
  summary: 'Manage Claude Code alias profiles stored in ~/.claude-alias.json and synced to shell rc.',
  argSchema: CLAUDE_PROFILE_ARG_SCHEMA,
  examples: [
    'alias --op=list',
    'alias --op=upsert --name=cc --ANTHROPIC_BASE_URL=https://api.example.com --SOME_UNKNOWN_ENV_KEY=test --skip-permissions=true',
    'alias --op=rename --name=cc --to=cc_work',
    'alias --op=sync',
    'alias --op=remove --name=cc_work'
  ],
  useCases: [
    {
      name: 'bootstrap profile',
      description: 'Create a Claude profile alias and install shell function.',
      command: 'alias --op=upsert --name=cc --ANTHROPIC_API_KEY=... --SOME_UNKNOWN_ENV_KEY=test'
    },
    {
      name: 'repair shell block',
      description: 'Re-sync alias function into shell profile.',
      command: 'alias --op=sync --name=cc'
    }
  ]
});
