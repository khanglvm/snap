import type { Writable } from 'node:stream';

export interface NoteInput {
  message: string;
  title?: string;
  format?: (line: string) => string;
}

const boxChars = {
  topLeft: '╮',
  topRight: '╯',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│'
} as const;

export const note = (input: NoteInput, stdout: Writable = process.stdout): void => {
  const { message, title = '', format } = input;

  const lines = message.split('\n');
  const formattedLines = format ? lines.map(format) : lines;
  const maxLength = Math.max(...formattedLines.map((line) => line.length), title.length);

  const padding = 2;

  // Top line
  stdout.write(`${boxChars.vertical} ${title.padEnd(maxLength + padding)} ${boxChars.topLeft}${boxChars.horizontal.repeat(maxLength + padding * 2)}${boxChars.horizontal}\n`);

  // Message lines
  for (const line of formattedLines) {
    stdout.write(`${boxChars.vertical} ${' '.repeat(maxLength + padding)} ${boxChars.vertical} ${line.padEnd(maxLength + padding)} ${boxChars.vertical}\n`);
  }

  // Bottom line
  stdout.write(`${boxChars.horizontal}${boxChars.horizontal.repeat(maxLength + padding * 2)}${boxChars.horizontal}${boxChars.horizontal.repeat(maxLength + padding * 2)}${boxChars.vertical}\n`);
};
