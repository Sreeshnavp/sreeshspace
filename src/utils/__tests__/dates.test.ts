import { describe, it, expect } from 'vitest';
import {
  todayKey,
  toLocalDateKey,
  parseLocalDateKey,
  addDays,
  diffInDays,
  startOfWeek,
  endOfWeek,
  isBefore,
  isAfter,
  isSameOrBefore,
  isSameOrAfter,
  formatNavigatorDate,
  formatDeadlineRelative,
  getDaysInRange,
} from '../dates';

describe('Date Utilities (Local-Calendar Only, Zero UTC Slippage)', () => {
  it('generates a valid YYYY-MM-DD for todayKey', () => {
    const key = todayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    const expectedMonth = String(now.getMonth() + 1).padStart(2, '0');
    expect(key).toContain(`-${expectedMonth}-`);
  });

  it('toLocalDateKey formats specific local dates accurately', () => {
    const d = new Date(2026, 10, 16); // November 16, 2026
    expect(toLocalDateKey(d)).toBe('2026-11-16');
  });

  it('parseLocalDateKey parses at local midnight', () => {
    const d = parseLocalDateKey('2026-11-16');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10); // 0-indexed November
    expect(d.getDate()).toBe(16);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('addDays correctly crosses month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // Leap year
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01'); // Non-leap year
  });

  it('diffInDays computes accurate calendar day difference', () => {
    expect(diffInDays('2026-11-17', '2026-11-16')).toBe(1);
    expect(diffInDays('2026-11-16', '2026-11-17')).toBe(-1);
    expect(diffInDays('2026-12-01', '2026-11-01')).toBe(30);
  });

  it('handles DST transitions without day dropping or doubling', () => {
    // In many timezones (e.g. US/Europe), DST transitions in March and October/November
    const marchBefore = '2026-03-07';
    const marchAfter = addDays(marchBefore, 2);
    expect(marchAfter).toBe('2026-03-09');
    expect(diffInDays(marchAfter, marchBefore)).toBe(2);

    const novBefore = '2026-10-31';
    const novAfter = addDays(novBefore, 2);
    expect(novAfter).toBe('2026-11-02');
    expect(diffInDays(novAfter, novBefore)).toBe(2);
  });

  it('startOfWeek and endOfWeek align to Monday-Sunday (startDay = 1)', () => {
    // 2026-11-16 is a Monday
    expect(startOfWeek('2026-11-16')).toBe('2026-11-16');
    expect(endOfWeek('2026-11-16')).toBe('2026-11-22');

    // 2026-11-18 is Wednesday of that same week
    expect(startOfWeek('2026-11-18')).toBe('2026-11-16');
    expect(endOfWeek('2026-11-18')).toBe('2026-11-22');

    // 2026-11-22 is Sunday of that same week
    expect(startOfWeek('2026-11-22')).toBe('2026-11-16');
    expect(endOfWeek('2026-11-22')).toBe('2026-11-22');
  });

  it('comparison helpers works accurately', () => {
    expect(isBefore('2026-11-15', '2026-11-16')).toBe(true);
    expect(isBefore('2026-11-16', '2026-11-15')).toBe(false);
    expect(isAfter('2026-11-17', '2026-11-16')).toBe(true);
    expect(isSameOrBefore('2026-11-16', '2026-11-16')).toBe(true);
    expect(isSameOrAfter('2026-11-16', '2026-11-16')).toBe(true);
  });

  it('getDaysInRange returns all keys inclusive', () => {
    const range = getDaysInRange('2026-11-14', '2026-11-17');
    expect(range).toEqual(['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17']);
  });

  it('formatNavigatorDate marks today and relative offset', () => {
    const today = todayKey();
    const nav = formatNavigatorDate(today);
    expect(nav.isToday).toBe(true);
    expect(nav.isPast).toBe(false);
    expect(nav.isFuture).toBe(false);
    expect(nav.title).toBe('Today');

    const yesterday = addDays(today, -1);
    const navY = formatNavigatorDate(yesterday);
    expect(navY.isPast).toBe(true);
    expect(navY.title).toBe('Yesterday');
  });

  it('formatDeadlineRelative calculates overdue and days left', () => {
    const today = todayKey();
    const dueToday = formatDeadlineRelative(today);
    expect(dueToday.text).toBe('Due today');
    expect(dueToday.isDueSoon).toBe(true);
    expect(dueToday.isOverdue).toBe(false);

    const overdue = formatDeadlineRelative(addDays(today, -3));
    expect(overdue.text).toBe('Overdue by 3 days');
    expect(overdue.isOverdue).toBe(true);

    const upcoming = formatDeadlineRelative(addDays(today, 5));
    expect(upcoming.text).toBe('5 days left');
    expect(upcoming.isOverdue).toBe(false);
  });
});
