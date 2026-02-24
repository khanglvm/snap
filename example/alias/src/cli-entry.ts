import { fileURLToPath } from 'node:url';
import { createRegistry, SnapTerminal, runSubmoduleCli } from './snap.js';
import { aliasApp } from './app.js';
import { runAliasHomeTui } from './tui/home.js';
import { installCtrlCExitShortcut, waitForAnyKeyToContinue, waitForAnyKeyToGoBack } from './tui/navigation.js';

const registry = createRegistry(aliasApp.modules);
const INTERRUPTED_EXIT_CODE = 130;

export const runCli = async (argv: string[], isTTY?: boolean): Promise<number> => {
  const interactive = isTTY ?? Boolean(process.stdout.isTTY);
  if (interactive) {
    installCtrlCExitShortcut();
  }

  if (argv.length === 0) {
    if (interactive) {
      let lastExitCode = 0;
      let activeModuleId: string | undefined;

      while (true) {
        if (!activeModuleId) {
          const selection = await runAliasHomeTui({ modules: aliasApp.modules });
          if (!selection) {
            continue;
          }
          activeModuleId = selection.moduleId;
        }

        lastExitCode = await runSubmoduleCli({
          registry,
          argv: [activeModuleId],
          isTTY: interactive,
          submodules: aliasApp.submodules,
          defaultSubmoduleId: aliasApp.defaultSubmoduleId
        });

        if (lastExitCode === INTERRUPTED_EXIT_CODE) {
          activeModuleId = undefined;
          continue;
        }

        if (lastExitCode === 0) {
          await waitForAnyKeyToContinue();
        } else {
          await waitForAnyKeyToGoBack();
        }
      }
    }

    return runSubmoduleCli({
      registry,
      argv: ['-h'],
      isTTY: interactive,
      submodules: aliasApp.submodules,
      defaultSubmoduleId: aliasApp.defaultSubmoduleId
    });
  }

  return runSubmoduleCli({
    registry,
    argv,
    isTTY: interactive,
    submodules: aliasApp.submodules,
    defaultSubmoduleId: aliasApp.defaultSubmoduleId
  });
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const terminal = SnapTerminal.createTerminalOutput();
  runCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      terminal.error(error instanceof Error ? error.message : 'Unknown CLI error');
      process.exitCode = 1;
    });
}
