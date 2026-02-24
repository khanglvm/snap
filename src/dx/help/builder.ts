import type { HelpContract, HelpUseCaseSpec } from '../../core/contracts/help-contract.js';
import type { ArgSchemaMap } from './schema.js';
import { helpArgsFromArgSchema } from './schema.js';

export interface HelpBuilderInput<Key extends string> {
  summary: string;
  argSchema: ArgSchemaMap<Key>;
  examples?: string[];
  useCases?: HelpUseCaseSpec[];
  keybindings?: string[];
}

const DEFAULT_KEYBINDINGS = ['Enter confirm', 'Esc cancel'];

export const buildHelpFromArgSchema = <Key extends string>(input: HelpBuilderInput<Key>): HelpContract => {
  return {
    summary: input.summary,
    args: helpArgsFromArgSchema(input.argSchema),
    examples: input.examples ?? [],
    useCases: input.useCases ?? [],
    keybindings: input.keybindings ?? DEFAULT_KEYBINDINGS
  };
};
