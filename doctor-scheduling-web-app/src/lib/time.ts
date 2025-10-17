export function fmtTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function timeSlotsForDay(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d, 9, 0, 0, 0); // ✅ local 9:00 AM
  return Array.from({ length: 32 }, (_, i) => new Date(start.getTime() + i * 15 * 60_000));
}
