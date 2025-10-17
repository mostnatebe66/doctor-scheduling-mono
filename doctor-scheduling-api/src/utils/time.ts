export const SLOT_MINUTES = 15;

function getChicagoTime(d: Date): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(d);
  let hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);

  // Handle midnight case if hourCycle does not return 0 for midnight
  if (hour === 24) {
    hour = 0;
  }
  return { hour, minute };
}

export function isQuarterHour(d: Date): boolean {
  const { minute } = getChicagoTime(d);
  return minute % SLOT_MINUTES === 0;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function withinWorkingHours(d: Date): boolean {
  const { hour, minute } = getChicagoTime(d);
  console.log(`Hour: ${hour}, Minute: ${minute}`);

  const afterOpen = hour > 9 || (hour === 9 && minute >= 0);
  const beforeClose = hour < 17 || (hour === 16 && minute <= 45);

  return afterOpen && beforeClose;
}
