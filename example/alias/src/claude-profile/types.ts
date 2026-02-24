export type ClaudeProfileOperation = 'list' | 'show' | 'upsert' | 'rename' | 'remove' | 'sync';

export interface ClaudeProfile {
  env: Record<string, string>;
  dangerouslySkipPermissions: boolean;
}

export type ClaudeProfileConfig = Record<string, ClaudeProfile>;

export interface ClaudeProfileOperationInput {
  op: ClaudeProfileOperation;
  name?: string;
  to?: string;
  env?: Record<string, string>;
  skipPermissions?: boolean;
}

export interface ClaudeProfileOperationResult {
  summary: string;
  details: string[];
}
