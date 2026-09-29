/** 5400 → "1h 30m", 7200 → "2h", 1500 → "25m", 40 → "0m" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** "2026-09-25" → "Today" / "Yesterday" / "Wed, Sep 23", relative to `today` (same format). */
export function formatDayLabel(day: string, today: string): string {
  if (day === today) return 'Today';
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  if (day === yesterday) return 'Yesterday';
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}
