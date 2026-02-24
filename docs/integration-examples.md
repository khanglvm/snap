# Integration Examples

This guide provides practical examples for common integration patterns with the Snap framework.

## Multi-Module CLI

### Standard CLI Structure

```
mytool/
├── src/
│   ├── cli.ts                 # CLI entry point
│   ├── modules/
│   │   ├── deploy/
│   │   │   └── module.ts
│   │   ├── database/
│   │   │   └── module.ts
│   │   └── index.ts           # Module registry
│   └── index.ts               # Barrel export
├── package.json
└── tsconfig.json
```

### CLI Entry Point (`cli.ts`)

```typescript
#!/usr/bin/env node
import { createRegistry, runMultiModuleCli } from 'snap-framework';
import { modules } from './modules/index.js';

const registry = createRegistry(modules);

await runMultiModuleCli({
  registry,
  cliName: 'mytool'
});
```

### Module Registry (`modules/index.ts`)

```typescript
import type { ModuleContract } from 'snap-framework';
import deployModule from './deploy/module.js';
import databaseModule from './database/module.js';

export const modules: ModuleContract[] = [
  deployModule,
  databaseModule
];
```

### Usage

```bash
mytool -h                    # List all modules
mytool deploy -h             # Module help
mytool deploy start --env=prod
mytool database migrate
```

## Single-Module CLI

For dedicated tools that focus on one domain:

### CLI Entry Point

```typescript
#!/usr/bin/env node
import { createRegistry, runSingleModuleCli } from 'snap-framework';
import myModule from './module.js';

const registry = createRegistry([myModule]);

await runSingleModuleCli({
  registry,
  moduleSelector: (args) => {
    // Could conditionally return different modules
    return myModule;
  },
  defaultActionId: 'start'  // Makes `mytool` equivalent to `mytool start`
});
```

### Usage

```bash
mytool                    # Runs default action (start)
mytool start              # Explicit action
mytool start --option=value
```

## Submodule CLI

For tools organized by feature submodules (like the alias example):

### App Structure

```typescript
// src/app.ts
import type { AppContract } from 'snap-framework';
import { featureModules, submoduleRoutes } from './modules/index.js';

export const app = {
  modules: featureModules,
  submodules: submoduleRoutes,
  defaultSubmoduleId: 'default'  // Optional default submodule
} as const;
```

### Submodule Routes

```typescript
// src/modules/index.ts
import type { ModuleContract, SubmoduleRoute } from 'snap-framework';
import defaultModule from './default/module.js';
import featureA from './feature-a/module.js';
import featureB from './feature-b/module.js';

export const featureModules: ModuleContract[] = [
  defaultModule,
  featureA,
  featureB
];

const toDefaultAction = (moduleContract: ModuleContract): string =>
  moduleContract.actions[0]?.actionId ?? moduleContract.moduleId;

export const submoduleRoutes: SubmoduleRoute[] = featureModules.map((moduleContract) => ({
  moduleId: moduleContract.moduleId,
  defaultActionId: toDefaultAction(moduleContract),
  helpDefaultTarget: 'action'
}));
```

### CLI Entry Point

```typescript
#!/usr/bin/env node
import { runSubmoduleCli } from 'snap-framework';
import { app } from './app.js';

await runSubmoduleCli({
  app,
  cliName: 'mytool'
});
```

### Usage

```bash
mytool -h                          # List all submodules
mytool default -h                  # Default submodule help
mytool feature-a action-name       # Specific action
mytool feature-a                   # Runs default action for feature-a
```

## Environment Variable Integration

### Collecting Environment Variables

```typescript
import * as SnapArgs from 'snap-framework';

run: async (context) => {
  // Collect all MYAPP_* prefixed env vars
  const envArgs = SnapArgs.collectUpperSnakeCaseEnvArgs(context.args, 'MYAPP_');

  const apiKey = envArgs.MYAPP_API_KEY;
  const region = envArgs.MYAPP_REGION;
  const debug = envArgs.MYAPP_DEBUG;

  return {
    ok: true,
    mode: context.mode,
    exitCode: ExitCode.SUCCESS,
    data: { apiKey, region, debug }
  };
}
```

### Fallback Pattern: CLI → ENV → Default

```typescript
run: async (context) => {
  // Try CLI arg first, then environment, then default
  const environment =
    SnapArgs.readStringArg(context.args, 'environment', 'env') ??
    SnapArgs.readStringArg(process.env as any, 'MYAPP_ENVIRONMENT') ??
    'development';

  return {
    ok: true,
    mode: context.mode,
    exitCode: ExitCode.SUCCESS,
    data: { environment }
  };
}
```

