import type { Writable } from 'node:stream';

const boxChars = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  left: ' '
} as const;

const renderBox = (
  message: string,
  leftChar: string,
  rightChar: string,
  stream: Writable
): void => {
  const padding = 1;
  const lines = message.split('\n');
  const maxLength = Math.max(...lines.map((line) => line.length));

  stream.write(`${leftChar}${boxChars.horizontal}${' '.repeat(maxLength + padding * 2)}${boxChars.horizontal}${rightChar}\n`);

  for (const line of lines) {
    stream.write(`${boxChars.vertical} ${line.padEnd(maxLength + padding)} ${boxChars.vertical}\n`);
  }

  stream.write(`${leftChar === '┌' ? boxChars.bottomLeft : leftChar}${boxChars.horizontal}${' '.repeat(maxLength + padding * 2)}${boxChars.horizontal}${rightChar === '┐' ? boxChars.topRight : rightChar}\n`);
};

export const intro = (message: string, stdout: Writable = process.stdout): void => {
  if (!message) {
    stdout.write('\n');
    return;
  }
  renderBox(message, boxChars.topLeft, boxChars.topRight, stdout);
};

export const outro = (message: string, stdout: Writable = process.stdout): void => {
  if (!message) {
    stdout.write('\n');
    return;
  }
  stdout.write('\n');
  renderBox(message, boxChars.bottomLeft, boxChars.bottomRight, stdout);
  stdout.write('\n');
};

export const cancel = (message: string, stdout: Writable = process.stdout): void => {
  if (!message) {
    stdout.write('\n');
    return;
  }
  stdout.write('\n');
  renderBox(message, boxChars.bottomLeft, boxChars.bottomRight, stdout);
  stdout.write('\n');
};
