import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockDb = new Map<string, any>();

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => mockDb.get(key)),
  set: vi.fn(async (key: string, val: any) => mockDb.set(key, val)),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import {
  loadRolloverDecisions,
  recordRolloverDecision,
  isRolloverDecided,
} from '../storage';
import type { TodoItem } from '../../types';

describe('Rollover Decisions Persistence', () => {
  beforeEach(() => {
    mockDb.clear();
    localStorageMock.clear();
  });

  it('records and retrieves rollover decision for a given date', async () => {
    expect(await isRolloverDecided('2026-11-19')).toBe(false);

    await recordRolloverDecision('2026-11-19', 'left_behind', {
      candidateTaskIds: ['task-video-1'],
    });

    expect(await isRolloverDecided('2026-11-19')).toBe(true);

    const decisions = await loadRolloverDecisions();
    expect(decisions['2026-11-19']).toBeDefined();
    expect(decisions['2026-11-19'].action).toBe('left_behind');
    expect(decisions['2026-11-19'].candidateTaskIds).toEqual(['task-video-1']);
  });

  it('filters out left-behind and archived tasks from subsequent rollover prompts', () => {
    const yesterday = '2026-11-19';
    const tasks: TodoItem[] = [
      {
        id: 'task-1',
        text: 'Make a video and upload',
        type: 'daily',
        date: yesterday,
        priority: 'medium',
        createdAt: '2026-11-19T10:00:00.000Z',
        completed: false,
        status: 'archived',
        rolloverDecision: 'left_behind',
        rolloverHandled: true,
      },
      {
        id: 'task-2',
        text: 'Completed task',
        type: 'daily',
        date: yesterday,
        priority: 'medium',
        createdAt: '2026-11-19T10:00:00.000Z',
        completed: true,
      },
    ];

    // Simulating App.tsx filter logic
    const candidates = tasks.filter(
      (t) =>
        (t.type || 'permanent') === 'daily' &&
        t.date === yesterday &&
        !t.completed &&
        t.status !== 'archived' &&
        !t.rolloverHandled &&
        t.rolloverDecision !== 'left_behind'
    );

    // Candidates should be empty because task-1 is left_behind/archived
    expect(candidates.length).toBe(0);
  });
});
