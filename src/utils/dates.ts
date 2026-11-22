/**
 * SreeshSpace Date Utilities
 * 
 * Strict rule: All date keys are local machine calendar dates in "YYYY-MM-DD" format.
 * Never use .toISOString().slice(0, 10) as UTC slicing produces incorrect dates across timezones!
 */

/**
 * Returns two-digit padded string
 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Converts a Date object, timestamp, or string into a local "YYYY-MM-DD" string.
 */
export function toLocalDateKey(input?: Date | string | number | null): string {
  if (!input) {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }

  const d = typeof input === 'object' && input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }

  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Returns today's date in local calendar "YYYY-MM-DD".
 */
export function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a local Date object set at 00:00:00.000 local time.
 */
export function parseLocalDateKey(key: string): Date {
  const parts = key.split('-');
  if (parts.length !== 3) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Adds or subtracts calendar days from a "YYYY-MM-DD" string, safe across month/year and DST boundaries.
 */
export function addDays(key: string, days: number): string {
  const d = parseLocalDateKey(key);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Calculates calendar day difference between keyA and keyB (keyA - keyB).
 * E.g. diffInDays("2026-11-17", "2026-11-16") === 1
 */
export function diffInDays(keyA: string, keyB: string): number {
  const dateA = parseLocalDateKey(keyA);
  const dateB = parseLocalDateKey(keyB);
  const msPerDay = 1000 * 60 * 60 * 24;
  // Use noon to guard against 23-hour / 25-hour DST transitions
  dateA.setHours(12, 0, 0, 0);
  dateB.setHours(12, 0, 0, 0);
  return Math.round((dateA.getTime() - dateB.getTime()) / msPerDay);
}

/**
 * Returns the start of the week for a given date key.
 * @param startDay 0 for Sunday, 1 for Monday (default 1)
 */
export function startOfWeek(key: string, startDay = 1): string {
  const d = parseLocalDateKey(key);
  const currentDay = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = (currentDay - startDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Returns the end of the week (6 days after start of week).
 */
export function endOfWeek(key: string, startDay = 1): string {
  const start = startOfWeek(key, startDay);
  return addDays(start, 6);
}

/**
 * Check if keyA is strictly before keyB
 */
export function isBefore(keyA: string, keyB: string): boolean {
  return keyA < keyB;
}

/**
 * Check if keyA is strictly after keyB
 */
export function isAfter(keyA: string, keyB: string): boolean {
  return keyA > keyB;
}

/**
 * Check if keyA is before or on keyB
 */
export function isSameOrBefore(keyA: string, keyB: string): boolean {
  return keyA <= keyB;
}

/**
 * Check if keyA is after or on keyB
 */
export function isSameOrAfter(keyA: string, keyB: string): boolean {
  return keyA >= keyB;
}

/**
 * Formats a date key for display in the day navigator:
 * E.g., "Today · Mon 16 Nov", "Yesterday · Sun 15 Nov", "Tomorrow · Tue 17 Nov", or "Wed 18 Nov"
 */
export function formatNavigatorDate(key: string): { title: string; subtitle: string; isToday: boolean; isPast: boolean; isFuture: boolean } {
  const today = todayKey();
  const d = parseLocalDateKey(key);
  
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();

  const formattedDate = year === currentYear ? `${weekday} ${day} ${month}` : `${weekday} ${day} ${month} ${year}`;
  
  const diff = diffInDays(key, today);
  let title = formattedDate;
  let subtitle = '';

  if (diff === 0) {
    title = 'Today';
    subtitle = formattedDate;
  } else if (diff === -1) {
    title = 'Yesterday';
    subtitle = formattedDate;
  } else if (diff === 1) {
    title = 'Tomorrow';
    subtitle = formattedDate;
  } else {
    title = formattedDate;
    if (diff < 0) {
      subtitle = `${Math.abs(diff)} days ago`;
    } else {
      subtitle = `In ${diff} days`;
    }
  }

  return {
    title,
    subtitle,
    isToday: diff === 0,
    isPast: diff < 0,
    isFuture: diff > 0,
  };
}

/**
 * Formats relative deadline for permanent goals:
 * E.g., "Due today", "Due tomorrow", "3 days left", "Overdue by 2 days"
 */
export function formatDeadlineRelative(endDateKey?: string): { text: string; isOverdue: boolean; isDueSoon: boolean; daysLeft: number } {
  if (!endDateKey) {
    return { text: 'Ongoing', isOverdue: false, isDueSoon: false, daysLeft: 9999 };
  }

  const today = todayKey();
  const diff = diffInDays(endDateKey, today);

  if (diff < 0) {
    const abs = Math.abs(diff);
    return {
      text: abs === 1 ? 'Overdue by 1 day' : `Overdue by ${abs} days`,
      isOverdue: true,
      isDueSoon: false,
      daysLeft: diff,
    };
  }

  if (diff === 0) {
    return { text: 'Due today', isOverdue: false, isDueSoon: true, daysLeft: 0 };
  }

  if (diff === 1) {
    return { text: 'Due tomorrow', isOverdue: false, isDueSoon: true, daysLeft: 1 };
  }

  if (diff <= 3) {
    return { text: `${diff} days left`, isOverdue: false, isDueSoon: true, daysLeft: diff };
  }

  if (diff < 30) {
    return { text: `${diff} days left`, isOverdue: false, isDueSoon: false, daysLeft: diff };
  }

  const months = Math.round(diff / 30);
  return {
    text: months === 1 ? '~1 month left' : `~${months} months left`,
    isOverdue: false,
    isDueSoon: false,
    daysLeft: diff,
  };
}

/**
 * Returns all dates between startKey and endKey inclusive.
 */
export function getDaysInRange(startKey: string, endKey: string): string[] {
  const result: string[] = [];
  let curr = startKey;
  while (curr <= endKey) {
    result.push(curr);
    curr = addDays(curr, 1);
  }
  return result;
}

/**
 * Generates an .ics file string for adding a goal deadline to Google / Apple Calendar.
 */
export function generateIcsCalendar(title: string, dateKey: string, description = ''): string {
  const dateFormatted = dateKey.replace(/-/g, '');
  const uid = `sreeshspace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@sreeshspace`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Orbit//Habit & Goal Vault//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dateFormatted}T090000Z`,
    `DTSTART;VALUE=DATE:${dateFormatted}`,
    `DTEND;VALUE=DATE:${dateFormatted}`,
    `SUMMARY:🎯 Goal Due: ${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Returns ISO week number for a given date key or Date object.
 */
export function getWeekNumber(dateInput?: string | Date): number {
  const d = dateInput 
    ? (typeof dateInput === 'string' ? parseLocalDateKey(dateInput) : new Date(dateInput.getTime()))
    : new Date();
  const dUtc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dUtc.getUTCDay() || 7;
  dUtc.setUTCDate(dUtc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dUtc.getUTCFullYear(), 0, 1));
  return Math.ceil((((dUtc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
