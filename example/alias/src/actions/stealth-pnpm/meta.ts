import { SnapHelp } from '../../snap.js';

export const STEALTH_PNPM_ARG_SCHEMA = SnapHelp.defineArgSchema({
  op: {
    required: true,
    description: 'Operation: install.',
    example: '--op=install'
  },
  overwrite: {
    description: 'Overwrite existing pnpm alias block when true.',
    example: '--overwrite=true'
  }
});

export const STEALTH_PNPM_HELP = SnapHelp.buildHelpFromArgSchema({
  summary: 'Install stealth pnpm aliases for space-saving installs while keeping yarn/npm compatibility.',
  argSchema: STEALTH_PNPM_ARG_SCHEMA,
  examples: [
    'alias stealth-pnpm --op=install',
    'alias stealth-pnpm --op=install --overwrite=true'
  ],
  useCases: [
    {
      name: 'space savings',
      description: 'Install di/da/dr aliases to use pnpm global store in yarn/npm projects.',
      command: 'alias stealth-pnpm --op=install'
    }
  ]
});
