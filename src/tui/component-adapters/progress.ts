import { isInteractiveTerminal } from './readline-utils.js';

export interface Progress {
  start(message: string): void;
  message(message: string): void;
  stop(message?: string): void;
}

export const createProgress = (): Progress => {
  // Non-interactive fallback
  if (!isInteractiveTerminal()) {
    let currentMessage = '';
    return {
      start(message: string): void {
        currentMessage = message;
        process.stdout.write(`${message}...\n`);
      },
      message(newMessage: string): void {
        currentMessage = newMessage;
        process.stdout.write(`${newMessage}\n`);
      },
      stop(finalMessage?: string): void {
        if (finalMessage) {
          process.stdout.write(`${finalMessage}\n`);
        }
      }
    };
  }

  // Interactive progress using @clack/prompts
  let progressInstance: any = null;

  return {
    start(message: string): void {
      // Lazy load progress
      import('@clack/prompts').then(({ progress }) => {
        progressInstance = progress();
        progressInstance.start(message);
      });
    },
    message(newMessage: string): void {
      if (progressInstance) {
        progressInstance.message(newMessage);
      }
    },
    stop(finalMessage?: string): void {
      if (progressInstance) {
        progressInstance.stop(finalMessage);
      }
    }
  };
};

export const progress = createProgress;
