import { ExitCode } from '../core/errors/framework-errors.js';

export type InterruptSignal = 'SIGINT' | 'ESC' | 'TIMEOUT';

export interface InterruptResult {
  exitCode: ExitCode;
  reason: string;
}

export const handleInterrupt = (signal: InterruptSignal): InterruptResult => {
  if (signal === 'TIMEOUT') {
    return { exitCode: ExitCode.VALIDATION_ERROR, reason: 'Workflow timed out' };
  }
  return { exitCode: ExitCode.INTERRUPTED, reason: `Interrupted by ${signal}` };
};
