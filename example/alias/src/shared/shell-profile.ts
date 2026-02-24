import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export interface ShellProfileInfo {
  shell: 'zsh' | 'bash';
  profilePath: string;
}

export const detectShellProfile = async (): Promise<ShellProfileInfo> => {
  const home = homedir();
  const shell = process.env.SHELL ?? '';

  if (shell.includes('zsh')) {
    return { shell: 'zsh', profilePath: path.join(home, '.zshrc') };
  }

  const bashrc = path.join(home, '.bashrc');
  const bashProfile = path.join(home, '.bash_profile');

  try {
    await fs.access(bashrc);
    return { shell: 'bash', profilePath: bashrc };
  } catch {
    try {
      await fs.access(bashProfile);
      return { shell: 'bash', profilePath: bashProfile };
    } catch {
      return { shell: 'bash', profilePath: bashrc };
    }
  }
};
