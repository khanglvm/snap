import type { CliArgs } from './types.js';

export const readStringArg = (args: CliArgs, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = args[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

export const readRequiredStringArg = (args: CliArgs, key: string, message?: string): string => {
  const value = readStringArg(args, key);
  if (!value) {
    throw new Error(message ?? `Missing required arg: ${key}`);
  }
  return value;
};

export const parseBooleanLike = (value: string | boolean | undefined): boolean | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;

  throw new Error(`Invalid boolean value "${value}".`);
};

export const readBooleanArg = (args: CliArgs, ...keys: string[]): boolean | undefined => {
  for (const key of keys) {
    if (args[key] === undefined) continue;
    return parseBooleanLike(args[key]);
  }
  return undefined;
};
