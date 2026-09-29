import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TaskDTO } from '@/data/tasks';
import { groupTasksByTopic } from './group-tasks';

const task = (id: string, topicId: string | null, topicName: string | null, status: TaskDTO['status'] = 'todo'): TaskDTO =>
  ({ id, title: `Task ${id}`, status, topicId, topicName });

test('groups tasks under their topic, topics A → Z, no topic last', () => {
  const groups = groupTasksByTopic([
    task('1', null, null),
    task('2', 't-sql', 'PostgreSQL'),
    task('3', 't-react', 'React'),
    task('4', 't-sql', 'PostgreSQL'),
  ]);
  assert.deepEqual(groups.map((g) => g.topicName), ['PostgreSQL', 'React', null]);
  assert.deepEqual(groups[0].tasks.map((t) => t.id), ['2', '4']);
});

test('keeps the server order inside a topic (in progress before to-do)', () => {
  const groups = groupTasksByTopic([
    task('a', 't1', 'Clean code', 'in_progress'),
    task('b', 't1', 'Clean code', 'todo'),
  ]);
  assert.deepEqual(groups[0].tasks.map((t) => t.id), ['a', 'b']);
});

test('no tasks → no groups', () => {
  assert.deepEqual(groupTasksByTopic([]), []);
});
