import { select } from '@clack/prompts';
import { isInteractiveTerminal } from './readline-utils.js';
import { unwrapClackResult } from './cancel.js';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export interface SelectPromptInput {
  message: string;
  options: SelectOption[];
  initialValue?: string;
}

export const runSelectPrompt = async (input: SelectPromptInput): Promise<string> => {
  if (input.options.length === 0) {
    throw new Error(`No options available for select prompt: ${input.message}`);
  }

  const initialValue =
    input.initialValue && input.options.some((option) => option.value === input.initialValue)
      ? input.initialValue
      : undefined;
  const defaultValue = initialValue ?? input.options[0]?.value;
  if (!defaultValue) {
    throw new Error(`No options available for select prompt: ${input.message}`);
  }

  if (!isInteractiveTerminal()) {
    return defaultValue;
  }

  const selection = await select<string>({
    message: input.message,
    options: input.options.map((option) => ({
      value: option.value,
      label: option.label,
      hint: option.hint,
      disabled: option.disabled
    })),
    initialValue: defaultValue
  });

  return unwrapClackResult(selection);
};
