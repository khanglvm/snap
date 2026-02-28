import { Readable } from 'node:stream';
import { createInterface, emitKeypressEvents, Interface as RLInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { TextPrompt } from '@clack/core';
import pcModule from 'picocolors';
import { isCancel } from '@clack/prompts';

const pc = (pcModule as any)?.default ?? (pcModule as any);

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
      let rawModeEnabled = false;
      let keypressListener: ((str: string, key: any) => Promise<void>) | undefined;
      let dataListener: ((chunk: unknown) => void) | undefined;
      let ignoreNextLineEvent = false;
      let expectingGhosttySequenceEcho = false;
      let bracketPasteActive = false;
      let bracketPasteProbe = '';
      let pendingEnterSubmit = false;
      let pendingEnterSubmitTimer: NodeJS.Timeout | undefined;
      let recentPasteBurstUntil = 0;
      let sawPasteLikeRawInput = false;
      let recentPasteRawBuffer = '';

      const cleanup = () => {
        if (pendingEnterSubmitTimer) {
          clearTimeout(pendingEnterSubmitTimer);
          pendingEnterSubmitTimer = undefined;
        }
        if (keypressListener) {
          input.off('keypress', keypressListener as any);
        }
        if (dataListener) {
          (input as any).off?.('data', dataListener as any);
        }
        if (rawModeEnabled && (input as any).setRawMode) {
          (input as any).setRawMode(false);
          rawModeEnabled = false;
        }
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
        pc.dim(`  Press Enter to submit; Shift+Enter for newline (Alt+Enter fallback)\n`)
      );

      const lines = value.split('\n');
      let currentLine = lines.length > 0 ? lines.pop()! : '';
      (rl as any).line = currentLine;
      if (typeof (rl as any).cursor === 'number') {
        (rl as any).cursor = currentLine.length;
      }

      const getLiveLine = (): string => {
        const rlLine = typeof (rl as any).line === 'string' ? (rl as any).line : '';
        if (rlLine.length > 0) return rlLine;
        return currentLine;
      };

      const isGhosttyShiftEnter = (str: string, key: any): boolean => {
        const sequence = String(key?.sequence ?? '');
        if (sequence.includes('[13;2u')) return true;
        if (sequence.includes('[27;2;13~')) return true;
        if (sequence.endsWith('13~')) return true;
        if (sequence === '13~') return true;
        if (str === '~13') return true;
        if (str === '13~') return true;
        if (str === '\u001b[13;2u') return true;
        return false;
      };

      const stripGhosttyShiftEnterSuffix = (line: string): string | null => {
        const suffixes = [
          '\u001b[13;2u',
          '[13;2u',
          '\u001b[27;2;13~',
          '[27;2;13~',
          '13~',
          '~13'
        ];

        for (const suffix of suffixes) {
          if (line.endsWith(suffix)) {
            return line.slice(0, -suffix.length);
          }
        }

        return null;
      };

      const normalizeGhosttyInlineTokens = (raw: string): string => {
        return raw.replace(
          /(?:\u001b\[13;2u|\[13;2u|\u001b\[27;2;13~|\[27;2;13~|13~|~13)/g,
          '\n'
        );
      };

      const stripAnsiControls = (raw: string): string => {
        return String(raw || '')
          .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
      };

      const recoverMultilineFromRawPaste = (primary: string): string => {
        if (!sawPasteLikeRawInput) return '';
        if (primary.includes('\n')) return '';
        if (!recentPasteRawBuffer) return '';

        const recoveredLines = stripAnsiControls(recentPasteRawBuffer)
          .replace(/\r/g, '\n')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        if (recoveredLines.length < 2) return '';

        const normalizedPrimary = String(primary || '').trim();
        const recoveredLastLine = recoveredLines[recoveredLines.length - 1] || '';
        const recoveredJoined = recoveredLines.join('');
        if (
          normalizedPrimary &&
          recoveredLastLine !== normalizedPrimary &&
          recoveredJoined !== normalizedPrimary
        ) return '';

        return recoveredLines.join('\n');
      };

      const buildSubmitValue = (): string => {
        const primary = normalizeGhosttyInlineTokens(lines.concat(getLiveLine()).join('\n'));
        const recovered = recoverMultilineFromRawPaste(primary);
        return recovered || primary;
      };

      const absorbLine = (line: string) => {
        if (line.trim() === '') {
          if (currentLine !== '') {
            lines.push(currentLine);
            currentLine = '';
          }
          return;
        }

        if (currentLine !== '') {
          lines.push(currentLine);
        }
        currentLine = line;
      };

      const insertNewline = () => {
        lines.push(getLiveLine());
        currentLine = '';
        (rl as any).line = '';
        output.write(`\n${pc.dim('> ')}`);
      };

      const showPrompt = () => {
        output.write(`\n${pc.dim('> ')}${getLiveLine()}`);
      };

      const BRACKET_PASTE_START = '\u001b[200~';
      const BRACKET_PASTE_END = '\u001b[201~';
      const BRACKET_PASTE_PROBE_MAX = 96;
      const PASTE_BURST_WINDOW_MS = 70;
      const RAW_PASTE_BUFFER_MAX = 8192;
      const updateBracketPasteState = (chunk: string) => {
        if (!chunk) return;

        bracketPasteProbe = `${bracketPasteProbe}${chunk}`.slice(-BRACKET_PASTE_PROBE_MAX);

        if (!bracketPasteActive) {
          const startIndex = bracketPasteProbe.indexOf(BRACKET_PASTE_START);
          if (startIndex >= 0) {
            bracketPasteActive = true;
            bracketPasteProbe = bracketPasteProbe.slice(startIndex + BRACKET_PASTE_START.length);
          }
        }

        if (bracketPasteActive) {
          const endIndex = bracketPasteProbe.indexOf(BRACKET_PASTE_END);
          if (endIndex >= 0) {
            bracketPasteActive = false;
            bracketPasteProbe = bracketPasteProbe.slice(endIndex + BRACKET_PASTE_END.length);
          }
        }
      };

      const notePossiblePasteBurst = (chunk: string) => {
        if (!chunk) return;
        const normalized = chunk
          .replaceAll(BRACKET_PASTE_START, '')
          .replaceAll(BRACKET_PASTE_END, '');
        if (!normalized) return;
        // In raw mode, normal typing usually arrives as single-byte chunks.
        // Multi-byte chunks and newlines are strong signals that input is a paste burst.
        if (normalized.length > 1 || /[\r\n]/.test(normalized)) {
          sawPasteLikeRawInput = true;
          recentPasteRawBuffer = `${recentPasteRawBuffer}${normalized}`.slice(-RAW_PASTE_BUFFER_MAX);
          recentPasteBurstUntil = Math.max(
            recentPasteBurstUntil,
            Date.now() + PASTE_BURST_WINDOW_MS
          );
        }
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

        if (pendingEnterSubmit) {
          const likelyPasteFlow = now < recentPasteBurstUntil;
          pendingEnterSubmit = false;
          if (pendingEnterSubmitTimer) {
            clearTimeout(pendingEnterSubmitTimer);
            pendingEnterSubmitTimer = undefined;
          }
          if (likelyPasteFlow) {
            absorbLine(line);
            showPrompt();
            return;
          }
          absorbLine(line);
          submit(buildSubmitValue());
          return;
        }

        if (ignoreNextLineEvent) {
          ignoreNextLineEvent = false;
          return;
        }

        if (expectingGhosttySequenceEcho) {
          if (line === '13~' || line === '~13' || line === '[13;2u' || line === '\u001b[13;2u') {
            expectingGhosttySequenceEcho = false;
            return;
          }
          expectingGhosttySequenceEcho = false;
        }

        // Some terminals (notably Ghostty on macOS) may emit Shift+Enter as literal
        // suffix text like "13~" without keypress modifier metadata.
        const ghosttySuffixTrimmedLine = stripGhosttyShiftEnterSuffix(line);
        if (ghosttySuffixTrimmedLine !== null) {
          lines.push(ghosttySuffixTrimmedLine);
          currentLine = '';
          (rl as any).line = '';
          showPrompt();
          return;
        }

        // Check for double Enter to submit
        if (line === '' && now - lastEnterTime < DOUBLE_ENTER_TIMEOUT) {
          submit(buildSubmitValue());
          return;
        }

        lastEnterTime = now;

        absorbLine(line);

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
        emitKeypressEvents(input as any);
        (input as any).setRawMode(true);
        rawModeEnabled = true;
        (input as any).resume();

        dataListener = (chunk: unknown) => {
          if (cancelled) return;
          const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk ?? '');
          updateBracketPasteState(text);
          notePossiblePasteBurst(text);
        };

        (input as any).on('data', dataListener as any);

        keypressListener = async (str: string, key: any) => {
          if (cancelled) return;

          if (key?.ctrl && key.name === 'c') {
            doCancel();
            return;
          }

          if (key?.name === 'escape') {
            doCancel();
            return;
          }

          // In bracketed paste mode, treat all incoming keypresses as paste content.
          // This avoids accidental submit on Enter while multi-line paste is flowing.
          if (bracketPasteActive) {
            return;
          }

          // Some terminals emit Shift+Enter as literal chars "13~" with no key metadata.
          // Readline may already have appended those chars into rl.line by the time we run.
          if (!key?.ctrl && !key?.meta && key?.name !== 'enter' && key?.name !== 'return') {
            const strippedLive = stripGhosttyShiftEnterSuffix(String((rl as any).line ?? ''));
            if (strippedLive !== null) {
              lines.push(strippedLive);
              currentLine = '';
              (rl as any).line = '';
              output.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
              output.write(`${pc.dim('> ')}${strippedLive}`);
              output.write(`\n${pc.dim('> ')}`);
              return;
            }
          }

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

              (rl as any).line = currentLine;

              output.write(`${pc.dim('> ')}${currentLine}`);
            }
          } else if (isGhosttyShiftEnter(str, key)) {
            expectingGhosttySequenceEcho = true;
            insertNewline();
          } else if (key.name === 'enter' || key.name === 'return') {
            const now = Date.now();
            const likelyPasteReturn = now < recentPasteBurstUntil;
            if (likelyPasteReturn) {
              return;
            }
            if (key.shift || key.alt) {
              ignoreNextLineEvent = true;
              // Shift+Enter / Alt+Enter inserts a new line.
              insertNewline();
              return;
            }

            pendingEnterSubmit = true;
            if (pendingEnterSubmitTimer) {
              clearTimeout(pendingEnterSubmitTimer);
            }
            pendingEnterSubmitTimer = setTimeout(() => {
              if (!pendingEnterSubmit || cancelled) return;
              pendingEnterSubmit = false;
              pendingEnterSubmitTimer = undefined;
              submit(buildSubmitValue());
            }, 20);
          }
        };

        input.on('keypress', keypressListener as any);
      }

      // Handle non-interactive terminal
      if (!(input as any).isTTY) {
        submit(initialValue);
      }
    });
  };
};
