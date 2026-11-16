import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageTodo } from '../nlpTodoParser';
import { todayKey, addDays } from '../dates';

describe('Natural Language Todo Parser', () => {
  it('parses priority, date and tags accurately', () => {
    const input = 'Pay electricity bills tomorrow !high #finance';
    const result = parseNaturalLanguageTodo(input);

    expect(result.cleanText).toBe('Pay electricity bills');
    expect(result.priority).toBe('high');
    expect(result.dateKey).toBe(addDays(todayKey(), 1));
    expect(result.tags).toEqual(['finance']);
  });

  it('detects routines like every weekday', () => {
    const input = 'Morning team standup every weekday !medium #work';
    const result = parseNaturalLanguageTodo(input);

    expect(result.cleanText).toBe('Morning team standup');
    expect(result.priority).toBe('medium');
    expect(result.isRoutine).toBe(true);
    expect(result.routineFrequency).toBe('weekdays');
    expect(result.tags).toEqual(['work']);
  });

  it('parses relative day offsets like in 3 days', () => {
    const input = 'Submit paper in 3 days !low';
    const result = parseNaturalLanguageTodo(input);

    expect(result.cleanText).toBe('Submit paper');
    expect(result.priority).toBe('low');
    expect(result.dateKey).toBe(addDays(todayKey(), 3));
  });
});
