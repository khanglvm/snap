import { note } from '@clack/prompts';
import { stdin as input, stdout as output } from 'node:process';
import { emitKeypressEvents } from 'node:readline';

let ctrlCShortcutInstalled = false;

export const isPromptCancelled = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'isPromptCancelled' in error &&
  (error as { isPromptCancelled?: boolean }).isPromptCancelled === true;

export const installCtrlCExitShortcut = (): void => {
  if (ctrlCShortcutInstalled || !input.isTTY) return;

  emitKeypressEvents(input);
  input.on('keypress', (raw, key) => {
    const isCtrlC = raw === '\u0003' || (key?.ctrl === true && key?.name === 'c');
    if (!isCtrlC) return;

    output.write('\n');
    process.exit(130);
  });

  ctrlCShortcutInstalled = true;
};

export const waitForAnyKeyToContinue = async (): Promise<void> => {
  if (!input.isTTY || !output.isTTY) return;

  note('Press any key to continue.', 'Success');

  emitKeypressEvents(input);
  const ttyInput = input as unknown as {
    isRaw?: boolean;
    setRawMode?: (mode: boolean) => void;
    isPaused?: () => boolean;
  };
  const wasRaw = Boolean(ttyInput.isRaw);
  const wasPaused = ttyInput.isPaused?.() ?? false;

  ttyInput.setRawMode?.(true);
  input.resume();

  await new Promise<void>((resolve) => {
    const onKeypress = (): void => {
      input.off('keypress', onKeypress);
      resolve();
    };
    input.on('keypress', onKeypress);
  });

  ttyInput.setRawMode?.(wasRaw);
  if (wasPaused) {
    input.pause();
  }
};

export const waitForAnyKeyToGoBack = async (): Promise<void> => {
  if (!input.isTTY || !output.isTTY) return;

  note('Press any key to go back. Press Ctrl+C to exit.', 'Navigation');

  emitKeypressEvents(input);
  const ttyInput = input as unknown as {
    isRaw?: boolean;
    setRawMode?: (mode: boolean) => void;
    isPaused?: () => boolean;
  };
  const wasRaw = Boolean(ttyInput.isRaw);
  const wasPaused = ttyInput.isPaused?.() ?? false;

  ttyInput.setRawMode?.(true);
  input.resume();

  await new Promise<void>((resolve) => {
    const onKeypress = (): void => {
      input.off('keypress', onKeypress);
      resolve();
    };
    input.on('keypress', onKeypress);
  });

  ttyInput.setRawMode?.(wasRaw);
  if (wasPaused) {
    input.pause();
  }
};
