import { multiselect } from '@clack/prompts';
import { isInteractiveTerminal } from './readline-utils.js';
import { unwrapClackResult } from './cancel.js';

export interface MultiSelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

export interface MultiSelectPromptInput {
  message: string;
  options: MultiSelectOption[];
  initialValues?: string[];
  required?: boolean;
  showInstructions?: boolean;
}

export const runMultiSelectPrompt = async (input: MultiSelectPromptInput): Promise<string[]> => {
  if (input.options.length === 0) {
    throw new Error(`No options available for multiselect prompt: ${input.message}`);
  }

  const defaultValues =
    input.initialValues && input.initialValues.length > 0
      ? input.initialValues.filter((value) => input.options.some((option) => option.value === value))
      : [input.options[0].value];

  if (!isInteractiveTerminal()) {
    return defaultValues;
  }

  const message = input.showInstructions === false
    ? input.message
    : `${input.message} (space to toggle, a to select all)`;

  const selected = await multiselect<string>({
    message,
    options: input.options.map((option) => ({
      value: option.value,
      label: option.label,
      hint: option.hint,
      disabled: option.disabled
    })),
    initialValues: defaultValues,
    required: input.required ?? false
  });

  return unwrapClackResult(selected);
};
