import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatClock, liveFocusedSeconds, progress, remainingSeconds, type SessionDTO } from './session-clock';

const T0 = Date.parse('2026-09-25T10:00:00Z');
const base: SessionDTO = {
  id: 'x', status: 'running', plannedSeconds: 1500, focusedSeconds: 0,
  lastResumedAt: new Date(T0).toISOString(), startedAt: new Date(T0).toISOString(),
  topicId: null, taskId: null,
};

test('running: banked time + the stretch since last resume', () => {
  const s = { ...base, focusedSeconds: 100 };
  assert.equal(liveFocusedSeconds(s, T0 + 60_000), 160);
  assert.equal(remainingSeconds(s, T0 + 60_000), 1340);
});

test('paused: time does not move', () => {
  const s: SessionDTO = { ...base, status: 'paused', focusedSeconds: 300, lastResumedAt: null };
  assert.equal(liveFocusedSeconds(s, T0 + 10 * 60_000), 300);
});

test('drift-proof: result depends only on timestamps, not on how often we tick', () => {
  // A background tab that "missed" 5 minutes of ticks still gets the exact answer.
  assert.equal(liveFocusedSeconds(base, T0 + 5 * 60_000), 300);
});

test('remaining never goes negative and progress caps at 1', () => {
  const later = T0 + 2 * 3600_000;
  assert.equal(remainingSeconds(base, later), 0);
  assert.equal(progress(base, later), 1);
});

test('live focus time stops at the planned time (e.g. for the Today total)', () => {
  assert.equal(liveFocusedSeconds(base, T0 + 5 * 3600_000), 1500);
});

test('a clock slightly behind the server never produces negative time', () => {
  assert.equal(liveFocusedSeconds(base, T0 - 2_000), 0);
});

test('formatClock', () => {
  assert.equal(formatClock(1500), '25:00');
  assert.equal(formatClock(65), '01:05');
});
