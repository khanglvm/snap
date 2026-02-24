/**
 * Basic Module Example
 *
 * A minimal Snap module demonstrating the core concepts:
 * - TUI flow definition
 * - Commandline args
 * - Help documentation
 * - Action handler
 */

import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';

const basicModule: ModuleContract = {
  moduleId: 'basic',
  description: 'Basic module examples',

  actions: [
    {
      actionId: 'greet',
      description: 'Greet a person by name',

      // TUI flow: simple step array
      tui: {
        steps: ['collect-name', 'show-greeting']
      },

      // Commandline: define required/optional args
      commandline: {
        requiredArgs: ['name'],
        optionalArgs: ['loud']
      },

      // Help: human and AI-friendly documentation
      help: {
        summary: 'Greet a person by name with optional emphasis.',
        args: [
          {
            name: 'name',
            required: true,
            description: 'Name of the person to greet',
            example: '--name=Alice'
          },
          {
            name: 'loud',
            required: false,
            description: 'Use uppercase for the greeting',
            example: '--loud=true'
          }
        ],
        examples: [
          'mytool basic greet --name=Alice',
          'mytool basic greet --name="Bob" --loud=true'
        ],
        useCases: [
          {
            name: 'simple',
            description: 'Simple greeting',
            command: 'mytool basic greet --name=Alice'
          },
          {
            name: 'emphatic',
            description: 'Enthusiastic greeting',
            command: 'mytool basic greet --name=Alice --loud=true'
          }
        ],
        keybindings: ['Enter confirm', 'Esc cancel']
      },

      // Action handler
      run: async (context) => {
        const name = String(context.args.name ?? 'World');
        const loud = context.args.loud === true || context.args.loud === 'true';

        let greeting = `Hello, ${name}!`;
        if (loud) {
          greeting = greeting.toUpperCase();
        }

        // Output to terminal
        context.terminal.line(greeting);

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: { greeting, name, loud }
        };
      }
    }
  ]
};

export default basicModule;