## Configuration File Integration

### Loading Configuration

```typescript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
}

const loadConfig = (path: string): AppConfig => {
  const resolved = resolve(path);
  const content = readFileSync(resolved, 'utf-8');
  return JSON.parse(content);
};

const configModule: ModuleContract = {
  moduleId: 'config',
  description: 'Configuration management',
  actions: [
    {
      actionId: 'validate',
      description: 'Validate configuration file',
      tui: { steps: ['collect-path', 'show-results'] },
      commandline: { requiredArgs: ['config'] },
      help: {
        summary: 'Validate configuration file.',
        args: [{ name: 'config', required: true, description: 'Config file path' }]
      },
      run: async (context) => {
        const configPath = String(context.args.config ?? '');
        const config = loadConfig(configPath);

        // Validation logic
        const errors: string[] = [];

        if (!config.apiUrl) errors.push('apiUrl is required');
        if (config.timeout < 0) errors.push('timeout must be positive');
        if (config.retries < 0) errors.push('retries must be non-negative');

        if (errors.length > 0) {
          context.terminal.error('Configuration errors:');
          context.terminal.lines(errors.map(e => `  ✗ ${e}`));

          return {
            ok: false,
            mode: context.mode,
            exitCode: ExitCode.VALIDATION_ERROR,
            errorMessage: errors.join('; ')
          };
        }

        context.terminal.line('✓ Configuration is valid');
        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: config
        };
      }
    }
  ]
};
```

## API Integration

### Fetch-Based Action

```typescript
import * as SnapRuntime from 'snap-framework';

const apiModule: ModuleContract = {
  moduleId: 'api',
  description: 'API operations',
  actions: [
    {
      actionId: 'fetch',
      description: 'Fetch from API',
      tui: { steps: ['collect-url', 'show-response'] },
      commandline: { requiredArgs: ['url'] },
      help: {
        summary: 'Fetch data from API endpoint.',
        args: [{ name: 'url', required: true, description: 'API URL' }]
      },
      run: async (context) => {
        return SnapRuntime.runActionSafely({
          context,
          fallbackErrorMessage: 'API request failed',
          execute: async () => {
            const url = String(context.args.url ?? '');
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            context.terminal.line(`Fetched ${JSON.stringify(data).length} bytes`);

            return data;
          }
        });
      }
    }
  ]
};
```

### With Authentication

```typescript
run: async (context) => {
  return SnapRuntime.runActionSafely({
    context,
    fallbackErrorMessage: 'API request failed',
    execute: async () => {
      const url = String(context.args.url ?? '');
      const token = SnapArgs.readRequiredStringArg(context.args, 'token');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    }
  });
}
```

## File System Operations

### Safe File Operations

```typescript
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const fileModule: ModuleContract = {
  moduleId: 'file',
  description: 'File operations',
  actions: [
    {
      actionId: 'process',
      description: 'Process a file',
      tui: { steps: ['collect-path', 'show-results'] },
      commandline: { requiredArgs: ['path'] },
      help: {
        summary: 'Process and transform a file.',
        args: [{ name: 'path', required: true, description: 'File path' }]
      },
      run: async (context) => {
        return SnapRuntime.runActionSafely({
          context,
          fallbackErrorMessage: 'File operation failed',
          execute: async () => {
            const filePath = resolve(String(context.args.path ?? ''));

            context.terminal.line(`Reading ${filePath}...`);

            const content = await readFile(filePath, 'utf-8');

            // Process content
            const processed = content
              .toUpperCase()
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 0)
              .join('\n');

            context.terminal.line(`Processed ${processed.split('\n').length} lines`);

            return {
              original: content,
              processed,
              lineCount: processed.split('\n').length
            };
          }
        });
      }
    }
  ]
};
```

## Database Integration

### Query Execution

```typescript
// Using a hypothetical database client
import { createClient } from 'my-database-client';

const dbModule: ModuleContract = {
  moduleId: 'db',
  description: 'Database operations',
  actions: [
    {
      actionId: 'query',
      description: 'Execute database query',
      tui: { steps: ['collect-query', 'show-results'] },
      commandline: { requiredArgs: ['query'] },
      help: {
        summary: 'Execute a SQL query.',
        args: [{ name: 'query', required: true, description: 'SQL query' }]
      },
      run: async (context) => {
        return SnapRuntime.runActionSafely({
          context,
          fallbackErrorMessage: 'Database query failed',
          execute: async () => {
            const query = String(context.args.query ?? '');
            const connectionString = process.env.DATABASE_URL;

            if (!connectionString) {
              throw new Error('DATABASE_URL environment variable is required');
            }

            const client = createClient(connectionString);

            context.terminal.line('Executing query...');

            const results = await client.query(query);

            context.terminal.line(`Returned ${results.rows.length} row(s)`);

            await client.close();

            return results.rows;
          }
        });
      }
    }
  ]
};
```

