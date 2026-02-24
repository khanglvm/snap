import type { ClaudeProfileOperation } from './types.js';
import { validateEnvKey } from './validation.js';

export const parseEnvInput = (raw: string): Record<string, string> => {
  const source = raw.trim();
  if (source.length === 0) return {};

  if (source.startsWith('{')) {
    const parsed = JSON.parse(source) as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const validKey = validateEnvKey(key);
      if (value === null || value === undefined || String(value).trim().length === 0) continue;
      result[validKey] = String(value);
    }
    return result;
  }

  const result: Record<string, string> = {};
  const parts = source
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  for (const part of parts) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex <= 0) {
      throw new Error(`Invalid env segment "${part}". Use KEY=VALUE.`);
    }

    const key = validateEnvKey(part.slice(0, separatorIndex));
    const value = part.slice(separatorIndex + 1);
    if (value.trim().length === 0) continue;

    result[key] = value;
  }

  return result;
};

export const normalizeClaudeProfileOperation = (rawValue: string): ClaudeProfileOperation => {
  const value = rawValue.trim().toLowerCase();
  if (value === 'list') return 'list';
  if (value === 'show' || value === 'get') return 'show';
  if (value === 'upsert' || value === 'set' || value === 'add' || value === 'update' || value === 'create') return 'upsert';
  if (value === 'rename' || value === 'mv') return 'rename';
  if (value === 'remove' || value === 'delete' || value === 'rm') return 'remove';
  if (value === 'sync' || value === 'resync') return 'sync';
  throw new Error(`Unsupported operation "${rawValue}".`);
};
