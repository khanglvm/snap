import { SnapArgs, SnapTui, type RuntimeContext } from '../../snap.js';
import {
  CLAUDE_PROFILE_LOGIN_ENV_KEYS,
  CLAUDE_PROFILE_NON_LOGIN_ENV_KEYS,
  buildOtherEnvVariableHelper,
  type ClaudeProfileConfig,
  type ClaudeProfileOperationInput,
  normalizeClaudeProfileOperation,
  parseEnvInput,
  readClaudeProfileConfig
} from '../../claude-profile/index.js';
import { isPromptCancelled } from '../../tui/navigation.js';

const RESERVED_OPTION_KEYS = new Set([
  'op',
  'name',
  'alias',
  'to',
  'new',
  'skip-permissions',
  'skipPermissions'
]);

type ClaudeLoginMode = 'api-key' | 'auth-token';

const [API_KEY_ENV_KEY, AUTH_TOKEN_ENV_KEY] = CLAUDE_PROFILE_LOGIN_ENV_KEYS;

const LOGIN_MODE_TO_ENV_KEY: Record<ClaudeLoginMode, string> = {
  'api-key': API_KEY_ENV_KEY,
  'auth-token': AUTH_TOKEN_ENV_KEY
};

const OTHER_LOGIN_ENV_KEY: Record<ClaudeLoginMode, string> = {
  'api-key': AUTH_TOKEN_ENV_KEY,
  'auth-token': API_KEY_ENV_KEY
};

const hasNonEmptyValue = (value: string | undefined): boolean => Boolean(value && value.trim().length > 0);

const resolveInitialLoginMode = (envValues: Record<string, string>): ClaudeLoginMode => {
  const hasApiKey = hasNonEmptyValue(envValues[API_KEY_ENV_KEY]);
  const hasAuthToken = hasNonEmptyValue(envValues[AUTH_TOKEN_ENV_KEY]);

  if (hasApiKey && !hasAuthToken) return 'api-key';
  if (hasAuthToken && !hasApiKey) return 'auth-token';
  return 'api-key';
};

const loginModeOptions = (preferredMode: ClaudeLoginMode): Array<{
  value: ClaudeLoginMode;
  label: string;
  hint: string;
}> => {
  const apiOption = {
    value: 'api-key' as const,
    label: 'API key',
    hint: `${API_KEY_ENV_KEY} (X-Api-Key header)`
  };
  const authOption = {
    value: 'auth-token' as const,
    label: 'Auth token',
    hint: `${AUTH_TOKEN_ENV_KEY} (Bearer Authorization header)`
  };

  return preferredMode === 'api-key' ? [apiOption, authOption] : [authOption, apiOption];
};

const focusedEnvKeysForMode = (loginMode: ClaudeLoginMode): string[] => [
  LOGIN_MODE_TO_ENV_KEY[loginMode],
  ...CLAUDE_PROFILE_NON_LOGIN_ENV_KEYS
];

export const parseClaudeProfileCliInput = (args: SnapArgs.CliArgs): ClaudeProfileOperationInput => {
  const op = normalizeClaudeProfileOperation(SnapArgs.readRequiredStringArg(args, 'op', 'Missing required arg: op'));
  const env = SnapArgs.collectUpperSnakeCaseEnvArgs({
    args,
    reservedKeys: RESERVED_OPTION_KEYS
  });

  return {
    op,
    name: SnapArgs.readStringArg(args, 'name', 'alias'),
    to: SnapArgs.readStringArg(args, 'to', 'new'),
    env: Object.keys(env).length > 0 ? env : undefined,
    skipPermissions: SnapArgs.readBooleanArg(args, 'skip-permissions', 'skipPermissions')
  };
};

const profileOptions = (config: ClaudeProfileConfig) =>
  Object.keys(config)
    .sort()
    .map((name) => ({
      value: name,
      label: name,
      hint: `${Object.keys(config[name].env).length} env var(s)`
    }));

const selectProfileName = async (
  context: RuntimeContext,
  message: string,
  config: ClaudeProfileConfig
): Promise<string | undefined> => {
  const options = profileOptions(config);
  if (options.length === 0) {
    SnapTui.backToPreviousOnNoResult({
      context,
      entityName: 'profiles'
    });
    return undefined;
  }

  return context.prompts.select({
    message,
    options
  });
};

