import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

describe('e2e cli smoke', () => {
  it('prints help output from cli entry', () => {
    const projectRoot = resolve(__dirname, '../..');
    const tsxCli = resolve(projectRoot, 'node_modules/tsx/dist/cli.mjs');
    const cliEntry = resolve(projectRoot, 'src/cli-entry.ts');

    const result = spawnSync(process.execPath, [tsxCli, cliEntry, '-h'], {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('# HELP');
  });
});
