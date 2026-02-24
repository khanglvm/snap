import type { ClaudeProfile, ClaudeProfileConfig } from './types.js';

export const renderProfileList = (config: ClaudeProfileConfig): string => {
  const names = Object.keys(config).sort((a, b) => a.localeCompare(b));
  if (names.length === 0) {
    return 'No Claude profiles configured.';
  }

  return names
    .map((name) => {
      const envCount = Object.keys(config[name].env).length;
      const skip = config[name].dangerouslySkipPermissions ? 'on' : 'off';
      return `${name}: env=${envCount}, skip_permissions=${skip}`;
    })
    .join('\n');
};

export const renderProfileDetail = (name: string, profile: ClaudeProfile): string => {
  const envRows = Object.entries(profile.env)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);

  const envText = envRows.length > 0 ? envRows.join('\n') : '(none)';

  return [
    `name=${name}`,
    `skip_permissions=${profile.dangerouslySkipPermissions ? 'true' : 'false'}`,
    'env:',
    envText
  ].join('\n');
};