const collectShowInput = async (
  context: RuntimeContext
): Promise<ClaudeProfileOperationInput | undefined> => {
  const config = await readClaudeProfileConfig();
  const name = await selectProfileName(context, 'Choose profile to view', config);
  if (!name) return undefined;
  context.flow.next();
  return { op: 'show', name };
};

const collectRemoveInput = async (
  context: RuntimeContext
): Promise<ClaudeProfileOperationInput | undefined> => {
  while (true) {
    const config = await readClaudeProfileConfig();
    const name = await selectProfileName(context, 'Choose profile to remove', config);
    if (!name) return undefined;
    context.flow.next();

    try {
      const confirmed = await context.prompts.confirm({
        message: `Remove "${name}"?`,
        initialValue: false
      });
      if (!confirmed) {
        context.flow.back();
        continue;
      }

      context.flow.next();
      return { op: 'remove', name };
    } catch (error) {
      if (!isPromptCancelled(error)) {
        throw error;
      }
      context.flow.back();
    }
  }
};

const collectRenameInput = async (
  context: RuntimeContext
): Promise<ClaudeProfileOperationInput | undefined> => {
  while (true) {
    const config = await readClaudeProfileConfig();
    const name = await selectProfileName(context, 'Choose profile to rename', config);
    if (!name) return undefined;
    context.flow.next();

    try {
      const to = await context.prompts.text({
        message: 'New alias name',
        required: true
      });

      context.flow.next();
      return { op: 'rename', name, to };
    } catch (error) {
      if (!isPromptCancelled(error)) {
        throw error;
      }
      context.flow.back();
    }
  }
};

const collectSyncInput = async (
  context: RuntimeContext
): Promise<ClaudeProfileOperationInput> => {
  const config = await readClaudeProfileConfig();
  const options = [
    { value: '__all__', label: 'Sync all profiles', hint: `Total profiles: ${Object.keys(config).length}` },
    ...profileOptions(config).map((option) => ({
      ...option,
      label: `Sync "${option.label}"`
    }))
  ];

  const selected = await context.prompts.select({
    message: 'Choose sync target',
    options
  });

  context.flow.next();
  if (selected === '__all__') {
    return { op: 'sync' };
  }
  return { op: 'sync', name: selected };
};

const collectFocusedEnvValues = async (
  context: RuntimeContext,
  envValues: Record<string, string>,
  focusedEnvKeys: readonly string[],
  startIndex: number
): Promise<void> => {
  if (focusedEnvKeys.length === 0) {
    return;
  }

  let index = Math.min(Math.max(startIndex, 0), focusedEnvKeys.length - 1);

  while (index < focusedEnvKeys.length) {
    const envKey = focusedEnvKeys[index];
    try {
      const value = await context.prompts.text({
        message: `${envKey} (empty to unset)`,
        initialValue: envValues[envKey] ?? ''
      });

      if (value.trim().length === 0) {
        delete envValues[envKey];
      } else {
        envValues[envKey] = value.trim();
      }

      index += 1;
    } catch (error) {
      if (!isPromptCancelled(error)) {
        throw error;
      }

      if (index === 0) {
        throw error;
      }

      index -= 1;
    }
  }
};

