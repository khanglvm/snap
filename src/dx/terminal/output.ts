import type { Writable } from 'node:stream';

export interface TerminalOutput {
  line(message: string): void;
  lines(messages: readonly string[]): void;
  error(message: string): void;
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
}

export interface LogOptions {
  prefix?: string;
}

const symbols = {
  info: 'ℹ',
  success: '✔',
  warn: '⚠',
  error: '✖'
} as const;

const writeLine = (stream: Writable, message: string): void => {
  stream.write(`${message}\n`);
};

export const createTerminalOutput = (
  stdout: Writable = process.stdout,
  stderr: Writable = process.stderr,
  options: LogOptions = {}
): TerminalOutput => {
  const formatLog = (symbol: string, message: string, color?: string): string => {
    const prefix = options.prefix ?? '';
    if (color) {
      return `${prefix}${color}${symbol} \x1b[0m${message}`;
    }
    return `${prefix}${symbol} ${message}`;
  };

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
      writeLine(stderr, formatLog(symbols.error, message, '\x1b[31m')); // Red
    },
    info(message: string): void {
      writeLine(stdout, formatLog(symbols.info, message, '\x1b[34m')); // Blue
    },
    success(message: string): void {
      writeLine(stdout, formatLog(symbols.success, message, '\x1b[32m')); // Green
    },
    warn(message: string): void {
      writeLine(stdout, formatLog(symbols.warn, message, '\x1b[33m')); // Yellow
    }
  };
};

// Convenience log functions using default streams
export const log = {
  info(message: string): void {
    const terminal = createTerminalOutput();
    terminal.info(message);
  },
  success(message: string): void {
    const terminal = createTerminalOutput();
    terminal.success(message);
  },
  warn(message: string): void {
    const terminal = createTerminalOutput();
    terminal.warn(message);
  },
  error(message: string): void {
    const terminal = createTerminalOutput();
    terminal.error(message);
  }
};
