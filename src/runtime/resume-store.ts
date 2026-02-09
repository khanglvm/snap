import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type { WorkflowCheckpoint } from './state-machine.js';

export interface ResumeStore {
  load: () => Promise<WorkflowCheckpoint | undefined>;
  save: (checkpoint: WorkflowCheckpoint) => Promise<void>;
  clear: () => Promise<void>;
}

export class FileResumeStore implements ResumeStore {
  constructor(private readonly filePath: string) {}

  async load(): Promise<WorkflowCheckpoint | undefined> {
    let raw: string;
    try {
      raw = await fs.readFile(this.filePath, 'utf8');
    } catch (error: unknown) {
      if (isIgnorableReadError(error)) {
        return undefined;
      }
      throw error;
    }

    try {
      return JSON.parse(raw) as WorkflowCheckpoint;
    } catch {
      return undefined;
    }
  }

  async save(checkpoint: WorkflowCheckpoint): Promise<void> {
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(checkpoint), 'utf8');
  }

  async clear(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error: unknown) {
      if (isIgnorableReadError(error)) {
        return;
      }
      throw error;
    }
  }
}

const isIgnorableReadError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  ((error as { code?: string }).code === 'ENOENT');
