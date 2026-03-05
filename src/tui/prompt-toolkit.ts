import type { ConfirmPromptInput } from './component-adapters/confirm.js';
import { runConfirmPrompt } from './component-adapters/confirm.js';
import type { GroupStep } from './component-adapters/group.js';
import { runGroupPrompt } from './component-adapters/group.js';
import type { MultiSelectPromptInput } from './component-adapters/multiselect.js';
import { runMultiSelectPrompt } from './component-adapters/multiselect.js';
import type { SelectPromptInput } from './component-adapters/select.js';
import { runSelectPrompt } from './component-adapters/select.js';
import type { TextPromptInput } from './component-adapters/text.js';
import { runTextPrompt } from './component-adapters/text.js';
import {
  isPromptCancelledError,
  PromptCancelledError,
  PromptRetryError
} from './component-adapters/cancel.js';
import { createCustomPromptRunner, type CustomPromptInput } from './custom/custom-prompt.js';

export interface PromptToolkit {
  text(input: TextPromptInput): Promise<string>;
  confirm(input: ConfirmPromptInput): Promise<boolean>;
  select(input: SelectPromptInput): Promise<string>;
  multiselect(input: MultiSelectPromptInput): Promise<string[]>;
  group<T = unknown>(steps: GroupStep<T>[]): Promise<Record<string, T>>;
  custom<T>(input: CustomPromptInput<T>): Promise<T>;
}

export type PromptCancelDecision = 'cancel' | 'retry';

interface PromptToolkitAdapters {
  text: (input: TextPromptInput) => Promise<string>;
  confirm: (input: ConfirmPromptInput) => Promise<boolean>;
  select: (input: SelectPromptInput) => Promise<string>;
  multiselect: (input: MultiSelectPromptInput) => Promise<string[]>;
  group: <T = unknown>(steps: GroupStep<T>[]) => Promise<Record<string, T>>;
  custom: <T>(input: CustomPromptInput<T>) => Promise<T>;
}

export interface PromptToolkitOptions {
  onPromptResolved?: () => void | Promise<void>;
  onPromptCancelled?: (error: PromptCancelledError) => PromptCancelDecision | void | Promise<PromptCancelDecision | void>;
  adapters?: Partial<PromptToolkitAdapters>;
}

const withPromptLifecycle = <TInput, TOutput>(
  runner: (input: TInput) => Promise<TOutput>,
  options: PromptToolkitOptions
) => {
  return async (input: TInput): Promise<TOutput> => {
    try {
      const value = await runner(input);
      await options.onPromptResolved?.();
      return value;
    } catch (error) {
      if (isPromptCancelledError(error)) {
        const decision = await options.onPromptCancelled?.(error);
        if (decision === 'retry') {
          throw new PromptRetryError();
        }
      }
      throw error;
    }
  };
};

export const createPromptToolkit = (options: PromptToolkitOptions = {}): PromptToolkit => {
  const customRunner = createCustomPromptRunner();
  const adapters: PromptToolkitAdapters = {
    text: options.adapters?.text ?? runTextPrompt,
    confirm: options.adapters?.confirm ?? runConfirmPrompt,
    select: options.adapters?.select ?? runSelectPrompt,
    multiselect: options.adapters?.multiselect ?? runMultiSelectPrompt,
    group: options.adapters?.group ?? runGroupPrompt,
    custom: options.adapters?.custom ?? customRunner.run
  };

  return {
    text: withPromptLifecycle(adapters.text, options),
    confirm: withPromptLifecycle(adapters.confirm, options),
    select: withPromptLifecycle(adapters.select, options),
    multiselect: withPromptLifecycle(adapters.multiselect, options),
    group: withPromptLifecycle(adapters.group, options),
    custom: withPromptLifecycle(adapters.custom, options)
  };
};
