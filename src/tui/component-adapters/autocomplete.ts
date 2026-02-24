import { autocomplete as clackAutocomplete } from '@clack/prompts';
import { isInteractiveTerminal } from './readline-utils.js';
import { unwrapClackResult } from './cancel.js';

export interface AutocompleteOption {
  value: string;
  label: string;
  hint?: string;
}

export interface AutocompleteInput {
  message: string;
  options: AutocompleteOption[];
  placeholder?: string;
  initialValue?: string;
  maxItems?: number;
  required?: boolean;
  validate?: (value: string) => string | Error | undefined;
}

export const runAutocompletePrompt = async (
  input: AutocompleteInput
): Promise<string | undefined> => {
  if (!isInteractiveTerminal()) {
    // Non-interactive: return initial value or first option
    return input.initialValue ?? input.options[0]?.value;
  }

  const value = await clackAutocomplete({
    message: input.message,
    options: input.options,
    placeholder: input.placeholder,
    initialValue: input.initialValue,
    maxItems: input.maxItems,
    validate: (raw) => {
      // Handle string | string[] | undefined from clack
      const valueToValidate = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] ?? '' : '';

      if (input.required && !valueToValidate) {
        return 'This field is required';
      }
      if (input.validate) {
        const validationResult = input.validate(valueToValidate);
        if (typeof validationResult === 'string') {
          return validationResult;
        }
        if (validationResult instanceof Error) {
          return validationResult.message;
        }
      }
      return undefined;
    }
  });

  return unwrapClackResult(value);
};
