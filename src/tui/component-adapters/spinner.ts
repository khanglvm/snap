import { spinner as clackSpinner } from '@clack/prompts';
import { isInteractiveTerminal } from './readline-utils.js';

export interface SpinnerOptions {
  message?: string;
}

export interface Spinner {
  start(message?: string): void;
  stop(message?: string): void;
  message(message: string): void;
}

export const createSpinner = (options: SpinnerOptions = {}): Spinner => {
  // Non-interactive fallback
  if (!isInteractiveTerminal()) {
    let currentMessage = options.message ?? '';
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
      message(newMessage: string): void {
        currentMessage = newMessage;
      }
    };
  }

  // Interactive spinner using @clack/prompts
  const internalSpinner = clackSpinner();

  return {
    start(message?: string): void {
      if (message) {
        internalSpinner.start(message);
      } else if (options.message) {
        internalSpinner.start(options.message);
      }
    },
    stop(message?: string): void {
      if (message) {
        internalSpinner.stop(message);
      } else {
        internalSpinner.stop();
      }
    },
    message(newMessage: string): void {
      internalSpinner.message(newMessage);
    }
  };
};

export const spinner = createSpinner;