## Workflow Patterns

### Multi-Step Deployment

```typescript
const deployModule: ModuleContract = {
  moduleId: 'deploy',
  description: 'Deployment automation',
  actions: [
    {
      actionId: 'full',
      description: 'Full deployment pipeline',
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
                    { value: 'staging', label: 'Staging' },
                    { value: 'production', label: 'Production' }
                  ])
                })
              ]
            },
            {
              stepId: 'options',
              title: 'Deployment Options',
              components: [
                SnapTui.defineTuiComponent({
                  componentId: 'skip-tests',
                  type: 'confirm',
                  label: 'Skip tests?',
                  arg: 'skipTests'
                }),
                SnapTui.defineTuiComponent({
                  componentId: 'force',
                  type: 'confirm',
                  label: 'Force deployment?',
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
      commandline: {
        requiredArgs: ['environment'],
        optionalArgs: ['skipTests', 'force']
      },
      help: {
        summary: 'Run full deployment pipeline.',
        args: [
          { name: 'environment', required: true, description: 'Target environment' },
          { name: 'skipTests', required: false, description: 'Skip test suite' },
          { name: 'force', required: false, description: 'Force deployment' }
        ]
      },
      run: async (context) => {
        return SnapRuntime.runActionSafely({
          context,
          fallbackErrorMessage: 'Deployment failed',
          execute: async () => {
            const environment = String(context.args.environment ?? '');
            const skipTests = Boolean(context.args.skipTests);
            const force = Boolean(context.args.force);

            context.terminal.line(`Starting deployment to ${environment}...`);

            // Step 1: Run tests (unless skipped)
            if (!skipTests) {
              context.terminal.line('Running tests...');
              await runTests();
              context.terminal.line('✓ Tests passed');
            } else {
              context.terminal.line('⚠ Tests skipped');
            }

            // Step 2: Build
            context.terminal.line('Building application...');
            await buildApp();
            context.terminal.line('✓ Build complete');

            // Step 3: Deploy
            context.terminal.line('Deploying...');
            const deploymentResult = await deploy(environment, force);
            context.terminal.line(`✓ Deployed to ${deploymentResult.url}`);

            return {
              environment,
              url: deploymentResult.url,
              version: deploymentResult.version
            };
          }
        });
      }
    }
  ]
};
```

## Testing Integration

### Testable Module Design

```typescript
// module.ts
export const createMyModule = (dependencies: {
  apiClient: ApiClient;
  logger: Logger;
}): ModuleContract => ({
  moduleId: 'my',
  description: 'My module',
  actions: [
    {
      actionId: 'action',
      description: 'My action',
      tui: { steps: [] },
      commandline: { requiredArgs: [] },
      help: { summary: 'My action' },
      run: async (context) => {
        const result = await dependencies.apiClient.fetch();
        dependencies.logger.log('Result:', result);

        return {
          ok: true,
          mode: context.mode,
          exitCode: ExitCode.SUCCESS,
          data: result
        };
      }
    }
  ]
});
```

### Usage Tests

```typescript
import { createRegistry } from 'snap-framework';
import { createMyModule } from './module.js';

describe('my-tool', () => {
  it('should run action successfully', async () => {
    const mockApiClient = {
      fetch: vi.fn().mockResolvedValue({ data: 'test' })
    };

    const mockLogger = {
      log: vi.fn()
    };

    const module = createMyModule({ apiClient: mockApiClient, logger: mockLogger });
    const registry = createRegistry([module]);

    // Test dispatch
    const result = await registry.dispatch({
      moduleId: 'my',
      actionId: 'action',
      args: {}
    });

    expect(result.ok).toBe(true);
    expect(mockApiClient.fetch).toHaveBeenCalled();
  });
});
```

## Package.json Scripts

```json
{
  "name": "mytool",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "mytool": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc && node dist/cli.js",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "lint": "eslint src",
    "prepublishOnly": "npm run build"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "exports": {
    ".": "./dist/index.js",
    "./cli": "./dist/cli.js"
  }
}
```

## TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```
