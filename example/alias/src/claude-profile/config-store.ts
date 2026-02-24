import { promises as fs } from 'node:fs';
import { CONFIG_FILE_PATH } from './constants.js';
import type { ClaudeProfileConfig } from './types.js';
import { isValidAliasName, isValidEnvKey } from './validation.js';

export const readClaudeProfileConfig = async (): Promise<ClaudeProfileConfig> => {
  try {
    const raw = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const config: ClaudeProfileConfig = {};

    for (const [aliasName, entry] of Object.entries(parsed)) {
      if (!isValidAliasName(aliasName)) continue;
      if (!entry || typeof entry !== 'object') continue;

      const profile = entry as Record<string, unknown>;
      const envValue = profile.env;
      const skipValue = profile.dangerouslySkipPermissions;
      const env: Record<string, string> = {};

      if (envValue && typeof envValue === 'object') {
        for (const [key, value] of Object.entries(envValue as Record<string, unknown>)) {
          if (!isValidEnvKey(key)) continue;
          if (value === null || value === undefined || String(value).trim().length === 0) continue;
          env[key] = String(value);
        }
      }

      config[aliasName] = {
        env,
        dangerouslySkipPermissions: typeof skipValue === 'boolean' ? skipValue : true
      };
    }

    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
};

export const saveClaudeProfileConfig = async (config: ClaudeProfileConfig): Promise<void> => {
  const stable: ClaudeProfileConfig = {};

  for (const aliasName of Object.keys(config).sort()) {
    stable[aliasName] = {
      env: Object.fromEntries(
        Object.entries(config[aliasName].env)
          .filter(([key, value]) => key.trim().length > 0 && String(value).trim().length > 0)
          .sort(([a], [b]) => a.localeCompare(b))
      ),
      dangerouslySkipPermissions: Boolean(config[aliasName].dangerouslySkipPermissions)
    };
  }

  await fs.writeFile(CONFIG_FILE_PATH, `${JSON.stringify(stable, null, 2)}\n`, 'utf8');
};
