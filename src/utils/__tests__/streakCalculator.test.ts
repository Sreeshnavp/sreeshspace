import { describe, it, expect } from 'vitest';
import { computeStreakState } from '../streakCalculator';
import { addDays } from '../dates';

describe('Accurate Streak Calculation from Today', () => {
  const TODAY = '2026-11-22'; // Sunday
  const YESTERDAY = addDays(TODAY, -1); // Saturday 2026-11-21
  const TWO_DAYS_AGO = addDays(TODAY, -2); // Friday 2026-11-20
  const THREE_DAYS_AGO = addDays(TODAY, -3); // Thursday 2026-11-19
  const FOUR_DAYS_AGO = addDays(TODAY, -4); // Wednesday 2026-11-18

  it('returns 0 streak when there are no completions at all', () => {
    const result = computeStreakState({
      today: TODAY,
      priorities: [],
      habitsCompletedToday: false,
      todos: [],
    });

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalActiveDays).toBe(0);
    expect(result.isTodayActive).toBe(false);
  });

  it('preserves streak ending yesterday if nothing has been completed today yet', () => {
    // Active on Thursday, Friday, and Saturday. Today is Sunday (nothing logged yet).
    const priorities = [
      { date: YESTERDAY, completed: true, text: 'Weekend reset' },
      { date: TWO_DAYS_AGO, completed: true, text: 'Sprint retro' },
      { date: THREE_DAYS_AGO, completed: true, text: 'Feed sync' },
    ];

    const result = computeStreakState({
      today: TODAY,
      priorities,
      habitsCompletedToday: false,
    });

    expect(result.currentStreak).toBe(3);
    expect(result.isTodayActive).toBe(false);
    expect(result.lastActiveDate).toBe(YESTERDAY);
  });

  it('extends streak to include today as soon as a habit or priority is completed today', () => {
    // Active on Thursday, Friday, Saturday, and now Sunday (Today).
    const priorities = [
      { date: TODAY, completed: true, text: 'Deploy to Vercel' },
      { date: YESTERDAY, completed: true, text: 'Weekend reset' },
      { date: TWO_DAYS_AGO, completed: true, text: 'Sprint retro' },
      { date: THREE_DAYS_AGO, completed: true, text: 'Feed sync' },
    ];

    const result = computeStreakState({
      today: TODAY,
      priorities,
      habitsCompletedToday: true,
    });

    expect(result.currentStreak).toBe(4);
    expect(result.isTodayActive).toBe(true);
    expect(result.lastActiveDate).toBe(TODAY);
  });

  it('breaks streak when a day is missed', () => {
    // Active 4 days ago and 3 days ago, but missed Friday (TWO_DAYS_AGO) and Saturday (YESTERDAY).
    const priorities = [
      { date: FOUR_DAYS_AGO, completed: true, text: 'Old task 1' },
      { date: THREE_DAYS_AGO, completed: true, text: 'Old task 2' },
    ];

    const result = computeStreakState({
      today: TODAY,
      priorities,
      habitsCompletedToday: false,
    });

    // Since yesterday was missed and today has no completions, current streak is 0
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(2);
    expect(result.totalActiveDays).toBe(2);
  });

  it('starts day 1 streak when user completes task today after a gap', () => {
    // Gap on yesterday, but active today
    const priorities = [
      { date: TODAY, completed: true, text: 'New task today' },
      { date: THREE_DAYS_AGO, completed: true, text: 'Old task' },
    ];

    const result = computeStreakState({
      today: TODAY,
      priorities,
    });

    expect(result.currentStreak).toBe(1);
    expect(result.isTodayActive).toBe(true);
  });

  it('protects a missed day using streak freeze', () => {
    // Active today and Friday, but missed Saturday (YESTERDAY).
    // Saturday is in frozenDates.
    const priorities = [
      { date: TODAY, completed: true, text: 'Today task' },
      { date: TWO_DAYS_AGO, completed: true, text: 'Friday task' },
    ];

    const result = computeStreakState({
      today: TODAY,
      priorities,
      frozenDates: [YESTERDAY],
    });

    // Friday (1) + Saturday (frozen, 1) + Today (1) = 3 Day Streak!
    expect(result.currentStreak).toBe(3);
  });

  it('correctly aggregates across habits, priorities, todos, and dayLogs', () => {
    const result = computeStreakState({
      today: TODAY,
      habitsCompletedToday: true, // Today active via habits
      priorities: [{ date: YESTERDAY, completed: true, text: 'P1' }], // Yesterday active via priority
      todos: [{ id: 't1', date: TWO_DAYS_AGO, completed: true, text: 'T1', type: 'daily', priority: 'medium', createdAt: '' }], // 2 days ago active via todo
      dayLogs: {
        [THREE_DAYS_AGO]: { date: THREE_DAYS_AGO, completed: 2, planned: 3 }, // 3 days ago active via dayLog
      },
    });

    expect(result.currentStreak).toBe(4);
    expect(result.totalActiveDays).toBe(4);
    expect(result.longestStreak).toBe(4);
  });
});
