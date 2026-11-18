import type { RoutineItem, TodoItem } from '../types/todo';

/**
 * Checks if a routine is active and scheduled to appear on a given calendar date (YYYY-MM-DD).
 */
export function isRoutineScheduledForDate(routine: RoutineItem, dateKey: string): boolean {
  if (routine.active === false) return false;

  // Date Range bounds check
  if (routine.startDate && dateKey < routine.startDate) return false;
  if (routine.endDate && dateKey > routine.endDate) return false;

  const dateObj = new Date(dateKey + 'T00:00:00');
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  switch (routine.frequency) {
    case 'daily':
      return true;

    case 'weekdays':
      return isWeekday;

    case 'weekends':
      return isWeekend;

    case 'custom':
      if (Array.isArray(routine.daysOfWeek) && routine.daysOfWeek.length > 0) {
        return routine.daysOfWeek.includes(dayOfWeek);
      }
      return true;

    case 'period':
      // If specific days of week are also chosen in a period
      if (Array.isArray(routine.daysOfWeek) && routine.daysOfWeek.length > 0) {
        return routine.daysOfWeek.includes(dayOfWeek);
      }
      return true;

    default:
      return true;
  }
}

/**
 * Automatically creates daily todo items for scheduled routines on a specific dateKey.
 * Guarantees idempotency: will never duplicate a task if one already exists for this routine on this date.
 */
export function ensureRoutinesForDate(
  todos: TodoItem[],
  routines: RoutineItem[],
  dateKey: string
): { updatedTodos: TodoItem[]; createdCount: number } {
  if (!routines || routines.length === 0) {
    return { updatedTodos: todos, createdCount: 0 };
  }

  const newItems: TodoItem[] = [];

  for (const routine of routines) {
    if (!isRoutineScheduledForDate(routine, dateKey)) continue;

    const deterministicId = `routine_inst_${routine.id}_${dateKey}`;

    // Check if an instance already exists for this routine on this date
    const exists = todos.some(
      (t) =>
        t.type === 'daily' &&
        t.date === dateKey &&
        (t.recurringId === routine.id || t.id === deterministicId)
    );

    if (!exists) {
      newItems.push({
        id: deterministicId,
        text: routine.text,
        completed: false,
        type: 'daily',
        priority: routine.priority || 'medium',
        date: dateKey,
        recurringId: routine.id,
        tags: routine.tags,
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (newItems.length === 0) {
    return { updatedTodos: todos, createdCount: 0 };
  }

  return {
    updatedTodos: [...todos, ...newItems],
    createdCount: newItems.length,
  };
}

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Generates a clean human-readable schedule label for a routine.
 */
export function getRoutineFrequencyLabel(routine: RoutineItem): string {
  if (routine.frequency === 'daily') {
    if (routine.startDate && routine.endDate) {
      return `Daily (${routine.startDate} to ${routine.endDate})`;
    }
    return 'Every Day';
  }

  if (routine.frequency === 'weekdays') {
    return 'Weekdays (Mon–Fri)';
  }

  if (routine.frequency === 'weekends') {
    return 'Weekends (Sat–Sun)';
  }

  if (routine.frequency === 'period') {
    const range = routine.startDate && routine.endDate
      ? `${routine.startDate} to ${routine.endDate}`
      : routine.startDate
      ? `From ${routine.startDate}`
      : routine.endDate
      ? `Until ${routine.endDate}`
      : 'Active Period';
    if (Array.isArray(routine.daysOfWeek) && routine.daysOfWeek.length > 0) {
      const days = routine.daysOfWeek.map((d) => DAY_NAMES_SHORT[d]).join(', ');
      return `${range} (${days})`;
    }
    return range;
  }

  if (routine.frequency === 'custom' && Array.isArray(routine.daysOfWeek) && routine.daysOfWeek.length > 0) {
    return routine.daysOfWeek.map((d) => DAY_NAMES_SHORT[d]).join(', ');
  }

  return 'Every Day';
}
