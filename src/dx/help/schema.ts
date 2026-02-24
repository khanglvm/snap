import type { CommandlineContract } from '../../core/contracts/action-contract.js';
import type { HelpArgumentSpec } from '../../core/contracts/help-contract.js';

export interface ArgSchema {
  description: string;
  example?: string;
  required?: boolean;
  includeInCommandline?: boolean;
  includeInHelp?: boolean;
  helpName?: string;
}

export type ArgSchemaMap<Key extends string = string> = Record<Key, ArgSchema>;

export const defineArgSchema = <Key extends string>(schema: ArgSchemaMap<Key>): ArgSchemaMap<Key> => schema;

export const commandlineFromArgSchema = <Key extends string>(schema: ArgSchemaMap<Key>): CommandlineContract => {
  const requiredArgs: string[] = [];
  const optionalArgs: string[] = [];

  for (const [name, spec] of Object.entries<ArgSchema>(schema)) {
    if (spec.includeInCommandline === false) continue;

    if (spec.required) {
      requiredArgs.push(name);
    } else {
      optionalArgs.push(name);
    }
  }

  return {
    requiredArgs,
    optionalArgs
  };
};

export const helpArgsFromArgSchema = <Key extends string>(schema: ArgSchemaMap<Key>): HelpArgumentSpec[] => {
  const results: HelpArgumentSpec[] = [];

  for (const [name, spec] of Object.entries<ArgSchema>(schema)) {
    if (spec.includeInHelp === false) continue;

    results.push({
      name: spec.helpName ?? name,
      required: Boolean(spec.required),
      description: spec.description,
      example: spec.example
    });
  }

  return results;
};
