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

  it('resets streak to 0 and drops pre-reset events when streakResetAt is present in settings', () => {
    const cutoff = '2026-11-17T16:20:00.000Z';
    const cutoffTs = new Date(cutoff).getTime();
    const merged = mergeVaultData(
      {
        links: [],
        categories: [],
        todos: [
          {
            id: 't-1',
            text: 'Live task',
            completed: false,
            type: 'daily',
            date: '2026-11-17',
            priority: 'medium',
            createdAt: '2026-11-17T08:00:00.000Z',
          },
        ],
        notes: [],
        events: [
          { id: 'ev-old', ts: cutoffTs - 10000, date: '2026-11-17', type: 'task_completed', refId: 't1', title: 'Old task' },
        ],
        daylogs: {},
        routines: [],
        streak: { currentStreak: 7, longestStreak: 7, totalActiveDays: 7, freezesRemaining: 0, frozenDates: ['2026-11-16'] },
        settings: { streakResetAt: cutoff },
      },
      {
        streak: { currentStreak: 7, longestStreak: 7, totalActiveDays: 7, freezesRemaining: 0, frozenDates: ['2026-11-16'] },
      }
    );

    expect(merged.streak.currentStreak).toBe(0);
    expect(merged.streak.longestStreak).toBe(0);
    expect(merged.streak.totalActiveDays).toBe(0);
    expect(merged.events.length).toBe(0);
  });

  it('preserves uncompleted status when unclicking a previously completed task', () => {
    const uncompletedAt = '2026-11-17T11:10:00.000Z';
    const completedEarlierAt = '2026-11-17T11:08:00.000Z';

    const merged = mergeVaultData(
      {
        links: [],
        categories: [],
        todos: [
          {
            id: 't-unclicked',
            text: 'My daily task',
            completed: false,
            type: 'daily',
            date: '2026-11-17',
            priority: 'medium',
            createdAt: '2026-11-17T11:00:00.000Z',
            updatedAt: uncompletedAt, // User unclicked task at 11:10
          },
        ],
        notes: [],
        events: [],
        daylogs: {},
        routines: [],
        streak: { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, freezesRemaining: 1, frozenDates: [] },
      },
      {
        todos: [
          {
            id: 't-unclicked',
            text: 'My daily task',
            completed: true,
            completedAt: completedEarlierAt, // Remote had it completed at 11:08
            type: 'daily',
            date: '2026-11-17',
            priority: 'medium',
            createdAt: '2026-11-17T11:00:00.000Z',
          },
        ],
        events: [
          {
            id: 'ev-done',
            ts: new Date(completedEarlierAt).getTime(),
            date: '2026-11-17',
            type: 'task_completed',
            refId: 't-unclicked',
            title: 'My daily task',
          },
        ],
      }
    );

    const task = merged.todos.find((t) => t.id === 't-unclicked');
    expect(task).toBeDefined();
    expect(task?.completed).toBe(false);
    expect(merged.events.filter((e) => e.refId === 't-unclicked')).toHaveLength(0);
  });

  it('merges wallpaper settings taking the newer timestamp', () => {
    const mergedVault = mergeVaultData(
      {
        links: [],
        categories: [],
        todos: [],
        notes: [],
        events: [],
        daylogs: {},
        routines: [],
        streak: { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, freezesRemaining: 1, frozenDates: [] },
        settings: {
          wallpaper: {
            imageUrl: 'data:image/png;base64,old',
            opacity: 0.2,
            blur: 0,
            enabled: true,
            updatedAt: '2026-11-16T10:00:00.000Z',
          },
        },
      },
      {
        settings: {
          wallpaper: {
            imageUrl: 'data:image/png;base64,new',
            opacity: 0.45,
            blur: 2,
            enabled: true,
            updatedAt: '2026-11-16T12:00:00.000Z',
          },
        },
      }
    );

    expect(mergedVault.settings?.wallpaper?.imageUrl).toBe('data:image/png;base64,new');
    expect(mergedVault.settings?.wallpaper?.opacity).toBe(0.45);
  });

  it('prevents uninitialized or incognito client with null imageUrl from erasing remote wallpaper', () => {
    // Simulates an incognito tab or newly opened tab where local cache is completely empty
    const incognitoVault = {
      links: [],
      categories: [],
      todos: [],
      notes: [],
      events: [],
      daylogs: {},
      routines: [],
      streak: { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, freezesRemaining: 1, frozenDates: [] },
      settings: {
        wallpaper: {
          imageUrl: null,
          opacity: 0.25,
          blur: 0,
          enabled: true,
          updatedAt: '1970-01-01T00:00:00.000Z',
        },
      },
    };

    const remoteVault = {
      settings: {
        wallpaper: {
          imageUrl: 'data:image/webp;base64,validWallpaperData',
          opacity: 0.35,
          blur: 4,
          enabled: true,
          updatedAt: '2026-11-17T05:00:00.000Z',
        },
      },
    };

    const merged = mergeVaultData(incognitoVault, remoteVault);
    expect(merged.settings?.wallpaper?.imageUrl).toBe('data:image/webp;base64,validWallpaperData');
    expect(merged.settings?.wallpaper?.opacity).toBe(0.35);
    expect(merged.settings?.wallpaper?.blur).toBe(4);
  });

  it('allows explicit user deletion with removedAt to delete remote wallpaper', () => {
    const userDeletedVault = {
      links: [],
      categories: [],
      todos: [],
      notes: [],
      events: [],
      daylogs: {},
      routines: [],
      streak: { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, freezesRemaining: 1, frozenDates: [] },
      settings: {
        wallpaper: {
          imageUrl: null,
          opacity: 0.25,
          blur: 0,
          enabled: false,
          updatedAt: '2026-11-17T06:00:00.000Z',
          removedAt: '2026-11-17T06:00:00.000Z',
        },
      },
    };

    const remoteVault = {
      settings: {
        wallpaper: {
          imageUrl: 'data:image/webp;base64,oldWallpaper',
          opacity: 0.3,
          blur: 0,
          enabled: true,
          updatedAt: '2026-11-17T05:00:00.000Z', // older than removedAt
        },
      },
    };

    const merged = mergeVaultData(userDeletedVault, remoteVault);
    expect(merged.settings?.wallpaper?.imageUrl).toBeNull();
  });

  it('prevents deleted todos from being resurrected by remote cloud sync using tombstones', () => {
    // User deleted 'todo-deleted-1' locally
    const localVault = {
      links: [],
      categories: [],
      todos: [
        {
          id: 'todo-active-2',
          text: 'Still active task',
          completed: false,
          type: 'daily' as const,
          priority: 'medium' as const,
          createdAt: '2026-11-17T08:00:00.000Z',
        },
      ],
      notes: [],
      events: [],
      daylogs: {},
      routines: [],
      streak: { currentStreak: 1, longestStreak: 1, totalActiveDays: 1, freezesRemaining: 1, frozenDates: [] },
      settings: {
        tombstones: {
          'todo-deleted-1': '2026-11-17T09:00:00.000Z', // Deleted at 9:00 AM
        },
      },
    };

    // Remote database still has 'todo-deleted-1' from an earlier sync (created at 7:00 AM)
    const remoteVault = {
      todos: [
        {
          id: 'todo-deleted-1',
          text: 'Old task that was deleted',
          completed: false,
          type: 'daily' as const,
          priority: 'medium' as const,
          createdAt: '2026-11-17T07:00:00.000Z',
        },
        {
          id: 'todo-active-2',
          text: 'Still active task',
          completed: false,
          type: 'daily' as const,
          priority: 'medium' as const,
          createdAt: '2026-11-17T08:00:00.000Z',
        },
      ],
      settings: {},
    };

    const merged = mergeVaultData(localVault as any, remoteVault as any);

    // The deleted todo MUST NOT be resurrected!
    expect(merged.todos.length).toBe(1);
    expect(merged.todos.find((t) => t.id === 'todo-deleted-1')).toBeUndefined();
    expect(merged.todos[0].id).toBe('todo-active-2');
    // Tombstone must be preserved in merged settings
    expect(merged.settings?.tombstones?.['todo-deleted-1']).toBe('2026-11-17T09:00:00.000Z');
  });

  it('merges finance transactions and honors tombstones for deleted transactions', () => {
    const localVault = {
      settings: {
        tombstones: {
          'tx-deleted': '2026-11-17T12:00:00.000Z',
        },
        finances: [
          {
            id: 'tx-active',
            type: 'expense' as const,
            amount: 45,
            category: 'Food & Dining',
            categoryIcon: '🍔',
            date: '2026-11-17',
            createdAt: '2026-11-17T11:00:00.000Z',
            updatedAt: '2026-11-17T11:00:00.000Z',
          },
        ],
      },
    };

    const remoteVault = {
      settings: {
        finances: [
          {
            id: 'tx-deleted',
            type: 'expense' as const,
            amount: 15,
            category: 'Coffee & Drinks',
            categoryIcon: '☕',
            date: '2026-11-17',
            createdAt: '2026-11-17T10:00:00.000Z',
            updatedAt: '2026-11-17T10:00:00.000Z',
          },
          {
            id: 'tx-remote',
            type: 'income' as const,
            amount: 500,
            category: 'Salary & Wages',
            categoryIcon: '💼',
            date: '2026-11-17',
            createdAt: '2026-11-17T09:00:00.000Z',
            updatedAt: '2026-11-17T09:00:00.000Z',
          },
        ],
      },
    };

    const merged = mergeVaultData(localVault as any, remoteVault as any);
    const finances = merged.settings?.finances || [];

    // tx-deleted was tombstoned locally, so it must not resurrect
    expect(finances.find((f: any) => f.id === 'tx-deleted')).toBeUndefined();
    // Both active local and active remote transactions must be merged
    expect(finances.length).toBe(2);
    expect(finances.find((f: any) => f.id === 'tx-active')).toBeDefined();
    expect(finances.find((f: any) => f.id === 'tx-remote')).toBeDefined();
  });

  it('merges routines and honors tombstones for deleted routines so they never resurrect', () => {
    const localVault = {
      links: [],
      categories: [],
      todos: [],
      notes: [],
      daylogs: {},
      routines: [
        {
          id: 'routine-active',
          text: 'Drink 2L Water',
          frequency: 'daily' as const,
          priority: 'medium' as const,
          createdAt: '2026-11-18T10:00:00.000Z',
        },
      ],
      settings: {
        tombstones: {
          'routine-deleted': '2026-11-18T12:00:00.000Z',
        },
      },
    };

    const remoteVault = {
      routines: [
        {
          id: 'routine-deleted',
          text: 'Morning Walk',
          frequency: 'daily' as const,
          priority: 'high' as const,
          createdAt: '2026-11-18T08:00:00.000Z',
        },
        {
          id: 'routine-remote-active',
          text: 'Read 15 Pages',
          frequency: 'daily' as const,
          priority: 'low' as const,
          createdAt: '2026-11-18T09:00:00.000Z',
        },
      ],
      settings: {},
    };

    const merged = mergeVaultData(localVault as any, remoteVault as any);
    const routines = merged.routines || [];

    // routine-deleted was tombstoned, so it MUST NOT resurrect from remote
    expect(routines.find((r) => r.id === 'routine-deleted')).toBeUndefined();
    expect(routines.length).toBe(2);
    expect(routines.find((r) => r.id === 'routine-active')).toBeDefined();
    expect(routines.find((r) => r.id === 'routine-remote-active')).toBeDefined();
  });

  it('merges reels and honors tombstones for deleted reels', () => {
    const localVault = {
      settings: {
        tombstones: {
          'reel-deleted': '2026-11-19T10:00:00.000Z',
        },
        reels: [
          {
            id: 'reel-local-active',
            shortcode: 'ABC123xyz',
            url: 'https://www.instagram.com/reel/ABC123xyz/',
            headline: 'Matcha Latte 🍵',
            createdAt: '2026-11-19T09:00:00.000Z',
            updatedAt: '2026-11-19T09:00:00.000Z',
          },
        ],
      },
    };

    const remoteVault = {
      settings: {
        reels: [
          {
            id: 'reel-deleted',
            shortcode: 'DEL123',
            url: 'https://www.instagram.com/reel/DEL123/',
            headline: 'Deleted Reel',
            createdAt: '2026-11-19T08:00:00.000Z',
            updatedAt: '2026-11-19T08:00:00.000Z',
          },
          {
            id: 'reel-remote-active',
            shortcode: 'REM456',
            url: 'https://www.instagram.com/reel/REM456/',
            headline: 'Mobility Stretch 🧘',
            createdAt: '2026-11-19T09:30:00.000Z',
            updatedAt: '2026-11-19T09:30:00.000Z',
          },
        ],
      },
    };

    const merged = mergeVaultData(localVault as any, remoteVault as any);
    const reels = merged.settings?.reels || [];

    expect(reels.find((r: any) => r.id === 'reel-deleted')).toBeUndefined();
    expect(reels.length).toBe(2);
    expect(reels.find((r: any) => r.id === 'reel-local-active')).toBeDefined();
    expect(reels.find((r: any) => r.id === 'reel-remote-active')).toBeDefined();
  });

  it('merges rollover decisions across devices without losing decisions', () => {
    const localVault = {
      settings: {
        rolloverDecisions: {
          '2026-11-19': {
            decidedAt: '2026-11-20T07:00:00.000Z',
            action: 'left_behind',
            candidateTaskIds: ['task-1'],
          },
        },
      },
    };

    const remoteVault = {
      settings: {
        rolloverDecisions: {
          '2026-11-18': {
            decidedAt: '2026-11-19T07:00:00.000Z',
            action: 'carried_all',
            candidateTaskIds: ['task-old'],
          },
        },
      },
    };

    const merged = mergeVaultData(localVault as any, remoteVault as any);
    const decisions = merged.settings?.rolloverDecisions || {};

    expect(decisions['2026-11-19']).toBeDefined();
    expect(decisions['2026-11-19'].action).toBe('left_behind');
    expect(decisions['2026-11-18']).toBeDefined();
    expect(decisions['2026-11-18'].action).toBe('carried_all');
  });
});
