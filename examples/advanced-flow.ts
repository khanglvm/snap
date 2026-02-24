/**
 * Advanced Flow Example
 *
 * Demonstrates:
 * - Structured TUI flow with SnapTui.defineTuiFlow
 * - Multi-step workflows
 * - Multiple component types (text, select, confirm, multiselect)
 * - Flow control
 */

import type { ModuleContract } from 'snap-framework';
import { ExitCode } from 'snap-framework';
import * as SnapTui from 'snap-framework';

const advancedModule: ModuleContract = {
  moduleId: 'advanced',
  description: 'Advanced workflow examples',

  actions: [
    {
      actionId: 'create-user',
      description: 'Create a new user with configuration',

      // Structured TUI flow
      tui: {
        flow: SnapTui.defineTuiFlow({
          entryStepId: 'basic-info',
          steps: [
            // Step 1: Collect basic info
            {
              stepId: 'basic-info',
              title: 'Basic Information',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'name',
                  type: 'text',
                  label: 'Full name',
                  arg: 'name',
                  required: true,
                  placeholder: 'e.g., Jane Doe'
                }),
                SnapTui.defineTuiComponent({
                  componentId: 'email',
                  type: 'text',
                  label: 'Email address',
                  arg: 'email',
                  required: true,
                  placeholder: 'e.g., jane@example.com'
                })
              ]
            },

            // Step 2: Assign roles
            {
              stepId: 'roles',
              title: 'Assign Roles',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'roles',
                  type: 'multiselect',
                  label: 'User roles',
                  arg: 'roles',
                  required: true,
                  options: SnapTui.defineTuiOptions([
                    { value: 'admin', label: 'Administrator' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'viewer', label: 'Viewer' },
                    { value: 'billing', label: 'Billing Manager' }
                  ])
                })
              ]
            },

            // Step 3: Additional options
            {
              stepId: 'options',
              title: 'Additional Options',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'send-welcome',
                  type: 'confirm',
                  label: 'Send welcome email?',
                  arg: 'sendWelcome',
                  initialValue: true
                }),
                SnapTui.defineTuiComponent({
                  componentId: 'department',
                  type: 'select',
                  label: 'Department',
                  arg: 'department',
                  required: false,
                  options: SnapTui.defineTuiOptions([
                    { value: 'engineering', label: 'Engineering' },
                    { value: 'design', label: 'Design' },
                    { value: 'marketing', label: 'Marketing' },
                    { value: 'sales', label: 'Sales' },
                    { value: 'support', label: 'Support' }
                  ])
                })
              ]
            },

            // Step 4: Confirmation
            {
              stepId: 'confirm',
              title: 'Confirm User Creation',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'confirmed',
                  type: 'confirm',
                  label: 'Create this user?',
                  arg: 'confirmed',
                  required: true
                })
              ]
            }
          ]
        })
      },

      // Commandline args
      commandline: {
        requiredArgs: ['name', 'email', 'roles'],
        optionalArgs: ['sendWelcome', 'department', 'confirmed']
      },

      // Help
      help: {
        summary: 'Create a new user with roles and optional welcome email.',
        args: [
          { name: 'name', required: true, description: 'User full name', example: '--name="Jane Doe"' },
          { name: 'email', required: true, description: 'User email address', example: '--email=jane@example.com' },
          { name: 'roles', required: true, description: 'Comma-separated roles', example: '--roles=admin,editor' },
          { name: 'sendWelcome', required: false, description: 'Send welcome email', example: '--sendWelcome=true' },
          { name: 'department', required: false, description: 'Department assignment', example: '--department=engineering' }
        ],
        examples: [
          'mytool advanced create-user --name="Jane Doe" --email=jane@example.com --roles=admin',
          'mytool advanced create-user --name="Bob" --email=bob@example.com --roles=editor,viewer --sendWelcome=false'
        ],
        useCases: [
          {
            name: 'admin-user',
            description: 'Create an admin user',
            command: 'mytool advanced create-user --name="Admin" --email=admin@example.com --roles=admin --sendWelcome=true'
          }
        ],
        keybindings: ['Enter confirm', 'Esc cancel', '↑↓ navigate']
      },

      // Action handler
      run: async (context) => {
        // Extract arguments
        const name = String(context.args.name ?? '');
        const email = String(context.args.email ?? '');
        const rolesArg = context.args.roles;

        // Parse roles (could be array from TUI or comma-separated string from CLI)
        let roles: string[] = ['viewer'];
        if (Array.isArray(rolesArg)) {
          roles = rolesArg as string[];
        } else if (typeof rolesArg === 'string') {
          roles = rolesArg.split(',').map(r => r.trim());
        }

        const sendWelcome = context.args.sendWelcome !== false;
        const department = context.args.department ? String(context.args.department) : undefined;

        // Display summary
        context.terminal.line('');
        context.terminal.line('Creating User:');
        context.terminal.line(`  Name: ${name}`);
        context.terminal.line(`  Email: ${email}`);
        context.terminal.line(`  Roles: ${roles.join(', ')}`);
        if (department) {
          context.terminal.line(`  Department: ${department}`);
        }
        context.terminal.line(`  Welcome Email: ${sendWelcome ? 'Yes' : 'No'}`);
        context.terminal.line('');

        // Simulate user creation
        // In real implementation: await createUserInDatabase(...)

        if (sendWelcome) {
          context.terminal.line('✓ Welcome email sent');
        }

        context.terminal.line('✓ User created successfully');

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: {
            id: `user-${Date.now()}`,
            name,
            email,
            roles,
            department,
            sendWelcome,
            createdAt: new Date().toISOString()
          }
        };
      }
    }
  ]
};

export default advancedModule;
