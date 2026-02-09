export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectPromptInput {
  message: string;
  options: MultiSelectOption[];
  initialValues?: string[];
}

export const runMultiSelectPrompt = async (input: MultiSelectPromptInput): Promise<string[]> => {
  if (input.options.length === 0) {
    throw new Error(`No options available for multiselect prompt: ${input.message}`);
  }

  if (input.initialValues && input.initialValues.length > 0) {
    return input.initialValues.filter((value) => input.options.some((option) => option.value === value));
  }

  return [input.options[0].value];
};
