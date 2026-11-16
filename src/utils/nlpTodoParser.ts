import { todayKey, addDays } from './dates';
import type { PriorityLevel } from '../types';

export interface ParsedTodoInput {
  cleanText: string;
  dateKey?: string;
  priority?: PriorityLevel;
  tags: string[];
  isRoutine?: boolean;
  routineFrequency?: 'daily' | 'weekdays';
}

export function parseNaturalLanguageTodo(rawInput: string): ParsedTodoInput {
  let text = rawInput.trim();
  const today = todayKey();
  let dateKey: string | undefined = undefined;
  let priority: PriorityLevel | undefined = undefined;
  const tags: string[] = [];
  let isRoutine = false;
  let routineFrequency: 'daily' | 'weekdays' | undefined = undefined;

  // 1. Extract priority (!high, !medium, !low, !urgent, !1, !2, !3)
  if (/(?:^|\s)!high\b/i.test(text) || /(?:^|\s)!urgent\b/i.test(text) || /(?:^|\s)!1\b/.test(text)) {
    priority = 'high';
    text = text.replace(/(?:^|\s)!(?:high|urgent|1)\b/gi, '');
  } else if (/(?:^|\s)!medium\b/i.test(text) || /(?:^|\s)!med\b/i.test(text) || /(?:^|\s)!2\b/.test(text)) {
    priority = 'medium';
    text = text.replace(/(?:^|\s)!(?:medium|med|2)\b/gi, '');
  } else if (/(?:^|\s)!low\b/i.test(text) || /(?:^|\s)!3\b/.test(text)) {
    priority = 'low';
    text = text.replace(/(?:^|\s)!(?:low|3)\b/gi, '');
  }

  // 2. Extract tags (#tag)
  const tagMatches = text.match(/(?:^|\s)#([a-zA-Z0-9_\-]+)/g);
  if (tagMatches) {
    tagMatches.forEach((m) => {
      const cleanTag = m.trim().replace(/^#/, '');
      if (cleanTag && !tags.includes(cleanTag)) {
        tags.push(cleanTag);
      }
    });
    text = text.replace(/(?:^|\s)#[a-zA-Z0-9_\-]+/g, '');
  }

  // 3. Routine detection ("every day", "every weekday")
  if (/(?:^|\s)every\s+weekday\b/i.test(text)) {
    isRoutine = true;
    routineFrequency = 'weekdays';
    text = text.replace(/(?:^|\s)every\s+weekday\b/gi, '');
  } else if (/(?:^|\s)every\s+day\b/i.test(text) || /(?:^|\s)daily\b/i.test(text)) {
    isRoutine = true;
    routineFrequency = 'daily';
    text = text.replace(/(?:^|\s)(?:every\s+day|daily)\b/gi, '');
  }

  // 4. Relative dates ("today", "tomorrow", "in N days", "next week")
  if (/(?:^|\s)tomorrow\b/i.test(text)) {
    dateKey = addDays(today, 1);
    text = text.replace(/(?:^|\s)tomorrow\b/gi, '');
  } else if (/(?:^|\s)today\b/i.test(text)) {
    dateKey = today;
    text = text.replace(/(?:^|\s)today\b/gi, '');
  } else if (/(?:^|\s)next\s+week\b/i.test(text)) {
    dateKey = addDays(today, 7);
    text = text.replace(/(?:^|\s)next\s+week\b/gi, '');
  } else {
    const inDaysMatch = text.match(/(?:^|\s)in\s+(\d+)\s+days?\b/i);
    if (inDaysMatch) {
      const daysCount = parseInt(inDaysMatch[1], 10);
      if (!isNaN(daysCount)) {
        dateKey = addDays(today, daysCount);
      }
      text = text.replace(/(?:^|\s)in\s+\d+\s+days?\b/gi, '');
    }
  }

  // Clean extra spaces
  const clean = text.replace(/\s+/g, ' ').trim();

  return {
    cleanText: clean,
    dateKey,
    priority,
    tags,
    isRoutine,
    routineFrequency,
  };
}
