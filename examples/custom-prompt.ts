/**
 * Custom Prompt Example
 *
 * Demonstrates:
 * - Using custom prompts with validation
 * - Parsing values to different types
 * - Advanced prompt patterns
 */

import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';

const customPromptModule: ModuleContract = {
  moduleId: 'custom',
  description: 'Custom prompt examples',

  actions: [
    {
      actionId: 'configure',
      description: 'Configure application settings',

      tui: {
        steps: ['collect-settings']
      },

      commandline: {
        requiredArgs: ['port'],
        optionalArgs: ['timeout', 'max-connections']
      },

      help: {
        summary: 'Configure application with port, timeout, and connection limits.',
        args: [
          { name: 'port', required: true, description: 'Server port (1-65535)', example: '--port=3000' },
          { name: 'timeout', required: false, description: 'Request timeout in seconds', example: '--timeout=30' },
          { name: 'max-connections', required: false, description: 'Max concurrent connections', example: '--max-connections=100' }
        ],
        examples: ['mytool custom configure --port=3000 --timeout=30']
      },

      run: async (context) => {
        // Use custom prompt for port with validation
        const port = await context.prompts.custom<number>({
          message: 'Enter server port (1-65535):',
          defaultValue: context.args.port ? String(context.args.port) : '3000',
          required: true,
          parse: (raw) => parseInt(raw, 10),
          validate: (value) => {
            if (isNaN(value)) return 'Must be a number';
            if (value < 1 || value > 65535) return 'Must be between 1 and 65535';
            if (value < 1024) return 'Ports below 1024 require root privileges';
            return undefined;
          }
        });

        // Use custom prompt for timeout
        const timeout = await context.prompts.custom<number>({
          message: 'Enter request timeout (seconds):',
          defaultValue: context.args.timeout ? String(context.args.timeout) : '30',
          required: false,
          parse: (raw) => parseInt(raw, 10),
          validate: (value) => {
            if (isNaN(value)) return 'Must be a number';
            if (value < 1) return 'Must be at least 1 second';
            if (value > 300) return 'Cannot exceed 300 seconds (5 minutes)';
            return undefined;
          }
        });

        // Use custom prompt for max connections
        const maxConnections = await context.prompts.custom<number>({
          message: 'Enter max concurrent connections:',
          defaultValue: context.args['max-connections'] ? String(context.args['max-connections']) : '100',
          required: false,
          parse: (raw) => parseInt(raw, 10),
          validate: (value) => {
            if (isNaN(value)) return 'Must be a number';
            if (value < 1) return 'Must be at least 1';
            if (value > 10000) return 'Cannot exceed 10000';
            return undefined;
          }
        });

        // Display configuration
        context.terminal.line('');
        context.terminal.line('Configuration Summary:');
        context.terminal.line(`  Port: ${port}`);
        context.terminal.line(`  Timeout: ${timeout}s`);
        context.terminal.line(`  Max Connections: ${maxConnections}`);
        context.terminal.line('');

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: { port, timeout, maxConnections }
        };
      }
    },

    {
      actionId: 'json-input',
      description: 'Accept JSON input with validation',

      tui: {
        steps: ['collect-json', 'process-json']
      },

      commandline: {
        requiredArgs: ['json']
      },

      help: {
        summary: 'Process JSON input with validation.',
        args: [
          { name: 'json', required: true, description: 'Valid JSON string', example: '--json=\'{"key":"value"}\'' }
        ]
      },

      run: async (context) => {
        // Custom prompt for JSON parsing
        const jsonString = await context.prompts.custom<object>({
          message: 'Enter JSON configuration:',
          defaultValue: context.args.json ? String(context.args.json) : '{}',
          required: true,
          parse: (raw) => {
            try {
              return JSON.parse(raw);
            } catch (error) {
              throw new Error('Invalid JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
          },
          validate: (value) => {
            if (typeof value !== 'object' || value === null) {
              return 'Must be a valid JSON object';
            }
            return undefined;
          }
        });

        context.terminal.line('');
        context.terminal.line('Parsed JSON:');
        context.terminal.line(JSON.stringify(value, null, 2));
        context.terminal.line('');

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: jsonString
        };
      }
    }
  ]
};

export default customPromptModule;
