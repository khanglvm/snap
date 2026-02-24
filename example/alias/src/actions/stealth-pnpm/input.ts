import { SnapArgs, type RuntimeContext } from '../../snap.js';
import { normalizeSimpleInstallOp } from '../common.js';
import { isPromptCancelled } from '../../tui/navigation.js';

export interface StealthPnpmInstallInput {
  op: 'install';
  overwrite: boolean;
}

export const parseStealthPnpmInstallCliInput = (args: SnapArgs.CliArgs): StealthPnpmInstallInput => {
  const op = normalizeSimpleInstallOp(SnapArgs.readRequiredStringArg(args, 'op', 'Missing required arg: op'));

  return {
    op,
    overwrite: SnapArgs.readBooleanArg(args, 'overwrite') ?? false
  };
};

export const collectStealthPnpmInstallTuiInput = async (context: RuntimeContext): Promise<StealthPnpmInstallInput> => {
  while (true) {
    const op = normalizeSimpleInstallOp(
      await context.prompts.select({
        message: 'Stealth pnpm action',
        options: [{ value: 'install', label: 'Install di/da/dr aliases', hint: 'Fast install/remove/add shortcuts' }]
      })
    );
    context.flow.next();

    try {
      const confirmed = await context.prompts.confirm({
        message: 'Install stealth pnpm aliases (di, da, dr)?',
        initialValue: true
      });

      if (!confirmed) {
        context.flow.back();
        continue;
      }

      context.flow.next();
      return { op, overwrite: false };
    } catch (error) {
      if (!isPromptCancelled(error)) {
        throw error;
      }
      context.flow.back();
    }
  }
};
