import { describe, it, expect } from 'vitest';
import { mergeItemsById, mergeVaultData } from '../syncService';
import type { LinkItem, TodoItem, NoteItem } from '../../types';

describe('syncService - merge algorithms', () => {
  it('merges items by id taking the newer timestamp', () => {
    const localLinks: LinkItem[] = [
      {
        id: '1',
        title: 'Old Title',
        url: 'https://example.com',
        category: 'work',
        notes: '',
        pinned: false,
        attachments: [],
        clicks: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
      },
      {
        id: '2',
        title: 'Local Only',
        url: 'https://local.com',
        category: 'work',
        notes: '',
        pinned: false,
        attachments: [],
        clicks: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T10:00:00.000Z',
      },
    ];

    const remoteLinks: LinkItem[] = [
      {
        id: '1',
        title: 'Newer Title from Phone',
        url: 'https://example.com/phone',
        category: 'work',
        notes: '',
        pinned: true,
        attachments: [],
        clicks: 5,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T10:00:00.000Z', // newer
      },
      {
        id: '3',
        title: 'Remote Only',
        url: 'https://remote.com',
        category: 'work',
        notes: '',
        pinned: false,
        attachments: [],
        clicks: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T12:00:00.000Z',
      },
    ];

    const merged = mergeItemsById(
      localLinks,
      remoteLinks,
      (l) => new Date(l.updatedAt || l.createdAt || 0).getTime()
    );

    expect(merged.length).toBe(3);
    const item1 = merged.find((l) => l.id === '1');
    expect(item1?.title).toBe('Newer Title from Phone');
    expect(item1?.clicks).toBe(5);

    const item2 = merged.find((l) => l.id === '2');
    expect(item2?.title).toBe('Local Only');

    const item3 = merged.find((l) => l.id === '3');
    expect(item3?.title).toBe('Remote Only');
  });

  it('correctly merges todos across devices without losing tasks', () => {
    const localTodos: TodoItem[] = [
      {
        id: 't-1',
        text: 'Drink water',
        completed: false,
        type: 'daily',
        date: '2026-11-16',
        priority: 'high',
        createdAt: '2026-11-16T08:00:00.000Z',
      },
    ];

    const remoteTodos: TodoItem[] = [
      {
        id: 't-1',
        text: 'Drink water',
        completed: true,
        completedAt: '2026-11-16T12:00:00.000Z',
        type: 'daily',
        date: '2026-11-16',
        priority: 'high',
        createdAt: '2026-11-16T08:00:00.000Z',
      },
      {
        id: 't-2',
        text: 'Added from mobile',
        completed: false,
        type: 'daily',
        date: '2026-11-16',
        priority: 'medium',
        createdAt: '2026-11-16T13:00:00.000Z',
      },
    ];

    const mergedVault = mergeVaultData(
      {
        links: [],
        categories: [],
        todos: localTodos,
        notes: [],
        events: [],
        daylogs: {},
        routines: [],
        streak: { currentStreak: 3, longestStreak: 5, totalActiveDays: 10, freezesRemaining: 1, frozenDates: [] },
      },
      {
        todos: remoteTodos,
        streak: { currentStreak: 4, longestStreak: 5, totalActiveDays: 11, freezesRemaining: 1, frozenDates: ['2026-11-10'] },
      }
    );

    expect(mergedVault.todos.length).toBe(2);
    const t1 = mergedVault.todos.find((t) => t.id === 't-1');
    expect(t1?.completed).toBe(true);

    const t2 = mergedVault.todos.find((t) => t.id === 't-2');
    expect(t2?.text).toBe('Added from mobile');

    expect(mergedVault.streak.currentStreak).toBe(4);
    expect(mergedVault.streak.totalActiveDays).toBe(11);
    expect(mergedVault.streak.frozenDates).toContain('2026-11-10');
  });
});
