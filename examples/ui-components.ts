/**
 * UI Components Example
 *
 * Demonstrates using the advanced Snap UI components:
 * - createSpinner/spinner for async operations
 * - runPasswordPrompt for secure input
 * - createProgress/progress for quantified progress
 * - tasks for sequential async operations
 * - note for decorative message boxes
 * - runAutocompletePrompt for searchable selections
 *
 * Also uses SnapTerminal for intro/outro/log
 */

import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';
import {
  createSpinner,
  runPasswordPrompt
} from 'snap-framework';
import * as SnapTui from 'snap-framework';
import * as SnapTerminal from 'snap-framework';

const uiComponentsModule: ModuleContract = {
  moduleId: 'ui',
  description: 'Advanced UI component examples',

  actions: [
    {
      actionId: 'spinner-example',
      description: 'Demonstrate spinner for async operations',

      tui: {
        steps: ['collect-env', 'deploy']
      },

      commandline: {
        requiredArgs: ['environment']
      },

      help: {
        summary: 'Deploy to environment with spinner progress indicator.',
        args: [
          { name: 'environment', required: true, description: 'Target environment', example: '--environment=production' }
        ],
        examples: ['mytool ui spinner-example --environment=production']
      },

      run: async (context) => {
        const environment = String(context.args.environment ?? '');

        // Show intro
        SnapTerminal.intro(`Deploying to ${environment}`);

        // Create spinner via SnapTui
        const spinner = SnapTui.createSpinner();

        try {
          // Step 1: Build
          spinner.start('Building application...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          spinner.stop('✓ Build complete');

          // Step 2: Run tests
          spinner.start('Running tests...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          spinner.stop('✓ Tests passed');

          // Step 3: Deploy
          spinner.start(`Deploying to ${environment}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          spinner.stop(`✓ Deployed to ${environment}`);

          // Show outro
          SnapTerminal.outro('Deployment complete!');

          return {
            ok: true,
            mode: context.mode,
            exitCode: ExitCode.SUCCESS,
            data: { environment, status: 'deployed' }
          };
        } catch (error) {
          spinner.stop('✗ Deployment failed');
          SnapTerminal.outro('Deployment failed');

          return {
            ok: false,
            mode: context.mode,
            exitCode: ExitCode.RUNTIME_ERROR,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    },

    {
      actionId: 'password-example',
      description: 'Demonstrate secure password input',

      tui: {
        steps: ['collect-credentials', 'authenticate']
      },

      commandline: {
        requiredArgs: ['username'],
        optionalArgs: ['password']
      },

      help: {
        summary: 'Authenticate with username and password.',
        args: [
          { name: 'username', required: true, description: 'Username', example: '--username=admin' },
          { name: 'password', required: false, description: 'Password (prompts if not provided)', example: '--password=secret' }
        ],
        examples: ['mytool ui password-example --username=admin']
      },

      run: async (context) => {
        const username = String(context.args.username ?? '');

        SnapTerminal.intro('Authentication Required');

        // Get password (prompt if not provided via CLI)
        let password: string;
        if (context.args.password && typeof context.args.password === 'string') {
          password = context.args.password;
        } else {
          password = await runPasswordPrompt({
            message: `Enter password for ${username}:`,
            required: true
          });
        }

        SnapTerminal.log.info(`Authenticating as ${username}...`);

        // Simulate authentication
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (password === 'correct-password') {
          SnapTerminal.log.success('Authentication successful');
          SnapTerminal.outro(`Welcome, ${username}!`);

          return {
            ok: true,
            mode: context.mode,
            exitCode: ExitCode.SUCCESS,
            data: { username, authenticated: true }
          };
        } else {
          SnapTerminal.log.error('Authentication failed');
          SnapTerminal.outro('Access denied');

          return {
            ok: false,
            mode: context.mode,
            exitCode: ExitCode.VALIDATION_ERROR,
            errorMessage: 'Invalid password'
          };
        }
      }
    },

    {
      actionId: 'tasks-example',
      description: 'Demonstrate sequential task execution',

      tui: {
        steps: ['run-tasks']
      },

      commandline: {
        requiredArgs: []
      },

      help: {
        summary: 'Demonstrate tasks component for sequential async operations.',
        args: []
      },

      run: async (context) => {
        SnapTerminal.intro('Running deployment pipeline');

        const results = await SnapTui.tasks([
          {
            title: 'Install dependencies',
            task: async (msg) => {
              msg('Installing packages...');
              await new Promise(resolve => setTimeout(resolve, 1500));
              return 'Dependencies installed';
            }
          },
          {
            title: 'Run tests',
            task: async (msg) => {
              msg('Running test suite...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              return 'All tests passed';
            }
          },
          {
            title: 'Build application',
            task: async (msg) => {
              msg('Compiling TypeScript...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              return 'Build complete';
            }
          },
          {
            title: 'Deploy to production',
            task: async (msg) => {
              msg('Uploading assets...');
              await new Promise(resolve => setTimeout(resolve, 1500));
              return 'Deployed successfully';
            }
          }
        ]);

        SnapTerminal.outro('Pipeline complete!');

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: { results }
        };
      }
    },

    {
      actionId: 'autocomplete-example',
      description: 'Demonstrate searchable autocomplete selection',

      tui: {
        steps: ['select-package']
      },

      commandline: {
        requiredArgs: [],
        optionalArgs: ['package']
      },

      help: {
        summary: 'Select from a large list using searchable autocomplete.',
        args: [
          { name: 'package', required: false, description: 'Package name (skip for autocomplete)', example: '--package=react' }
        ],
        examples: ['mytool ui autocomplete-example']
      },

      run: async (context) => {
        SnapTerminal.intro('Package Installer');

        const packages = [
          { value: 'react', label: 'React', hint: 'A JavaScript library for building UIs' },
          { value: 'vue', label: 'Vue.js', hint: 'Progressive JavaScript framework' },
          { value: 'angular', label: 'Angular', hint: 'Platform for building mobile & web apps' },
          { value: 'svelte', label: 'Svelte', hint: 'Cybernetically enhanced web apps' },
          { value: 'next', label: 'Next.js', hint: 'React framework for production' },
          { value: 'nuxt', label: 'Nuxt.js', hint: 'Vue.js framework for production' },
          { value: 'remix', label: 'Remix', hint: 'Full stack web framework' },
          { value: 'astro', label: 'Astro', hint: 'Build faster websites' }
        ];

        let selectedPackage: string;

        if (context.args.package && typeof context.args.package === 'string') {
          selectedPackage = context.args.package;
        } else {
          selectedPackage = await SnapTui.runAutocompletePrompt({
            message: 'Select a package to install:',
            options: packages,
            placeholder: 'Search packages...',
            required: true
          }) ?? '';
        }

        SnapTerminal.log.success(`Installing ${selectedPackage}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        SnapTerminal.log.success(`${selectedPackage} installed successfully!`);

        SnapTerminal.outro('Installation complete');

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: { package: selectedPackage }
        };
      }
    },

    {
      actionId: 'note-example',
      description: 'Demonstrate note component for messages',

      tui: {
        steps: ['show-notes']
      },

      commandline: {
        requiredArgs: []
      },

      help: {
        summary: 'Demonstrate note component for displaying message boxes.',
        args: []
      },

      run: async (context) => {
        SnapTerminal.intro('Important Information');

        // Info note
        SnapTui.note({
          message: 'This operation may take several minutes.\nPlease do not close your terminal.',
          title: 'INFO'
        });

        context.terminal.line('');

        // Warning note
        SnapTui.note({
          message: 'This will modify production data.\nMake sure you have a backup.',
          title: 'WARNING'
        });

        context.terminal.line('');

        // Tip note with custom format
        SnapTui.note({
          message: 'You can use --help to see all available options.',
          title: 'TIP',
          format: (line) => `💡 ${line}`
        });

        SnapTerminal.outro('Notes displayed');

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: {}
        };
      }
    },

    {
      actionId: 'full-example',
      description: 'Complete example using all UI components',

      tui: {
        steps: ['collect-input', 'process']
      },

      commandline: {
        requiredArgs: ['name'],
        optionalArgs: ['password', 'package']
      },

      help: {
        summary: 'Complete example demonstrating all UI components together.',
        args: [
          { name: 'name', required: true, description: 'Your name', example: '--name=Alice' },
          { name: 'password', required: false, description: 'Optional password', example: '--password=secret' },
          { name: 'package', required: false, description: 'Package to install', example: '--package=react' }
        ],
        examples: ['mytool ui full-example --name=Alice']
      },

      run: async (context) => {
        const name = String(context.args.name ?? '');
        const spinner = SnapTui.createSpinner();

        // Intro with note
        SnapTerminal.intro(`Welcome, ${name}!`);
        SnapTui.note({
          message: 'This example demonstrates all Snap UI components.',
          title: 'DEMO'
        });

        context.terminal.line('');

        // Get optional password
        let password = '';
        if (context.args.password && typeof context.args.password === 'string') {
          password = context.args.password;
        } else if (context.mode === 'tui') {
          try {
            password = await runPasswordPrompt({
              message: 'Enter password (optional, press Enter to skip):',
              required: false
            });
          } catch {
            // User cancelled
          }
        }

        if (password) {
          SnapTerminal.log.success('Password provided');
        } else {
          SnapTerminal.log.info('No password provided (continuing without auth)');
        }

        // Autocomplete for package selection
        let selectedPackage = context.args.package;
        if (!selectedPackage && context.mode === 'tui') {
          selectedPackage = await SnapTui.runAutocompletePrompt({
            message: 'Select a package:',
            options: [
              { value: 'react', label: 'React' },
              { value: 'vue', label: 'Vue.js' },
              { value: 'svelte', label: 'Svelte' }
            ],
            placeholder: 'Search...'
          });
        }

        // Run tasks with spinner-like feedback
        const results = await SnapTui.tasks([
          {
            title: 'Validate input',
            task: async () => 'Input validated'
          },
          {
            title: `Install ${selectedPackage || 'package'}`,
            task: async () => `${selectedPackage || 'Package'} installed`
          },
          {
            title: 'Configure settings',
            task: async () => 'Settings configured'
          }
        ]);

        // Final spinner for cleanup
        spinner.start('Finalizing...');
        await new Promise(resolve => setTimeout(resolve, 800));
        spinner.stop('✓ Complete');

        // Outro
        SnapTerminal.outro(`Thank you, ${name}! All components demonstrated.`);

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: {
            name,
            hasPassword: !!password,
            package: selectedPackage,
            results
          }
        };
      }
    }
  ]
};

export default uiComponentsModule;
