import { todayKey, addDays, toLocalDateKey } from './dates';
import type { StreakState, ActivityEvent, TodoItem, DayLog } from '../types';

export interface StreakCalculatorOptions {
  today?: string;
  priorities?: Array<{ date?: string; completed?: boolean; text?: string }>;
  habitsCompletedToday?: boolean;
  todos?: TodoItem[];
  dayLogs?: Record<string, DayLog>;
  events?: ActivityEvent[];
  frozenDates?: string[];
  freezesRemaining?: number;
}

export interface ComputedStreakResult extends StreakState {
  isTodayActive: boolean;
  activeDates: string[];
}

/**
 * Computes accurate, real-time streak from today backwards based on actual completions.
 * 
 * Rules:
 * 1. A date D is active if the user completed a habit, priority, or task on that date,
 *    or logged a completion event / dayLog, or applied a streak freeze.
 * 2. If today has at least one completion, streak counts consecutive days starting from today backwards.
 * 3. If today has NO completions yet, but yesterday was active, the streak is preserved from yesterday backwards
 *    (giving the user the entire day to complete tasks and extend the streak).
 * 4. If neither today nor yesterday had any activity, the streak is broken (0).
 */
export function computeStreakState(options: StreakCalculatorOptions = {}): ComputedStreakResult {
  const today = options.today || todayKey();
  const activeDateSet = new Set<string>();

  // 1. Priorities (completed tasks on their scheduled date)
  if (options.priorities && options.priorities.length > 0) {
    options.priorities.forEach((p) => {
      if (p.completed && p.date) {
        activeDateSet.add(p.date);
      }
    });
  }

  // 2. Habits (completed today)
  if (options.habitsCompletedToday) {
    activeDateSet.add(today);
  }

  // 3. Todos (completed daily/permanent tasks)
  if (options.todos && options.todos.length > 0) {
    options.todos.forEach((t) => {
      if (t.completed) {
        if (t.date) {
          activeDateSet.add(t.date);
        } else if (t.completedAt) {
          activeDateSet.add(toLocalDateKey(t.completedAt));
        }
      }
    });
  }

  // 4. Day logs (recorded completion days)
  if (options.dayLogs) {
    Object.entries(options.dayLogs).forEach(([dateKey, log]) => {
      if (log && ((typeof log.completed === 'number' && log.completed > 0) || (log.completed as any) === true)) {
        activeDateSet.add(dateKey);
      }
    });
  }

  // 5. Activity Events (task_completed, routine_completed, goal_completed, focus_session)
  if (options.events && options.events.length > 0) {
    options.events.forEach((ev) => {
      if (['task_completed', 'routine_completed', 'goal_completed', 'focus_session'].includes(ev.type)) {
        if (ev.date) {
          activeDateSet.add(ev.date);
        } else if (ev.ts) {
          activeDateSet.add(toLocalDateKey(ev.ts));
        }
      }
    });
  }

  // 6. Frozen dates (streak freeze protections)
  if (options.frozenDates && options.frozenDates.length > 0) {
    options.frozenDates.forEach((fd) => {
      if (fd) activeDateSet.add(fd);
    });
  }

  // Streak Calculation from Today backwards
  const isTodayActive = activeDateSet.has(today);
  const yesterday = addDays(today, -1);
  const isYesterdayActive = activeDateSet.has(yesterday);

  let currentStreak = 0;
  let checkDate: string | null = null;

  if (isTodayActive) {
    checkDate = today;
  } else if (isYesterdayActive) {
    checkDate = yesterday;
  }

  if (checkDate) {
    while (activeDateSet.has(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }
  }

  // Longest streak calculation across all historic active dates
  const sortedDates = Array.from(activeDateSet).sort();
  let longestStreak = currentStreak;

  if (sortedDates.length > 0) {
    let tempStreak = 1;
    let maxStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = sortedDates[i - 1];
      const curr = sortedDates[i];
      if (addDays(prev, 1) === curr) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else if (prev !== curr) {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(maxStreak, currentStreak);
  }

  const lastActiveDate = isTodayActive ? today : isYesterdayActive ? yesterday : undefined;

  return {
    currentStreak,
    longestStreak,
    totalActiveDays: activeDateSet.size,
    freezesRemaining: options.freezesRemaining ?? 1,
    frozenDates: options.frozenDates ?? [],
    lastActiveDate,
    isTodayActive,
    activeDates: sortedDates,
  };
}
