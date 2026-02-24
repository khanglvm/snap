import type { ActionResultEnvelope } from '../core/contracts/action-contract.js';
import type { ActionRegistry } from '../core/registry/action-registry.js';
import type { CliArgs } from '../dx/args/index.js';
import { createTerminalOutput } from '../dx/terminal/index.js';
import { dispatchAction } from '../runtime/dispatch.js';
import { runHelpCommand } from './help-command.js';

export interface ParsedCliInput {
  wantsHelp: boolean;
  positional: string[];
  args: CliArgs;
}

export interface RunMultiModuleCliInput {
  registry: ActionRegistry;
  argv: string[];
  isTTY?: boolean;
}

export interface RunSingleModuleCliInput {
  registry: ActionRegistry;
  argv: string[];
  moduleId: string;
  defaultActionId?: string;
  helpDefaultTarget?: 'module' | 'action';
  isTTY?: boolean;
}

export interface SubmoduleRoute {
  moduleId: string;
  defaultActionId?: string;
  helpDefaultTarget?: 'module' | 'action';
  aliases?: string[];
}

export interface RunSubmoduleCliInput {
  registry: ActionRegistry;
  argv: string[];
  submodules: SubmoduleRoute[];
  defaultSubmoduleId?: string;
  isTTY?: boolean;
}

const writeEnvelope = (envelope: ActionResultEnvelope): number => {
  const terminal = createTerminalOutput();
  if (envelope.data !== undefined) terminal.line(String(envelope.data));
  if (envelope.errorMessage) terminal.error(envelope.errorMessage);
  return envelope.exitCode;
};

interface RunSingleFromParsedInput {
  registry: ActionRegistry;
  parsed: ParsedCliInput;
  moduleId: string;
  defaultActionId?: string;
  helpDefaultTarget?: 'module' | 'action';
  isTTY: boolean;
}

const runSingleFromParsed = async (input: RunSingleFromParsedInput): Promise<number> => {
  const helpDefaultTarget = input.helpDefaultTarget ?? 'module';
  const explicitActionId =
    input.parsed.positional[0] === input.moduleId
      ? input.parsed.positional[1]
      : input.parsed.positional[0];

  if (input.parsed.wantsHelp) {
    const helpActionId =
      explicitActionId ?? (helpDefaultTarget === 'action' ? input.defaultActionId : undefined);

    return writeEnvelope(
      runHelpCommand({
        registry: input.registry,
        moduleId: input.moduleId,
        actionId: helpActionId
      })
    );
  }

  const actionId = explicitActionId ?? input.defaultActionId;
  if (!actionId) {
    return writeEnvelope(
      runHelpCommand({
        registry: input.registry,
        moduleId: input.moduleId
      })
    );
  }

  const result = await dispatchAction({
    registry: input.registry,
    moduleId: input.moduleId,
    actionId,
    args: input.parsed.args,
    isTTY: input.isTTY
  });

  return writeEnvelope(result);
};

const findSubmoduleRoute = (routes: SubmoduleRoute[], token?: string): SubmoduleRoute | undefined => {
  if (!token) return undefined;
  return routes.find(
    (route) => route.moduleId === token || (route.aliases !== undefined && route.aliases.includes(token))
  );
};

export const parseCliInput = (argv: string[]): ParsedCliInput => {
  const positional: string[] = [];
  const args: CliArgs = {};
  let wantsHelp = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '-h' || token === '--help') {
      wantsHelp = true;
      continue;
    }

    if (token === '--') {
      positional.push(...argv.slice(index + 1));
      break;
    }

    if (token.startsWith('--')) {
      const body = token.slice(2);
      const separatorIndex = body.indexOf('=');

      if (separatorIndex >= 0) {
        const key = body.slice(0, separatorIndex);
        const value = body.slice(separatorIndex + 1);
        if (key.length > 0) args[key] = value;
        continue;
      }

      if (body.length === 0) continue;
      const next = argv[index + 1];
      if (next !== undefined && !next.startsWith('-')) {
        args[body] = next;
        index += 1;
      } else {
        args[body] = true;
      }
      continue;
    }

    positional.push(token);
  }

  return { wantsHelp, positional, args };
};

export const runMultiModuleCli = async (input: RunMultiModuleCliInput): Promise<number> => {
  const parsed = parseCliInput(input.argv);
  const moduleId = parsed.positional[0];
  const actionId = parsed.positional[1];
  const isTTY = input.isTTY ?? Boolean(process.stdout.isTTY);

  if (parsed.wantsHelp || !moduleId) {
    return writeEnvelope(
      runHelpCommand({
        registry: input.registry,
        moduleId,
        actionId
      })
    );
  }

  if (!actionId) {
    return writeEnvelope(
      runHelpCommand({
        registry: input.registry,
        moduleId
      })
    );
  }

  const result = await dispatchAction({
    registry: input.registry,
    moduleId,
    actionId,
    args: parsed.args,
    isTTY
  });

  return writeEnvelope(result);
};

export const runSingleModuleCli = async (input: RunSingleModuleCliInput): Promise<number> => {
  const parsed = parseCliInput(input.argv);
  const isTTY = input.isTTY ?? Boolean(process.stdout.isTTY);
  return runSingleFromParsed({
    registry: input.registry,
    parsed,
    moduleId: input.moduleId,
    defaultActionId: input.defaultActionId,
    helpDefaultTarget: input.helpDefaultTarget,
    isTTY
  });
};

export const runSubmoduleCli = async (input: RunSubmoduleCliInput): Promise<number> => {
  const parsed = parseCliInput(input.argv);
  const isTTY = input.isTTY ?? Boolean(process.stdout.isTTY);
  const firstToken = parsed.positional[0];
  const matchedRoute = findSubmoduleRoute(input.submodules, firstToken);

  if (matchedRoute) {
    return runSingleFromParsed({
      registry: input.registry,
      parsed: {
        ...parsed,
        positional: parsed.positional.slice(1)
      },
      moduleId: matchedRoute.moduleId,
      defaultActionId: matchedRoute.defaultActionId,
      helpDefaultTarget: matchedRoute.helpDefaultTarget,
      isTTY
    });
  }

  if (!parsed.wantsHelp && parsed.positional.length === 0 && input.defaultSubmoduleId) {
    const defaultRoute = findSubmoduleRoute(input.submodules, input.defaultSubmoduleId);
    if (defaultRoute) {
      return runSingleFromParsed({
        registry: input.registry,
        parsed,
        moduleId: defaultRoute.moduleId,
        defaultActionId: defaultRoute.defaultActionId,
        helpDefaultTarget: defaultRoute.helpDefaultTarget,
        isTTY
      });
    }
  }

  return runMultiModuleCli({
    registry: input.registry,
    argv: input.argv,
    isTTY
  });
};
