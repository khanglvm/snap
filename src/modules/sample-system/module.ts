import type { ModuleContract } from '../../core/contracts/module-contract.js';
import { ExitCode } from '../../core/errors/framework-errors.js';

const sampleSystemModule: ModuleContract = {
  moduleId: 'system',
  description: 'System utility sample actions for framework adoption.',
  actions: [
    {
      actionId: 'env-check',
      description: 'Read environment and report platform details.',
      tui: { steps: ['select-keys', 'review-output'] },
      commandline: { requiredArgs: ['key'] },
      help: {
        summary: 'Check environment variable and runtime platform.',
        args: [
          {
            name: 'key',
            required: true,
            description: 'Environment key to inspect.',
            example: '--key=HOME'
          }
        ],
        examples: ['hub system env-check --key=HOME'],
        useCases: [
          {
            name: 'debug env',
            description: 'Inspect required runtime variable',
            command: 'hub system env-check --key=NODE_ENV'
          }
        ],
        keybindings: ['Enter confirm', 'Esc cancel']
      },
      run: async (context) => {
        const key = typeof context.args.key === 'string' ? context.args.key : '';
        const value = key ? process.env[key] ?? '' : '';
        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: `${key}=${value}`
        };
      }
    },
    {
      actionId: 'node-info',
      description: 'Display Node and OS info.',
      tui: { steps: ['collect-options', 'show-runtime'] },
      commandline: { requiredArgs: [] },
      help: {
        summary: 'Print deterministic Node runtime and platform info.',
        args: [],
        examples: ['hub system node-info'],
        useCases: [
          {
            name: 'verify runtime',
            description: 'Check active node version and OS',
            command: 'hub system node-info'
          }
        ],
        keybindings: ['Enter confirm', 'Esc cancel']
      },
      run: async (context) => {
        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: `node=${process.version};platform=${process.platform}`
        };
      }
    }
  ]
};

export default sampleSystemModule;
