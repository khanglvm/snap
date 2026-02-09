import { fileURLToPath } from 'node:url';
import { createRegistry } from './index.js';
import sampleContentModule from './modules/sample-content/module.js';
import sampleSystemModule from './modules/sample-system/module.js';
import { dispatchAction } from './runtime/dispatch.js';
import { runHelpCommand } from './cli/help-command.js';

const parseCliArgs = (argv: string[]): { moduleId?: string; actionId?: string; args: Record<string, string | boolean> } => {
  const args: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (const token of argv) {
    if (token.startsWith('--')) {
      const body = token.slice(2);
      const separatorIndex = body.indexOf('=');
      if (separatorIndex === -1) {
        if (body.length > 0) args[body] = true;
      } else {
        const key = body.slice(0, separatorIndex);
        const value = body.slice(separatorIndex + 1);
        if (key.length > 0) args[key] = value;
      }
      continue;
    }
    positional.push(token);
  }

  return {
    moduleId: positional[0],
    actionId: positional[1],
    args
  };
};

const registry = createRegistry([sampleContentModule, sampleSystemModule]);

export const runCli = async (argv: string[], isTTY = Boolean(process.stdout.isTTY)): Promise<number> => {
  const wantsHelp = argv.includes('-h') || argv.includes('--help');
  const filtered = argv.filter((item) => item !== '-h' && item !== '--help');
  const parsed = parseCliArgs(filtered);

  if (wantsHelp || !parsed.moduleId) {
    const helpResult = runHelpCommand({
      registry,
      moduleId: parsed.moduleId,
      actionId: parsed.actionId
    });

    if (helpResult.data) process.stdout.write(`${helpResult.data}\n`);
    if (helpResult.errorMessage) process.stderr.write(`${helpResult.errorMessage}\n`);
    return helpResult.exitCode;
  }

  if (!parsed.actionId) {
    const helpResult = runHelpCommand({ registry, moduleId: parsed.moduleId });
    if (helpResult.data) process.stdout.write(`${helpResult.data}\n`);
    return helpResult.exitCode;
  }

  const result = await dispatchAction({
    registry,
    moduleId: parsed.moduleId,
    actionId: parsed.actionId,
    args: parsed.args,
    isTTY
  });

  if (result.data !== undefined) process.stdout.write(`${String(result.data)}\n`);
  if (result.errorMessage) process.stderr.write(`${result.errorMessage}\n`);
  return result.exitCode;
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCli(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : 'Unknown CLI error'}\n`);
      process.exitCode = 1;
    });
}
