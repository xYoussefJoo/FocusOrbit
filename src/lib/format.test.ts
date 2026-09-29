import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDayLabel, formatDuration } from './format';

test('formatDuration', () => {
  assert.equal(formatDuration(0), '0m');
  assert.equal(formatDuration(1500), '25m');
  assert.equal(formatDuration(5400), '1h 30m');
  assert.equal(formatDuration(7200), '2h');
  assert.equal(formatDuration(-5), '0m');
});

test('formatDayLabel', () => {
  assert.equal(formatDayLabel('2026-09-25', '2026-09-25'), 'Today');
  assert.equal(formatDayLabel('2026-09-24', '2026-09-25'), 'Yesterday');
  assert.equal(formatDayLabel('2026-09-23', '2026-09-25'), 'Wed, Sep 23');
  assert.equal(formatDayLabel('2026-09-30', '2026-10-01'), 'Yesterday');
});
