export interface TextPromptInput {
  message: string;
  initialValue?: string;
  required?: boolean;
}

export const runTextPrompt = async (input: TextPromptInput): Promise<string> => {
  const value = input.initialValue ?? '';
  if (input.required && value.trim().length === 0) {
    throw new Error(`Required text value missing: ${input.message}`);
  }
  return value;
};
