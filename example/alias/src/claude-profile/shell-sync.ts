import { promises as fs } from 'node:fs';
import { PROFILE_BLOCK_PREFIX, PROFILE_BLOCK_SUFFIX, RUNNER_SCRIPT_CONTENT, RUNNER_SCRIPT_PATH } from './constants.js';
import { ensureFileExists, escapeRegExp, normalizeTrailingNewlines } from '../shared/file-utils.js';

const profileBlockStart = (aliasName: string): string => `${PROFILE_BLOCK_PREFIX}${aliasName} >>>`;
const profileBlockEnd = (aliasName: string): string => `${PROFILE_BLOCK_SUFFIX}${aliasName} <<<`;

const toManagedAliasBlock = (aliasName: string): string => {
  const startMarker = profileBlockStart(aliasName);
  const endMarker = profileBlockEnd(aliasName);

  return `${startMarker}
if alias ${aliasName} >/dev/null 2>&1; then
  unalias ${aliasName}
fi

${aliasName}() {
  local script_path="$HOME/.claude-alias-runner.js"
  local cmd_str

  if [ ! -f "$script_path" ]; then
    claude "$@"
    return $?
  fi

  cmd_str=$(node "$script_path" "${aliasName}" 2>/dev/null)
  local exit_code=$?

  if [ "$exit_code" -eq 0 ] && [ -n "$cmd_str" ]; then
    eval "$cmd_str \\\"\\$@\\\""
  else
    claude "$@"
  fi
}
${endMarker}
`;
};

const removeAliasBlockFromContent = (content: string, aliasName: string): string => {
  const start = escapeRegExp(profileBlockStart(aliasName));
  const end = escapeRegExp(profileBlockEnd(aliasName));
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}\\n?`, 'g');
  return content.replace(pattern, '');
};

const removeAllManagedBlocksFromContent = (content: string): string => {
  const pattern = new RegExp(
    `${escapeRegExp(PROFILE_BLOCK_PREFIX)}[A-Za-z_][A-Za-z0-9_]* >>>[\\s\\S]*?${escapeRegExp(PROFILE_BLOCK_SUFFIX)}[A-Za-z_][A-Za-z0-9_]* <<<\\n?`,
    'g'
  );
  return content.replace(pattern, '');
};

export const ensureRunnerScript = async (): Promise<void> => {
  await fs.writeFile(RUNNER_SCRIPT_PATH, RUNNER_SCRIPT_CONTENT, { encoding: 'utf8', mode: 0o755 });
};

export const syncSingleAliasInProfile = async (profilePath: string, aliasName: string): Promise<void> => {
  await ensureFileExists(profilePath);
  const current = await fs.readFile(profilePath, 'utf8');
  const withoutAlias = removeAliasBlockFromContent(current, aliasName);
  const next = normalizeTrailingNewlines(`${withoutAlias}\n${toManagedAliasBlock(aliasName)}`);
  await fs.writeFile(profilePath, next, 'utf8');
};

export const removeSingleAliasFromProfile = async (profilePath: string, aliasName: string): Promise<void> => {
  await ensureFileExists(profilePath);
  const current = await fs.readFile(profilePath, 'utf8');
  const next = normalizeTrailingNewlines(removeAliasBlockFromContent(current, aliasName));
  await fs.writeFile(profilePath, next, 'utf8');
};

export const syncAllAliasesInProfile = async (profilePath: string, aliasNames: string[]): Promise<void> => {
  await ensureFileExists(profilePath);
  const current = await fs.readFile(profilePath, 'utf8');
  const cleaned = normalizeTrailingNewlines(removeAllManagedBlocksFromContent(current));

  const blocks = aliasNames
    .sort((a, b) => a.localeCompare(b))
    .map((name) => toManagedAliasBlock(name))
    .join('\n');

  const next = blocks.length > 0 ? normalizeTrailingNewlines(`${cleaned}\n${blocks}`) : cleaned;
  await fs.writeFile(profilePath, next, 'utf8');
};
