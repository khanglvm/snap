import { isInteractiveTerminal } from './readline-utils.js';

export interface Task {
  title: string;
  task: (message: (msg: string) => void) => Promise<string>;
}

export interface TasksOptions {
  /** Called when a task is cancelled */
  onCancel?: (results: Record<string, string>) => void;
}

export const tasks = async (
  taskList: Task[],
  options: TasksOptions = {}
): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};

  if (!isInteractiveTerminal()) {
    // Non-interactive: just run tasks without spinner
    for (const taskItem of taskList) {
      try {
        const result = await taskItem.task(() => {});
        results[taskItem.title] = result;
        process.stdout.write(`${taskItem.title}: ${result}\n`);
      } catch (error) {
        results[taskItem.title] = error instanceof Error ? error.message : String(error);
      }
    }
    return results;
  }

  // Import clack dynamically for interactive mode
  const { tasks: clackTasks } = await import('@clack/prompts');

  // Wrap tasks to collect results
  const wrappedTasks = taskList.map((task) => ({
    ...task,
    task: async (message: (msg: string) => void) => {
      const result = await task.task(message);
      results[task.title] = result;
      return result;
    }
  }));

  await clackTasks(wrappedTasks, options as any);

  return results;
};
