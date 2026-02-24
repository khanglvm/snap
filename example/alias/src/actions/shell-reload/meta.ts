import { SnapHelp } from '../../snap.js';

export const SHELL_RELOAD_ARG_SCHEMA = SnapHelp.defineArgSchema({
  op: {
    required: true,
    description: 'Operation: install.',
    example: '--op=install'
  },
  name: {
    description: 'Alias name (defaults to rl).',
    example: '--name=src'
  },
  overwrite: {
    description: 'Overwrite existing alias when true.',
    example: '--overwrite=true'
  }
});

export const SHELL_RELOAD_HELP = SnapHelp.buildHelpFromArgSchema({
  summary: 'Install a shell reload alias that sources your active shell profile.',
  argSchema: SHELL_RELOAD_ARG_SCHEMA,
  examples: [
    'alias shell-reload --op=install',
    'alias shell-reload --op=install --name=reload',
    'alias shell-reload --op=install --name=rl --overwrite=true'
  ],
  useCases: [
    {
      name: 'quick source',
      description: 'Install rl alias for source ~/.zshrc or ~/.bashrc.',
      command: 'alias shell-reload --op=install --name=rl'
    }
  ]
});
