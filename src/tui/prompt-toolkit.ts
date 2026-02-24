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
import { createCustomPromptRunner, type CustomPromptInput } from './custom/custom-prompt.js';

export interface PromptToolkit {
  text(input: TextPromptInput): Promise<string>;
  confirm(input: ConfirmPromptInput): Promise<boolean>;
  select(input: SelectPromptInput): Promise<string>;
  multiselect(input: MultiSelectPromptInput): Promise<string[]>;
  group<T = unknown>(steps: GroupStep<T>[]): Promise<Record<string, T>>;
  custom<T>(input: CustomPromptInput<T>): Promise<T>;
}

export const createPromptToolkit = (): PromptToolkit => {
  const customRunner = createCustomPromptRunner();

  return {
    text: runTextPrompt,
    confirm: runConfirmPrompt,
    select: runSelectPrompt,
    multiselect: runMultiSelectPrompt,
    group: runGroupPrompt,
    custom: customRunner.run
  };
};
