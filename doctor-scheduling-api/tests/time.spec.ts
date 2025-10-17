import { describe, it, expect } from 'vitest';
import { isQuarterHour, withinWorkingHours, addMinutes } from '../src/utils/time';

describe('time utils', () => {
  it('validates quarter hour', () => {
    expect(isQuarterHour(new Date('2025-01-01T14:00:00.000Z'))).toBe(true);
    expect(isQuarterHour(new Date('2025-01-01T14:15:00.000Z'))).toBe(true);
    expect(isQuarterHour(new Date('2025-01-01T14:07:00.000Z'))).toBe(false);
  });

  it('validates working hours', () => {
    //within working hours validates US Central Daylight Time (UTC-5)
    expect(withinWorkingHours(new Date('2025-01-01T15:00:00.000Z'))).toBe(true);
    expect(withinWorkingHours(new Date('2025-01-01T15:45:00.000Z'))).toBe(true);
    expect(withinWorkingHours(new Date('2025-01-01T06:30:00.000Z'))).toBe(false);
    expect(withinWorkingHours(new Date('2025-01-01T06:45:00.000Z'))).toBe(false);
  });

  it('adds minutes correctly', () => {
    const datetime = new Date('2025-01-01T09:00:00.000Z');
    const minutes = addMinutes(datetime, 15);
    expect(minutes.toISOString()).toBe('2025-01-01T09:15:00.000Z');
  });
});
