import { describe, expect, it } from 'vitest';
import { createRegistry } from '../src/index.js';
import { dispatchAction } from '../src/runtime/dispatch.js';
import { ExitCode } from '../src/core/errors/framework-errors.js';
import type { ModuleContract } from '../src/core/contracts/module-contract.js';
import * as SnapArgs from '../src/dx/args/index.js';

// Test module based on getting-started.md example
const greeterModule: ModuleContract = {
  moduleId: 'greet',
  description: 'Greeting module',
  actions: [
    {
      actionId: 'hello',
      description: 'Say hello to someone',
      tui: { steps: ['collect-name', 'confirm'] },
      commandline: { requiredArgs: ['name'] },
      help: {
        summary: 'Say hello to a person by name.',
        args: [
          {
            name: 'name',
            required: true,
            description: 'Name of the person to greet',
            example: '--name=Alice'
          }
        ],
        examples: ['mytool greet hello --name=Alice'],
        useCases: [
          {
            name: 'basic',
            description: 'Basic greeting',
            command: 'mytool greet hello --name=Alice'
          }
        ],
        keybindings: ['Enter confirm', 'Esc cancel']
      },
      run: async (context) => {
        const name = String(context.args.name ?? 'World');
        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: `Hello, ${name}!`
        };
      }
    }
  ]
};

// Test module based on snap-args.md examples
const deployModule: ModuleContract = {
  moduleId: 'deploy',
  description: 'Deployment management',
  actions: [
    {
      actionId: 'start',
      description: 'Start a deployment',
      tui: {
        steps: ['collect-environment', 'collect-options', 'confirm']
      },
      commandline: {
        requiredArgs: ['environment'],
        optionalArgs: ['verbose', 'force']
      },
      help: {
        summary: 'Deploy application to the specified environment.',
        args: [
          {
            name: 'environment',
            required: true,
            description: 'Target deployment environment',
            example: '--environment=production'
          },
          {
            name: 'verbose',
            required: false,
            description: 'Enable verbose output',
            example: '--verbose=true'
          },
          {
            name: 'force',
            required: false,
            description: 'Skip pre-deployment checks',
            example: '--force=yes'
          }
        ],
        examples: [
          'mytool deploy start --environment=production',
          'mytool deploy start --environment=staging --verbose=true'
        ],
        useCases: [
          {
            name: 'production',
            description: 'Deploy to production',
            command: 'mytool deploy start --environment=production'
          }
        ],
        keybindings: ['Enter confirm', 'Esc cancel']
      },
      run: async (context) => {
        // Read required environment
        const environment = SnapArgs.readRequiredStringArg(
          context.args,
          'environment',
          'Environment is required'
        );

        // Read optional boolean flags
        const verbose = SnapArgs.readBooleanArg(context.args, 'verbose') ?? false;
        const force = SnapArgs.readBooleanArg(context.args, 'force') ?? false;

        if (verbose) {
          context.terminal.line(`Deploying to ${environment}...`);
        }

        if (force) {
          context.terminal.line('Warning: Skipping pre-deployment checks!');
        }

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: `Deployed to ${environment}`
        };
      }
    }
  ]
};

describe('documentation examples', () => {
  describe('getting-started.md examples', () => {
    it('greeter module works with commandline args', async () => {
      const registry = createRegistry([greeterModule]);

      const result = await dispatchAction({
        registry,
        moduleId: 'greet',
        actionId: 'hello',
        args: { name: 'Alice' },
        isTTY: false
      });

      expect(result.ok).toBe(true);
      expect(result.data).toBe('Hello, Alice!');
    });

    it('greeter module defaults to World when no name provided', async () => {
      const registry = createRegistry([greeterModule]);

      const result = await dispatchAction({
        registry,
        moduleId: 'greet',
        actionId: 'hello',
        args: {},
        isTTY: true // TUI mode would normally handle this
      });

      expect(result.ok).toBe(true);
      expect(result.data).toBe('Hello, World!');
    });
  });

  describe('snap-args.md examples', () => {
    it('deploy module works with required environment arg', async () => {
      const registry = createRegistry([deployModule]);

      const result = await dispatchAction({
        registry,
        moduleId: 'deploy',
        actionId: 'start',
        args: { environment: 'production' },
        isTTY: false
      });

      expect(result.ok).toBe(true);
      expect(result.data).toBe('Deployed to production');
    });

    it('deploy module works with optional boolean flags', async () => {
      const registry = createRegistry([deployModule]);

      const result = await dispatchAction({
        registry,
        moduleId: 'deploy',
        actionId: 'start',
        args: { environment: 'staging', verbose: 'true', force: 'yes' },
        isTTY: false
      });

      expect(result.ok).toBe(true);
      expect(result.data).toBe('Deployed to staging');
    });

    it('deploy module handles missing required arg', async () => {
      const registry = createRegistry([deployModule]);

      const result = await dispatchAction({
        registry,
        moduleId: 'deploy',
        actionId: 'start',
        args: {},
        isTTY: true
      });

      // Should fail due to missing required arg
      expect(result.ok).toBe(false);
    });
  });
});
