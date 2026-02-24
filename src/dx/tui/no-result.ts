import type { FlowController } from '../runtime/index.js';
import type { TerminalOutput } from '../terminal/index.js';

export interface NoResultBackContext {
  flow: Pick<FlowController, 'back'>;
  terminal: Pick<TerminalOutput, 'line'>;
}

export interface NoResultBackInput {
  context: NoResultBackContext;
  entityName?: string;
  message?: string;
}

const DEFAULT_NO_RESULT_MESSAGE = 'No results found.';

const normalizeEntityName = (entityName: string | undefined): string | undefined => {
  if (entityName === undefined) return undefined;
  const normalized = entityName.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export const formatNoResultMessage = (entityName?: string): string => {
  const normalizedEntityName = normalizeEntityName(entityName);
  if (!normalizedEntityName) return DEFAULT_NO_RESULT_MESSAGE;
  return `No ${normalizedEntityName} found.`;
};

export const backToPreviousOnNoResult = (input: NoResultBackInput): void => {
  const message = input.message?.trim().length ? input.message.trim() : formatNoResultMessage(input.entityName);
  input.context.terminal.line(message);
  input.context.flow.back();
};

