export const renderOperationOutput = (summary: string, details: string[]): string =>
  [summary, ...details.map((line) => `- ${line}`)].join('\n');

export type SimpleInstallOp = 'install';

export const normalizeSimpleInstallOp = (raw: string): SimpleInstallOp => {
  const value = raw.trim().toLowerCase();
  if (value === 'install' || value === 'setup' || value === 'set') return 'install';
  throw new Error(`Unsupported operation "${raw}".`);
};
