import { homedir } from 'node:os';
import path from 'node:path';

export const CONFIG_FILE_PATH = path.join(homedir(), '.claude-alias.json');
export const RUNNER_SCRIPT_PATH = path.join(homedir(), '.claude-alias-runner.js');
export const PROFILE_BLOCK_PREFIX = '# >>> snap-claude-profile:';
export const PROFILE_BLOCK_SUFFIX = '# <<< snap-claude-profile:';

export const RUNNER_SCRIPT_CONTENT = `'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const aliasName = process.argv[2];

const shellQuote = (value) => {
  return "'" + String(value).replace(/'/g, "'\\\\''") + "'";
};

const isValidEnvKey = (value) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);

try {
  const configPath = path.join(os.homedir(), '.claude-alias.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  const profile = config[aliasName];

  if (!profile) {
    process.exit(1);
  }

  const envEntries = Object.entries(profile.env || {})
    .filter(([key]) => isValidEnvKey(key))
    .map(([key, value]) => key + '=' + shellQuote(value));

  const parts = ['env', ...envEntries, 'claude'];
  if (profile.dangerouslySkipPermissions) {
    parts.push('--dangerously-skip-permissions');
  }

  process.stdout.write(parts.join(' '));
} catch {
  process.exit(1);
}
`;
