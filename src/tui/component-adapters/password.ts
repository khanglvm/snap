import { password as clackPassword } from '@clack/prompts';
import { isInteractiveTerminal } from './readline-utils.js';
import { unwrapClackResult } from './cancel.js';

export interface PasswordPromptInput {
  message: string;
  required?: boolean;
  validate?: (value: string) => string | Error | undefined;
  mask?: string;
}

export const runPasswordPrompt = async (input: PasswordPromptInput): Promise<string> => {
  if (!isInteractiveTerminal()) {
    // For non-interactive terminals, read from stdin in a secure way
    // or return empty/throw error
    if (input.required) {
      throw new Error(`Password required: ${input.message}`);
    }
    return '';
  }

  const value = await clackPassword({
    message: input.message,
    mask: input.mask ?? '•',
    validate: (raw) => {
      if (input.required && (!raw || raw.trim().length === 0)) {
        return `Password is required`;
      }
      return input.validate?.(raw ?? '');
    }
  });

  return unwrapClackResult(value);
};
