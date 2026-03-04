import { password as clackPassword } from '@clack/prompts';
import { emitKeypressEvents } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import pcModule from 'picocolors';
import { PromptCancelledError, unwrapClackResult } from './cancel.js';

const pc = (pcModule as any)?.default ?? (pcModule as any);

export interface PasswordPromptInput {
  message: string;
  required?: boolean;
  validate?: (value: string) => string | Error | undefined;
  mask?: string;
  input?: Readable;
  output?: Writable;
  signal?: AbortSignal;
}

export const runPasswordPrompt = async (input: PasswordPromptInput): Promise<string> => {
  const inStream = (input.input ?? process.stdin) as Readable & {
    isTTY?: boolean;
    setRawMode?: (enabled: boolean) => void;
    resume?: () => void;
    on: (event: string, listener: (...args: unknown[]) => void) => void;
    off?: (event: string, listener: (...args: unknown[]) => void) => void;
  };
  const outStream = (input.output ?? process.stdout) as Writable & {
    isTTY?: boolean;
    write: (chunk: string) => boolean;
  };

  const isInteractive = Boolean(inStream?.isTTY && outStream?.isTTY);
  if (!isInteractive) {
    // For non-interactive terminals, read from stdin in a secure way
    // or return empty/throw error
    if (input.required) {
      throw new Error(`Password required: ${input.message}`);
    }
    return '';
  }

  const mask = input.mask && input.mask.length > 0 ? input.mask : '*';
  const validateValue = (value: string): string | undefined => {
    if (input.required && value.trim().length === 0) {
      return 'Password is required';
    }

    const result = input.validate?.(value);
    if (!result) return undefined;
    return result instanceof Error ? result.message : String(result);
  };

  // Fallback to clack implementation if raw mode is unavailable.
  if (typeof inStream.setRawMode !== 'function') {
    const value = await clackPassword({
      message: input.message,
      mask,
      validate: (raw) => validateValue(raw ?? ''),
      input: inStream as any,
      output: outStream as any,
      signal: input.signal
    });
    return unwrapClackResult(value);
  }

  const value = await new Promise<string>((resolve, reject) => {
    let password = '';
    let rawModeEnabled = false;
    let keypressListener: ((str: string, key: any) => void) | undefined;

    const clearLine = () => {
      outStream.write('\r\x1b[2K');
    };

    const render = () => {
      clearLine();
      outStream.write(`${pc.dim('> ')}${mask.repeat(password.length)}`);
    };

    const cleanup = () => {
      if (keypressListener && typeof inStream.off === 'function') {
        inStream.off('keypress', keypressListener as any);
      }
      if (rawModeEnabled) {
        inStream.setRawMode?.(false);
        rawModeEnabled = false;
      }
    };

    const cancel = () => {
      cleanup();
      reject(new PromptCancelledError('Cancelled by user.'));
    };

    const submit = () => {
      const validationError = validateValue(password);
      if (validationError) {
        outStream.write(`\n${pc.yellow('!')} ${validationError}\n`);
        render();
        return;
      }

      cleanup();
      outStream.write('\n');
      resolve(password);
    };

    outStream.write(`\n${pc.cyan('○')} ${pc.bold(input.message)}\n`);
    outStream.write(`${pc.dim('> ')}`);

    emitKeypressEvents(inStream as any);
    inStream.setRawMode?.(true);
    rawModeEnabled = true;
    inStream.resume?.();

    keypressListener = (str: string, key: any) => {
      if (key?.ctrl && key.name === 'c') {
        cancel();
        return;
      }

      if (key?.name === 'escape') {
        cancel();
        return;
      }

      if (key?.name === 'enter' || key?.name === 'return') {
        submit();
        return;
      }

      if (key?.name === 'backspace') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          render();
        }
        return;
      }

      if (key?.ctrl || key?.meta) {
        return;
      }

      if (!str || /[\u0000-\u001f\u007f]/.test(str)) {
        return;
      }

      password += str;
      render();
    };

    inStream.on('keypress', keypressListener as any);

    if (input.signal) {
      input.signal.addEventListener('abort', () => {
        cancel();
      }, { once: true });
    }
  });

  return value;
};
