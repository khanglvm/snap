import { spinner as clackSpinner } from '@clack/prompts';
import { isInteractiveTerminal } from './readline-utils.js';

export interface SpinnerOptions {
  message?: string;
  indicator?: 'dots' | 'timer';
  onCancel?: () => void;
  cancelMessage?: string;
  errorMessage?: string;
  frames?: string[];
  delay?: number;
  styleFrame?: (frame: string) => string;
}

export interface Spinner {
  start(message?: string): void;
  stop(message?: string): void;
  cancel(message?: string): void;
  error(message?: string): void;
  message(message: string): void;
  clear(): void;
  readonly isCancelled: boolean;
}

export const createSpinner = (options: SpinnerOptions = {}): Spinner => {
  // Non-interactive fallback
  if (!isInteractiveTerminal()) {
    let currentMessage = options.message ?? '';
    let cancelled = false;

    return {
      start(message?: string): void {
        currentMessage = message ?? currentMessage;
        if (currentMessage) {
          process.stdout.write(`${currentMessage}...\n`);
        }
      },
      stop(message?: string): void {
        if (message) {
          process.stdout.write(`${message}\n`);
        }
      },
      cancel(message?: string): void {
        cancelled = true;
        const msg = message || options.cancelMessage || 'Cancelled';
        process.stdout.write(`${msg}\n`);
      },
      error(message?: string): void {
        const msg = message || options.errorMessage || 'Error';
        process.stderr.write(`${msg}\n`);
      },
      message(newMessage: string): void {
        currentMessage = newMessage;
      },
      clear(): void {
        // No-op in non-interactive mode
      },
      get isCancelled(): boolean {
        return cancelled;
      }
    };
  }

  // Interactive spinner using @clack/prompts
  const internalSpinner = clackSpinner(options);

  return {
    start(message?: string): void {
      if (message) {
        internalSpinner.start(message);
      } else if (options.message) {
        internalSpinner.start(options.message);
      } else {
        internalSpinner.start();
      }
    },
    stop(message?: string): void {
      if (message) {
        internalSpinner.stop(message);
      } else {
        internalSpinner.stop();
      }
    },
    cancel(message?: string): void {
      if (message) {
        internalSpinner.cancel(message);
      } else {
        internalSpinner.cancel();
      }
    },
    error(message?: string): void {
      if (message) {
        internalSpinner.error(message);
      } else {
        internalSpinner.error();
      }
    },
    message(newMessage: string): void {
      internalSpinner.message(newMessage);
    },
    clear(): void {
      internalSpinner.clear();
    },
    get isCancelled(): boolean {
      return internalSpinner.isCancelled;
    }
  };
};

export const spinner = createSpinner;
