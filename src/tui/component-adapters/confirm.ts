export interface ConfirmPromptInput {
  message: string;
  initialValue?: boolean;
}

export const runConfirmPrompt = async (input: ConfirmPromptInput): Promise<boolean> => {
  return input.initialValue ?? true;
};
