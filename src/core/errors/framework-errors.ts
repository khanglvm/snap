export enum ExitCode {
  SUCCESS = 0,
  VALIDATION_ERROR = 2,
  INTERRUPTED = 130,
  INTERNAL_ERROR = 1
}

export enum FrameworkErrorCode {
  TRIAD_INCOMPLETE = 'TRIAD_INCOMPLETE',
  DUPLICATE_ACTION = 'DUPLICATE_ACTION',
  DUPLICATE_MODULE = 'DUPLICATE_MODULE',
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  ACTION_NOT_FOUND = 'ACTION_NOT_FOUND',
  INVALID_TRANSITION = 'INVALID_TRANSITION'
}

export class FrameworkError extends Error {
  constructor(
    public readonly code: FrameworkErrorCode,
    public readonly exitCode: ExitCode,
    message: string
  ) {
    super(message);
    this.name = 'FrameworkError';
  }
}