const collectUpsertInput = async (
  context: RuntimeContext
): Promise<ClaudeProfileOperationInput> => {
  while (true) {
    const config = await readClaudeProfileConfig();
    const existingOptions = profileOptions(config).map((option) => ({
      ...option,
      label: `Edit "${option.label}"`
    }));

    const target = await context.prompts.select({
      message: 'Choose profile to edit',
      options: [
        { value: '__new__', label: 'Create new profile', hint: 'Define a new alias profile' },
        ...existingOptions
      ]
    });
    context.flow.next();

    let aliasName = target;
    if (target === '__new__') {
      try {
        aliasName = await context.prompts.text({
          message: 'New alias name',
          initialValue: 'cc',
          required: true
        });
      } catch (error) {
        if (!isPromptCancelled(error)) {
          throw error;
        }
        context.flow.back();
        continue;
      }
    }

    const existing = config[aliasName.trim()];
    const envValues: Record<string, string> = { ...(existing?.env ?? {}) };
    let loginMode = resolveInitialLoginMode(envValues);

    envLoop: while (true) {
      try {
        loginMode = (await context.prompts.select({
          message: 'Choose login credential type',
          options: loginModeOptions(loginMode)
        })) as ClaudeLoginMode;
      } catch (error) {
        if (!isPromptCancelled(error)) {
          throw error;
        }
        context.flow.back();
        break;
      }

      const activeLoginEnvKey = LOGIN_MODE_TO_ENV_KEY[loginMode];
      const inactiveLoginEnvKey = OTHER_LOGIN_ENV_KEY[loginMode];
      const focusedEnvKeys = focusedEnvKeysForMode(loginMode);
      let envStartIndex = 0;
      delete envValues[inactiveLoginEnvKey];

      focusedEnvLoop: while (true) {
        try {
          await collectFocusedEnvValues(context, envValues, focusedEnvKeys, envStartIndex);
        } catch (error) {
          if (!isPromptCancelled(error)) {
            throw error;
          }
          continue envLoop;
        }

        context.terminal.line('');
        context.terminal.line('Other env variables:');
        context.terminal.lines(buildOtherEnvVariableHelper().split('\n'));

        let extraEnvInput = '';
        while (true) {
          try {
            extraEnvInput = await context.prompts.text({
              message: 'Other env pairs KEY=VALUE,comma-separated (optional)',
              required: false,
              initialValue: extraEnvInput
            });
          } catch (error) {
            if (!isPromptCancelled(error)) {
              throw error;
            }
            envStartIndex = Math.max(focusedEnvKeys.length - 1, 0);
            continue focusedEnvLoop;
          }

          try {
            const skipPermissions = await context.prompts.confirm({
              message: 'Enable --dangerously-skip-permissions?',
              initialValue: existing?.dangerouslySkipPermissions ?? true
            });

            if (extraEnvInput.trim().length > 0) {
              const parsed = parseEnvInput(extraEnvInput.trim());
              for (const [key, value] of Object.entries(parsed)) {
                envValues[key] = value;
              }
            }

            delete envValues[inactiveLoginEnvKey];
            if (!hasNonEmptyValue(envValues[activeLoginEnvKey])) {
              delete envValues[activeLoginEnvKey];
            }

            context.flow.next();
            return { op: 'upsert', name: aliasName.trim(), env: envValues, skipPermissions };
          } catch (error) {
            if (!isPromptCancelled(error)) {
              throw error;
            }
            continue;
          }
        }
      }
    }
  }
};

export const collectClaudeProfileTuiInput = async (context: RuntimeContext): Promise<ClaudeProfileOperationInput> => {
  while (true) {
    const op = normalizeClaudeProfileOperation(
      await context.prompts.select({
        message: 'Claude profile action',
        options: [
          { value: 'list', label: 'List profiles', hint: 'Show all configured profiles' },
          { value: 'show', label: 'Show one profile', hint: 'Display env for one profile' },
          { value: 'upsert', label: 'Create or update profile', hint: 'Set focused and custom env variables' },
          { value: 'rename', label: 'Rename profile', hint: 'Move profile name to a new key' },
          { value: 'remove', label: 'Remove profile', hint: 'Delete profile and shell bindings' },
          { value: 'sync', label: 'Sync profile(s) to shell', hint: 'Rewrite managed shell blocks' }
        ]
      })
    );
    context.flow.next();

    try {
      if (op === 'list') {
        const config = await readClaudeProfileConfig();
        if (Object.keys(config).length === 0) {
          SnapTui.backToPreviousOnNoResult({
            context,
            entityName: 'profiles'
          });
          continue;
        }
        return { op };
      }

      if (op === 'show') {
        const input = await collectShowInput(context);
        if (input) return input;
        continue;
      }

      if (op === 'remove') {
        const input = await collectRemoveInput(context);
        if (input) return input;
        continue;
      }

      if (op === 'rename') {
        const input = await collectRenameInput(context);
        if (input) return input;
        continue;
      }

      if (op === 'sync') {
        return await collectSyncInput(context);
      }

      return await collectUpsertInput(context);
    } catch (error) {
      if (!isPromptCancelled(error)) {
        throw error;
      }
      context.flow.back();
    }
  }
};
