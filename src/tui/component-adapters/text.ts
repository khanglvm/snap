import { text } from '@clack/prompts';
import { isInteractiveTerminal } from './readline-utils.js';
import { unwrapClackResult } from './cancel.js';
import { createMultilineTextPrompt } from './multiline-text.js';

export interface TextPromptInput {
  message: string;
  initialValue?: string;
  required?: boolean;
  placeholder?: string;
  validate?: (value: string) => string | Error | undefined;
  /** Enable paste support for text input. When true, allows pasting single or multiple lines of text. */
  paste?: boolean;
  /** When paste is enabled, allow multiple lines of input. Defaults to true when paste is enabled. */
  multiline?: boolean;
}

export const runTextPrompt = async (input: TextPromptInput): Promise<string> => {
  const fallbackValue = input.initialValue ?? '';
  if (!isInteractiveTerminal()) {
    if (input.required && fallbackValue.trim().length === 0) {
      throw new Error(`Required text value missing: ${input.message}`);
    }
    return fallbackValue;
  }

  // Use multiline prompt when paste is enabled or multiline is explicitly requested
  if (input.paste || input.multiline) {
    const multilinePrompt = createMultilineTextPrompt();
    const value = await multilinePrompt({
      message: input.message,
      initialValue: input.initialValue,
      placeholder: input.placeholder,
      validate: (raw) => {
        if (input.required && (!raw || raw.trim().length === 0)) {
          return `Required text value missing: ${input.message}`;
        }
        return input.validate?.(raw ?? '');
      },
      allowPaste: input.paste ?? false
    });

    return unwrapClackResult(value);
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
