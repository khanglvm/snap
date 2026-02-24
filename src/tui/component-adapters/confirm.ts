import { confirm } from '@clack/prompts';
import { isInteractiveTerminal } from './readline-utils.js';
import { unwrapClackResult } from './cancel.js';

export interface ConfirmPromptInput {
  message: string;
  initialValue?: boolean;
  active?: string;
  inactive?: string;
}

export const runConfirmPrompt = async (input: ConfirmPromptInput): Promise<boolean> => {
  const fallback = input.initialValue ?? true;
  if (!isInteractiveTerminal()) return fallback;

  const value = await confirm({
    message: input.message,
    initialValue: fallback,
    active: input.active,
    inactive: input.inactive
  });

  return unwrapClackResult(value);
};
