import { isCancel } from '@clack/prompts';

export class PromptCancelledError extends Error {
  readonly isPromptCancelled = true;

  constructor(message = 'Cancelled by user.') {
    super(message);
    this.name = 'PromptCancelledError';
  }
}

export class PromptRetryError extends Error {
  readonly isPromptRetry = true;

  constructor(message = 'Retry prompt workflow.') {
    super(message);
    this.name = 'PromptRetryError';
  }
}

export const isPromptCancelledError = (error: unknown): error is PromptCancelledError => {
  return error instanceof PromptCancelledError || (
    typeof error === 'object' &&
    error !== null &&
    'isPromptCancelled' in error &&
    (error as { isPromptCancelled?: boolean }).isPromptCancelled === true
  );
};

export const isPromptRetryError = (error: unknown): error is PromptRetryError => {
  return error instanceof PromptRetryError || (
    typeof error === 'object' &&
    error !== null &&
    'isPromptRetry' in error &&
    (error as { isPromptRetry?: boolean }).isPromptRetry === true
  );
};

export const unwrapClackResult = <T>(value: T | symbol, cancelMessage = 'Cancelled by user.'): T => {
  if (isCancel(value)) {
    throw new PromptCancelledError(cancelMessage);
  }
  return value;
};
