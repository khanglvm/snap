import { text } from '@clack/prompts';
import { isInteractiveTerminal } from '../component-adapters/readline-utils.js';
import { unwrapClackResult } from '../component-adapters/cancel.js';

export interface CustomPromptInput<TValue = string> {
  message: string;
  defaultValue?: string;
  required?: boolean;
  signal?: AbortSignal;
  parse?: (raw: string) => TValue;
  validate?: (value: TValue) => string | undefined;
  onValue?: (value: TValue) => void;
  onSubmit?: (value: TValue) => void;
  onCancel?: () => void;
}

export interface CustomPromptRunner {
  run<TValue = string>(input: CustomPromptInput<TValue>): Promise<TValue>;
}

const toAbortError = (): Error => {
  const error = new Error('Prompt aborted.');
  error.name = 'AbortError';
  return error;
};

const assertNotAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw toAbortError();
  }
};

const defaultParse = <TValue>(raw: string): TValue => raw as TValue;

export const runCustomPrompt = async <TValue = string>(input: CustomPromptInput<TValue>): Promise<TValue> => {
  const parse = input.parse ?? defaultParse<TValue>;
  const fallback = input.defaultValue ?? '';

  const validateValue = (value: TValue): void => {
    const message = input.validate?.(value);
    if (message) throw new Error(message);
  };

  const parseAndValidate = (raw: string): TValue => {
    const parsed = parse(raw);
    validateValue(parsed);
    input.onValue?.(parsed);
    return parsed;
  };

  assertNotAborted(input.signal);

  if (!isInteractiveTerminal()) {
    if (input.required && fallback.trim().length === 0) {
      throw new Error(`Required value missing: ${input.message}`);
    }
    const value = parseAndValidate(fallback);
    input.onSubmit?.(value);
    return value;
  }

  const onAbort = (): void => {
    input.onCancel?.();
  };
  input.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const rawValue = await text({
      message: input.message,
      initialValue: input.defaultValue,
      validate: (value) => {
        if ((!value || value.length === 0) && input.required && fallback.trim().length === 0) {
          return `Required value missing: ${input.message}`;
        }

        try {
          parseAndValidate(value && value.length > 0 ? value : fallback);
          return undefined;
        } catch (error) {
          return error instanceof Error ? error.message : 'Invalid value';
        }
      },
      signal: input.signal
    });

    assertNotAborted(input.signal);
    const resolved = unwrapClackResult(rawValue);
    const value = parseAndValidate(resolved.length > 0 ? resolved : fallback);
    input.onSubmit?.(value);
    return value;
  } finally {
    input.signal?.removeEventListener('abort', onAbort);
  }
};

export const createCustomPromptRunner = (): CustomPromptRunner => ({
  run: runCustomPrompt
});
