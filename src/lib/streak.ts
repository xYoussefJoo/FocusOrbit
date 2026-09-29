// Streak = consecutive days (in the user's timezone) with at least one
// completed session. Today still counts as "alive" if you haven't studied yet:
// the streak then runs up to yesterday.

const DAY_MS = 86_400_000;

function previousDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
}

/**
 * @param days  distinct local dates with a completed session, "YYYY-MM-DD"
 * @param today the user's local date, "YYYY-MM-DD"
 */
export function computeStreak(days: Iterable<string>, today: string): number {
  const set = new Set(days);
  let cursor = set.has(today) ? today : previousDay(today);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = previousDay(cursor);
  }
  return streak;
}
