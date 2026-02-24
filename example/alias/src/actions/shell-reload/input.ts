import { SnapArgs, type RuntimeContext } from '../../snap.js';
import { normalizeSimpleInstallOp } from '../common.js';
import { isPromptCancelled } from '../../tui/navigation.js';

export interface ShellReloadInstallInput {
  op: 'install';
  aliasName: string;
  overwrite: boolean;
}

export const parseShellReloadInstallCliInput = (args: SnapArgs.CliArgs): ShellReloadInstallInput => {
  const op = normalizeSimpleInstallOp(SnapArgs.readRequiredStringArg(args, 'op', 'Missing required arg: op'));

  return {
    op,
    aliasName: SnapArgs.readStringArg(args, 'name', 'alias') ?? 'rl',
    overwrite: SnapArgs.readBooleanArg(args, 'overwrite') ?? false
  };
};

export const collectShellReloadInstallTuiInput = async (context: RuntimeContext): Promise<ShellReloadInstallInput> => {
  while (true) {
    const op = normalizeSimpleInstallOp(
      await context.prompts.select({
        message: 'Shell reload action',
        options: [{ value: 'install', label: 'Install reload alias', hint: 'Create rl/src/reload function in shell profile' }]
      })
    );
    context.flow.next();

    try {
      const aliasName = await context.prompts.select({
        message: 'Alias name for shell reload',
        options: [
          { value: 'rl', label: 'rl (short and quick)', hint: 'Recommended default' },
          { value: 'src', label: 'src (source shortcut)', hint: 'Unix-style shorthand' },
          { value: 'reload', label: 'reload (descriptive)', hint: 'Most explicit name' }
        ],
        initialValue: 'rl'
      });

      context.flow.next();
      return { op, aliasName: aliasName.trim(), overwrite: false };
    } catch (error) {
      if (!isPromptCancelled(error)) {
        throw error;
      }
      context.flow.back();
    }
  }
};
