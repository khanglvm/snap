import { CONFIG_FILE_PATH, RUNNER_SCRIPT_PATH } from './constants.js';
import { readClaudeProfileConfig, saveClaudeProfileConfig } from './config-store.js';
import { validateAliasName, validateEnvKey } from './validation.js';
import { renderProfileDetail, renderProfileList } from './render.js';
import { ensureRunnerScript, removeSingleAliasFromProfile, syncAllAliasesInProfile, syncSingleAliasInProfile } from './shell-sync.js';
import { detectShellProfile } from '../shared/shell-profile.js';
import type { ClaudeProfileOperationInput, ClaudeProfileOperationResult } from './types.js';

export const executeClaudeProfileOperation = async (
  input: ClaudeProfileOperationInput
): Promise<ClaudeProfileOperationResult> => {
  const op = input.op;
  const config = await readClaudeProfileConfig();

  if (op === 'list') {
    return {
      summary: 'Listed Claude profiles.',
      details: [renderProfileList(config), `config=${CONFIG_FILE_PATH}`]
    };
  }

  if (op === 'show') {
    const name = validateAliasName(input.name ?? '');
    const profile = config[name];
    if (!profile) {
      throw new Error(`Profile "${name}" does not exist.`);
    }

    return {
      summary: `Showed profile "${name}".`,
      details: [renderProfileDetail(name, profile), `config=${CONFIG_FILE_PATH}`]
    };
  }

  if (op === 'upsert') {
    const name = validateAliasName(input.name ?? '');
    const existing = config[name];
    const nextEnv = input.env ?? existing?.env ?? {};
    const nextSkip = input.skipPermissions ?? existing?.dangerouslySkipPermissions ?? true;

    config[name] = {
      env: Object.fromEntries(Object.entries(nextEnv).map(([key, value]) => [validateEnvKey(key), String(value)])),
      dangerouslySkipPermissions: nextSkip
    };

    await saveClaudeProfileConfig(config);
    await ensureRunnerScript();

    const shellProfile = await detectShellProfile();
    await syncSingleAliasInProfile(shellProfile.profilePath, name);

    return {
      summary: `Upserted profile "${name}".`,
      details: [
        `config=${CONFIG_FILE_PATH}`,
        `runner=${RUNNER_SCRIPT_PATH}`,
        `shell_profile=${shellProfile.profilePath}`
      ]
    };
  }

  if (op === 'rename') {
    const from = validateAliasName(input.name ?? '');
    const to = validateAliasName(input.to ?? '');

    if (from === to) {
      throw new Error('Rename target must be different from source alias.');
    }
    if (!config[from]) {
      throw new Error(`Profile "${from}" does not exist.`);
    }
    if (config[to]) {
      throw new Error(`Profile "${to}" already exists.`);
    }

    config[to] = config[from];
    delete config[from];

    await saveClaudeProfileConfig(config);
    await ensureRunnerScript();

    const shellProfile = await detectShellProfile();
    await removeSingleAliasFromProfile(shellProfile.profilePath, from);
    await syncSingleAliasInProfile(shellProfile.profilePath, to);

    return {
      summary: `Renamed profile "${from}" -> "${to}".`,
      details: [
        `config=${CONFIG_FILE_PATH}`,
        `runner=${RUNNER_SCRIPT_PATH}`,
        `shell_profile=${shellProfile.profilePath}`
      ]
    };
  }

  if (op === 'remove') {
    const name = validateAliasName(input.name ?? '');
    const existed = Boolean(config[name]);

    if (existed) {
      delete config[name];
      await saveClaudeProfileConfig(config);
    }

    const shellProfile = await detectShellProfile();
    await removeSingleAliasFromProfile(shellProfile.profilePath, name);

    return {
      summary: existed ? `Removed profile "${name}".` : `Profile "${name}" was already absent.`,
      details: [`config=${CONFIG_FILE_PATH}`, `shell_profile=${shellProfile.profilePath}`]
    };
  }

  if (op === 'sync') {
    await ensureRunnerScript();
    const shellProfile = await detectShellProfile();
    const targetName = input.name?.trim();

    if (targetName && targetName.length > 0) {
      const name = validateAliasName(targetName);
      if (!config[name]) {
        throw new Error(`Profile "${name}" does not exist.`);
      }
      await syncSingleAliasInProfile(shellProfile.profilePath, name);
      return {
        summary: `Synced profile "${name}" to shell.`,
        details: [`runner=${RUNNER_SCRIPT_PATH}`, `shell_profile=${shellProfile.profilePath}`]
      };
    }

    await syncAllAliasesInProfile(shellProfile.profilePath, Object.keys(config));
    return {
      summary: `Synced ${Object.keys(config).length} profile(s) to shell.`,
      details: [`runner=${RUNNER_SCRIPT_PATH}`, `shell_profile=${shellProfile.profilePath}`]
    };
  }

  throw new Error(`Unsupported operation "${op}".`);
};
