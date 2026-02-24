import { text } from '@clack/prompts';
import { isInteractiveTerminal } from './readline-utils.js';
import { unwrapClackResult } from './cancel.js';

export interface TextPromptInput {
  message: string;
  initialValue?: string;
  required?: boolean;
  placeholder?: string;
  validate?: (value: string) => string | Error | undefined;
}

export const runTextPrompt = async (input: TextPromptInput): Promise<string> => {
  const fallbackValue = input.initialValue ?? '';
  if (!isInteractiveTerminal()) {
    if (input.required && fallbackValue.trim().length === 0) {
      throw new Error(`Required text value missing: ${input.message}`);
    }
    return fallbackValue;
  }

  const value = await text({
    message: input.message,
    initialValue: input.initialValue,
    placeholder: input.placeholder,
    validate: (raw) => {
      if (input.required && (!raw || raw.trim().length === 0)) {
        return `Required text value missing: ${input.message}`;
      }
      return input.validate?.(raw ?? '');
    }
  });

  return unwrapClackResult(value);
};
