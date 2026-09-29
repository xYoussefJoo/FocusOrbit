import type { TaskDTO } from '@/data/tasks';

export type TaskGroup = { topicId: string | null; topicName: string | null; tasks: TaskDTO[] };

/**
 * Tasks grouped under their topic: topics A → Z, tasks without a topic last.
 * Keeps each task's order from the server (in progress first, then to-do).
 */
export function groupTasksByTopic(tasks: TaskDTO[]): TaskGroup[] {
  const groups = new Map<string, TaskGroup>();
  for (const task of tasks) {
    const key = task.topicId ?? '';
    let group = groups.get(key);
    if (!group) {
      group = { topicId: task.topicId, topicName: task.topicName, tasks: [] };
      groups.set(key, group);
    }
    group.tasks.push(task);
  }
  return [...groups.values()].sort((a, b) => {
    if (a.topicName === null) return 1;
    if (b.topicName === null) return -1;
    return a.topicName.localeCompare(b.topicName);
  });
}
