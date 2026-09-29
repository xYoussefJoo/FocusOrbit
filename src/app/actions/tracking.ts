'use server';

import { runAction } from '@/data/run-action';
import { getHistory, getTodayStats } from '@/data/history';
import { createTask, createTopic, listTasks, listTopics, setTaskStatus } from '@/data/tasks';

/** Everything the tracking UI shows, in one round trip. */
export async function getTrackingAction() {
  return runAction(async (user) => {
    const [tasks, topics, today, history] = await Promise.all([
      listTasks(user.id),
      listTopics(user.id),
      getTodayStats(user.id, user.timezone, user.dailyGoalMinutes),
      getHistory(user.id, user.timezone),
    ]);
    return { tasks, topics, today, history };
  });
}

export async function createTaskAction(input: { title: string; topicId?: string | null }) {
  return runAction((user) => createTask(user.id, input));
}

export async function setTaskStatusAction(taskId: string, status: 'todo' | 'in_progress' | 'done') {
  return runAction((user) => setTaskStatus(user.id, taskId, status));
}

export async function createTopicAction(name: string) {
  return runAction((user) => createTopic(user.id, name));
}
