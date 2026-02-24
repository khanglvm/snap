import { fileURLToPath } from 'node:url';
import { createRegistry } from './index.js';
import sampleContentModule from './modules/sample-content/module.js';
import sampleSystemModule from './modules/sample-system/module.js';
import { runMultiModuleCli } from './cli/cli-runner.js';
import { createTerminalOutput } from './dx/terminal/index.js';

const registry = createRegistry([sampleContentModule, sampleSystemModule]);

export const runCli = async (argv: string[], isTTY?: boolean): Promise<number> => {
  return runMultiModuleCli({ registry, argv, isTTY });
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const terminal = createTerminalOutput();
  runCli(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      terminal.error(error instanceof Error ? error.message : 'Unknown CLI error');
      process.exitCode = 1;
    });
}
