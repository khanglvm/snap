export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectPromptInput {
  message: string;
  options: SelectOption[];
  initialValue?: string;
}

export const runSelectPrompt = async (input: SelectPromptInput): Promise<string> => {
  const selected = input.initialValue ?? input.options[0]?.value;
  if (!selected) {
    throw new Error(`No options available for select prompt: ${input.message}`);
  }
  return selected;
};
