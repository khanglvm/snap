export interface GroupStep<T = unknown> {
  key: string;
  run: () => Promise<T>;
}

export const runGroupPrompt = async <T = unknown>(steps: GroupStep<T>[]): Promise<Record<string, T>> => {
  const result: Record<string, T> = {};
  for (const step of steps) {
    result[step.key] = await step.run();
  }
  return result;
};
