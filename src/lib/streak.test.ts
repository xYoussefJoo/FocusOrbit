import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeStreak } from './streak';

test('no sessions → 0', () => {
  assert.equal(computeStreak([], '2026-09-25'), 0);
});

test('consecutive days ending today', () => {
  assert.equal(computeStreak(['2026-09-25', '2026-09-24', '2026-09-23'], '2026-09-25'), 3);
});

test("today not studied yet: the streak up to yesterday is still alive", () => {
  assert.equal(computeStreak(['2026-09-24', '2026-09-23'], '2026-09-25'), 2);
});

test('a gap breaks the streak', () => {
  assert.equal(computeStreak(['2026-09-25', '2026-09-23'], '2026-09-25'), 1);
  assert.equal(computeStreak(['2026-09-23'], '2026-09-25'), 0);
});

test('crosses month and year boundaries', () => {
  assert.equal(computeStreak(['2026-10-01', '2026-09-30'], '2026-10-01'), 2);
  assert.equal(computeStreak(['2027-01-01', '2026-12-31'], '2027-01-01'), 2);
});
