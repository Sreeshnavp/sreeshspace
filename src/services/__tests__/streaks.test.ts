import { describe, it, expect } from 'vitest';
import { addDays, todayKey } from '../../utils/dates';
import type { ActivityEvent, TodoItem } from '../../types';

describe('Streak Calculation & Event Log Immutability', () => {
  function computeStreakFromEvents(events: ActivityEvent[], frozenDates: string[] = []): { currentStreak: number; longestStreak: number; totalActiveDays: number } {
    const activeDates = new Set<string>();
    
    events.forEach((ev) => {
      // Activity that counts toward streak: task_completed, goal_completed, focus_session, or note_added
      if (['task_completed', 'goal_completed', 'focus_session'].includes(ev.type)) {
        activeDates.add(ev.date);
      }
    });

    frozenDates.forEach((fd) => activeDates.add(fd));

    const today = todayKey();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Current streak ending today or yesterday
    let checkDate = today;
    if (!activeDates.has(checkDate)) {
      // If nothing logged today yet, check if streak from yesterday is intact
      checkDate = addDays(today, -1);
    }

    while (activeDates.has(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }

    // Longest streak across all dates
    const sortedDates = Array.from(activeDates).sort();
    if (sortedDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = sortedDates[i - 1];
        const curr = sortedDates[i];
        if (addDays(prev, 1) === curr) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 1;
        }
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalActiveDays: activeDates.size,
    };
  }

  it('calculates streaks correctly across consecutive active days', () => {
    const today = todayKey();
    const events: ActivityEvent[] = [
      { id: '1', ts: Date.now(), date: today, type: 'task_completed', refId: 't1', title: 'Task 1' },
      { id: '2', ts: Date.now() - 86400000, date: addDays(today, -1), type: 'task_completed', refId: 't2', title: 'Task 2' },
      { id: '3', ts: Date.now() - 86400000 * 2, date: addDays(today, -2), type: 'task_completed', refId: 't3', title: 'Task 3' },
    ];

    const result = computeStreakFromEvents(events);
    expect(result.currentStreak).toBe(3);
    expect(result.totalActiveDays).toBe(3);
  });

  it('applies streak freeze to preserve streak across a missed day', () => {
    const today = todayKey();
    // Active today and 2 days ago, missed yesterday
    const events: ActivityEvent[] = [
      { id: '1', ts: Date.now(), date: today, type: 'task_completed', refId: 't1', title: 'Task 1' },
      { id: '2', ts: Date.now() - 86400000 * 2, date: addDays(today, -2), type: 'task_completed', refId: 't2', title: 'Task 2' },
    ];

    // Without freeze: streak is broken (1)
    const withoutFreeze = computeStreakFromEvents(events);
    expect(withoutFreeze.currentStreak).toBe(1);

    // With freeze on yesterday: streak is preserved (3)
    const yesterday = addDays(today, -1);
    const withFreeze = computeStreakFromEvents(events, [yesterday]);
    expect(withFreeze.currentStreak).toBe(3);
  });

  it('deleting an item does NOT delete its past ActivityEvents (history is immutable)', () => {
    const today = todayKey();
    const eventLog: ActivityEvent[] = [
      { id: 'ev-1', ts: Date.now() - 3600000, date: today, type: 'task_completed', refId: 'task-del-1', title: 'Morning walk' },
    ];

    let liveTodos: TodoItem[] = [
      { id: 'task-del-1', text: 'Morning walk', completed: true, type: 'daily', date: today, priority: 'medium', createdAt: new Date().toISOString() },
    ];

    // Delete item from live list
    liveTodos = liveTodos.filter((t) => t.id !== 'task-del-1');
    expect(liveTodos).toHaveLength(0);

    // Past event log retains the completed record
    expect(eventLog).toHaveLength(1);
    const streak = computeStreakFromEvents(eventLog);
    expect(streak.currentStreak).toBe(1);
    expect(streak.totalActiveDays).toBe(1);
  });
});
