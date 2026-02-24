import { promises as fs } from 'node:fs';

export const ensureFileExists = async (filePath: string): Promise<void> => {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '', 'utf8');
  }
};

export const normalizeTrailingNewlines = (content: string): string =>
  content.replace(/\s+$/g, '').concat('\n');

export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
