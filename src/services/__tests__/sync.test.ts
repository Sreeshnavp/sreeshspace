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

    const merged = mergeVaultData(localVault, remoteVault);

    // The deleted todo MUST NOT be resurrected!
    expect(merged.todos.length).toBe(1);
    expect(merged.todos.find((t) => t.id === 'todo-deleted-1')).toBeUndefined();
    expect(merged.todos[0].id).toBe('todo-active-2');
    // Tombstone must be preserved in merged settings
    expect(merged.settings?.tombstones?.['todo-deleted-1']).toBe('2026-11-17T09:00:00.000Z');
  });
});
