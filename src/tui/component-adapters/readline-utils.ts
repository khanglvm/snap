import { stdin as input, stdout as output } from 'node:process';

export const isInteractiveTerminal = (): boolean => Boolean(input.isTTY && output.isTTY);
