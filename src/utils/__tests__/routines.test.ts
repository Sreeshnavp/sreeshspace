import { describe, it, expect } from 'vitest';
import { isRoutineScheduledForDate, ensureRoutinesForDate, getRoutineFrequencyLabel } from '../routines';
import type { RoutineItem, TodoItem } from '../../types/todo';

describe('Routines Helper Utilities', () => {
  const dailyRoutine: RoutineItem = {
    id: 'r-daily',
    text: 'Morning Meditation 🧘',
    priority: 'high',
    frequency: 'daily',
    createdAt: new Date().toISOString(),
  };

  const weekdayRoutine: RoutineItem = {
    id: 'r-weekdays',
    text: 'Check work emails 💼',
    priority: 'medium',
    frequency: 'weekdays',
    createdAt: new Date().toISOString(),
  };

  const periodRoutine: RoutineItem = {
    id: 'r-period',
    text: 'Fitness challenge 🏃',
    priority: 'high',
    frequency: 'period',
    startDate: '2026-11-15',
    endDate: '2026-11-25',
    createdAt: new Date().toISOString(),
  };

  it('correctly identifies scheduled dates for daily, weekday, and period routines', () => {
    // 2026-11-18 is a Wednesday
    expect(isRoutineScheduledForDate(dailyRoutine, '2026-11-18')).toBe(true);
    expect(isRoutineScheduledForDate(weekdayRoutine, '2026-11-18')).toBe(true);
    expect(isRoutineScheduledForDate(periodRoutine, '2026-11-18')).toBe(true);

    // 2026-11-22 is a Sunday
    expect(isRoutineScheduledForDate(dailyRoutine, '2026-11-22')).toBe(true);
    expect(isRoutineScheduledForDate(weekdayRoutine, '2026-11-22')).toBe(false);

    // 2026-11-26 is outside period
    expect(isRoutineScheduledForDate(periodRoutine, '2026-11-26')).toBe(false);
  });

  it('automatically adds scheduled routines to the daily todo list without duplicating', () => {
    const existingTodos: TodoItem[] = [];
    const targetDate = '2026-11-18'; // Wednesday

    const { updatedTodos, createdCount } = ensureRoutinesForDate(
      existingTodos,
      [dailyRoutine, weekdayRoutine, periodRoutine],
      targetDate
    );

    expect(createdCount).toBe(3);
    expect(updatedTodos).toHaveLength(3);

    const firstTask = updatedTodos.find((t) => t.recurringId === 'r-daily');
    expect(firstTask).toBeDefined();
    expect(firstTask?.text).toBe('Morning Meditation 🧘');
    expect(firstTask?.date).toBe(targetDate);
    expect(firstTask?.completed).toBe(false);

    // Calling it again on the same date should be completely idempotent (0 new items)
    const secondCall = ensureRoutinesForDate(
      updatedTodos,
      [dailyRoutine, weekdayRoutine, periodRoutine],
      targetDate
    );
    expect(secondCall.createdCount).toBe(0);
    expect(secondCall.updatedTodos).toHaveLength(3);
  });

  it('generates friendly human-readable frequency labels', () => {
    expect(getRoutineFrequencyLabel(dailyRoutine)).toBe('Every Day');
    expect(getRoutineFrequencyLabel(weekdayRoutine)).toBe('Weekdays (Mon–Fri)');
    expect(getRoutineFrequencyLabel(periodRoutine)).toBe('2026-11-15 to 2026-11-25');
  });
});
