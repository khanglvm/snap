import { Readable } from 'node:stream';
import { createInterface, Interface as RLInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { TextPrompt } from '@clack/core';
import * as pc from 'picocolors';
import { isCancel } from '@clack/prompts';

export interface MultilineTextOptions {
  message: string;
  initialValue?: string;
  placeholder?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
  allowPaste?: boolean;
  input?: Readable;
  output?: Writable;
  signal?: AbortSignal;
}

export const createMultilineTextPrompt = () => {
  return async (opts: MultilineTextOptions): Promise<string | symbol> => {
    const {
      message,
      initialValue = '',
      placeholder = '',
      validate,
      allowPaste = false,
      input = process.stdin,
      output = process.stdout,
      signal,
    } = opts;

    // Use standard text prompt for single line paste
    if (!allowPaste) {
      const { text: textPrompt } = await import('@clack/prompts');
      return textPrompt({
        message,
        initialValue,
        placeholder,
        validate,
        input,
        output,
        signal,
      });
    }

    // For multiline paste support, use a custom readline-based approach
    return new Promise<string | symbol>((resolve, reject) => {
      const rl = createInterface({
        input,
        output,
        terminal: true,
      });

      let value = initialValue;
      let cancelled = false;

      const cleanup = () => {
        rl.close();
      };

      const submit = (val: string) => {
        cleanup();
        resolve(val);
      };

      const doCancel = () => {
        cancelled = true;
        cleanup();
        const { isCancel: cancelSymbol } = require('@clack/prompts');
        resolve(cancelSymbol);
      };

      // Show instructions
      output.write(
        `\n${pc.cyan('○')} ${pc.bold(message)}\n`
      );

      if (allowPaste) {
        output.write(
          pc.dim(`  Paste support: Ctrl+V to paste (macOS/Linux: Cmd+Shift+V)\n`)
        );
      }

      output.write(
        pc.dim(`  Press Enter twice or Alt+Enter to submit\n`)
      );

      const lines = value.split('\n');
      let currentLine = lines.length > 0 ? lines.pop()! : '';

      const showPrompt = () => {
        output.write(`\n${pc.dim('> ')}${currentLine}`);
      };

      showPrompt();

      // Handle paste from clipboard
      const handlePaste = async (): Promise<string> => {
        try {
          const { execSync } = await import('node:child_process');
          const platform = process.platform;

          if (platform === 'darwin') {
            return execSync('pbpaste', { encoding: 'utf-8' });
          } else if (platform === 'win32') {
            return execSync(
              'powershell -command "Get-Clipboard"',
              { encoding: 'utf-8', shell: true as any }
            ).trim();
          } else if (platform === 'linux') {
            try {
              return execSync('xclip -selection clipboard -o', {
                encoding: 'utf-8',
              });
            } catch {
              try {
                return execSync('xsel --clipboard --output', {
                  encoding: 'utf-8',
                });
              } catch {
                return '';
              }
            }
          }
        } catch {
          // Silent fail if clipboard is unavailable
        }
        return '';
      };

      let lastEnterTime = 0;
      const DOUBLE_ENTER_TIMEOUT = 500; // ms

      rl.on('line', (line: string) => {
        if (cancelled) return;

        const now = Date.now();

        // Check for double Enter to submit
        if (line === '' && now - lastEnterTime < DOUBLE_ENTER_TIMEOUT) {
          submit(lines.join('\n') + currentLine);
          return;
        }

        lastEnterTime = now;

        if (line.trim() === '') {
          // Empty line - add to lines
          if (currentLine !== '') {
            lines.push(currentLine);
            currentLine = '';
          }
        } else {
          // Non-empty line
          if (currentLine !== '') {
            lines.push(currentLine);
          }
          currentLine = line;
        }

        showPrompt();
      });

      // Handle SIGINT (Ctrl+C)
      rl.on('SIGINT', () => {
        doCancel();
      });

      // Handle signal
      if (signal) {
        signal.addEventListener('abort', () => {
          doCancel();
        });
      }

      // Handle paste via keyboard shortcut
      if (allowPaste && (input as any).setRawMode) {
        (input as any).setRawMode(true);
        (input as any).resume();

        input.on('keypress', async (str: string, key: any) => {
          if (cancelled) return;

          // Detect Ctrl+V or Cmd+V for paste
          if ((key.ctrl && key.name === 'v') || (key.meta && key.name === 'v')) {
            const pasted = await handlePaste();
            if (pasted) {
              // Clear current line and show pasted content
              output.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');

              const pastedLines = pasted.split('\n');
              if (pastedLines.length > 1) {
                // Multiline paste
                lines.push(...pastedLines.slice(0, -1));
                currentLine = pastedLines[pastedLines.length - 1];
              } else {
                // Single line paste
                currentLine += pasted;
              }

              output.write(`${pc.dim('> ')}${currentLine}`);
            }
          } else if (key.alt && key.name === 'enter') {
            // Alt+Enter to submit
            submit(lines.join('\n') + currentLine);
          } else if (key.name === 'escape') {
            doCancel();
          }
        });
      }

      // Handle non-interactive terminal
      if (!(input as any).isTTY) {
        submit(initialValue);
      }
    });
  };
};
