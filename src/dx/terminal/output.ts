import type { Writable } from 'node:stream';

export interface TerminalOutput {
  line(message: string): void;
  lines(messages: readonly string[]): void;
  error(message: string): void;
}

const writeLine = (stream: Writable, message: string): void => {
  stream.write(`${message}\n`);
};

export const createTerminalOutput = (
  stdout: Writable = process.stdout,
  stderr: Writable = process.stderr
): TerminalOutput => {
  return {
    line(message: string): void {
      writeLine(stdout, message);
    },
    lines(messages: readonly string[]): void {
      for (const message of messages) {
        writeLine(stdout, message);
      }
    },
    error(message: string): void {
      writeLine(stderr, message);
    }
  };
};
