/**
 * DX Helpers Example
 *
 * Demonstrates using all Snap DX helper groups:
 * - SnapArgs: Type-safe argument reading
 * - SnapHelp: Schema-driven help generation
 * - SnapRuntime: Standardized action results
 * - SnapTerminal: Terminal output
 * - SnapTui: Typed TUI flow definitions
 */

import type { ModuleContract } from 'snap-framework';
import * as SnapArgs from 'snap-framework';
import * as SnapHelp from 'snap-framework';
import * as SnapRuntime from 'snap-framework';
import * as SnapTerminal from 'snap-framework';
import * as SnapTui from 'snap-framework';

// Define argument schema once
const DEPLOY_ARG_SCHEMA = SnapHelp.defineArgSchema({
  environment: {
    description: 'Target deployment environment',
    required: true,
    example: '--environment=production'
  },
  region: {
    description: 'AWS region for deployment',
    required: false,
    example: '--region=us-east-1'
  },
  verbose: {
    description: 'Enable verbose logging',
    required: false,
    example: '--verbose'
  },
  'dry-run': {
    description: 'Show what would be done without making changes',
    required: false,
    example: '--dry-run',
    helpName: 'dry-run'
  },
  force: {
    description: 'Skip pre-deployment checks',
    required: false,
    example: '--force'
  }
});

// Generate help from schema
const DEPLOY_HELP = SnapHelp.buildHelpFromArgSchema({
  summary: 'Deploy application to the specified environment with optional configuration.',
  argSchema: DEPLOY_ARG_SCHEMA,
  examples: [
    'mytool deploy start --environment=production',
    'mytool deploy start --environment=staging --region=us-west-2',
    'mytool deploy start --environment=production --dry-run'
  ],
  useCases: [
    {
      name: 'production',
      description: 'Standard production deployment',
      command: 'mytool deploy start --environment=production'
    },
    {
      name: 'staging',
      description: 'Deploy to staging in specific region',
      command: 'mytool deploy start --environment=staging --region=us-west-2'
    },
    {
      name: 'preview',
      description: 'Preview deployment changes',
      command: 'mytool deploy start --environment=production --dry-run'
    }
  ]
});

const dxHelpersModule: ModuleContract = {
  moduleId: 'deploy',
  description: 'Deployment management using DX helpers',

  actions: [
    {
      actionId: 'start',
      description: 'Start a deployment',

      // TUI flow with SnapTui helpers
      tui: {
        flow: SnapTui.defineTuiFlow({
          entryStepId: 'environment',
          steps: [
            {
              stepId: 'environment',
              title: 'Select Environment',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'env',
                  type: 'select',
                  label: 'Environment',
                  arg: 'environment',
                  required: true,
                  options: SnapTui.defineTuiOptions([
                    { value: 'development', label: 'Development (Local)' },
                    { value: 'staging', label: 'Staging (Pre-production)' },
                    { value: 'production', label: 'Production (Live)' }
                  ])
                })
              ]
            },
            {
              stepId: 'options',
              title: 'Deployment Options',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'region',
                  type: 'select',
                  label: 'Region',
                  arg: 'region',
                  required: false,
                  options: SnapTui.defineTuiOptions([
                    { value: 'us-east-1', label: 'US East (N. Virginia)' },
                    { value: 'us-west-2', label: 'US West (Oregon)' },
                    { value: 'eu-west-1', label: 'EU (Ireland)' }
                  ])
                }),
                SnapTui.defineTuiComponent({
                  componentId: 'verbose',
                  type: 'confirm',
                  label: 'Enable verbose logging',
                  arg: 'verbose'
                }),
                SnapTui.defineTuiComponent({
                  componentId: 'dry-run',
                  type: 'confirm',
                  label: 'Dry run (show changes only)',
                  arg: 'dry-run'
                }),
                SnapTui.defineTuiComponent({
                  componentId: 'force',
                  type: 'confirm',
                  label: 'Force deployment (skip checks)',
                  arg: 'force'
                })
              ]
            },
            {
              stepId: 'confirm',
              title: 'Confirm Deployment'
            }
          ]
        })
      },

      // Commandline from schema
      commandline: SnapHelp.commandlineFromArgSchema(DEPLOY_ARG_SCHEMA),

      // Pre-built help
      help: DEPLOY_HELP,

      // Action handler with runtime helpers
      run: async (context) => {
        return SnapRuntime.runActionSafely({
          context,
          fallbackErrorMessage: 'Deployment failed',
          execute: async () => {
            // Use SnapArgs for type-safe argument reading
            const environment = SnapArgs.readRequiredStringArg(
              context.args,
              'environment',
              'Environment is required'
            );

            const region = SnapArgs.readStringArg(context.args, 'region');
            const verbose = SnapArgs.readBooleanArg(context.args, 'verbose') ?? false;
            const dryRun = SnapArgs.readBooleanArg(context.args, 'dry-run') ?? false;
            const force = SnapArgs.readBooleanArg(context.args, 'force') ?? false;

            // Verbose output
            if (verbose) {
              context.terminal.line('Configuration:');
              context.terminal.line(`  Environment: ${environment}`);
              if (region) context.terminal.line(`  Region: ${region}`);
              context.terminal.line(`  Dry Run: ${dryRun}`);
              context.terminal.line(`  Force: ${force}`);
              context.terminal.line('');
            }

            // Dry run output
            if (dryRun) {
              context.terminal.line('DRY RUN - The following would be deployed:');
              context.terminal.line(`  Environment: ${environment}`);
              if (region) context.terminal.line(`  Region: ${region}`);
              context.terminal.line('');
              context.terminal.line('No changes made (dry run mode).');
            } else {
              // Actual deployment
              context.terminal.line(`Deploying to ${environment}...`);

              if (force) {
                context.terminal.line('⚠  Skipping pre-deployment checks (force mode)');
              }

              // Simulate deployment steps
              const steps = ['Building', 'Testing', 'Deploying', 'Verifying'];
              for (const step of steps) {
                if (verbose) context.terminal.line(`  → ${step}...`);
              }

              context.terminal.line(`✓ Deployed to ${environment}`);
            }

            // Return success result
            return {
              environment,
              region: region ?? 'default',
              dryRun,
              deployedAt: new Date().toISOString(),
              status: dryRun ? 'previewed' : 'deployed'
            };
          },
          onSuccess: (result) => {
            // Optional post-processing
            if (verbose) {
              context.terminal.line(`\nDeployment completed at ${result.deployedAt}`);
            }
            return result;
          }
        });
      }
    }
  ]
};

export default dxHelpersModule;
