import type { CliArgs } from './types.js';
import { isUpperSnakeCaseKey } from './types.js';

export interface CollectEnvArgsInput {
  args: CliArgs;
  reservedKeys?: Iterable<string>;
}

export const collectUpperSnakeCaseEnvArgs = (input: CollectEnvArgsInput): Record<string, string> => {
  const reserved = new Set(input.reservedKeys ?? []);
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(input.args)) {
    if (reserved.has(key)) continue;
    if (!isUpperSnakeCaseKey(key)) continue;
    if (typeof value !== 'string' || value.length === 0) continue;

    env[key] = value;
  }

  return env;
};
