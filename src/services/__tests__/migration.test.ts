import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toLocalDateKey } from '../../utils/dates';

// Mock storage map
const mockDb = new Map<string, any>();

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => mockDb.get(key)),
  set: vi.fn(async (key: string, val: any) => mockDb.set(key, val)),
}));

// Mock localStorage for Node test runner
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
  runDataMigration,
  loadTodos,
  loadActivityEvents,
  restorePreMigrationBackup,
  hasPreMigrationBackup,
  STORAGE_KEY_BACKUP_PRE_V3,
  STORAGE_KEY_TODOS_V1,
  STORAGE_KEY_SCHEMA_VERSION,
} from '../storage';

describe('Data Migration & Activity Log Engine', () => {
  beforeEach(() => {
    mockDb.clear();
    localStorage.clear();
  });

  it('preserves existing v1 data and backs it up safely before migration', async () => {
    const oldV1Todos: any[] = [
      {
        id: 'old-daily-1',
        text: 'Finish writing proposal',
        completed: true,
        type: 'daily',
        priority: 'high',
        createdAt: '2026-11-14T10:00:00.000Z',
        completedAt: '2026-11-14T16:00:00.000Z',
      },
      {
        id: 'old-perm-1',
        text: 'Learn Rust fundamentals',
        completed: false,
        type: 'permanent',
        priority: 'medium',
        createdAt: '2026-11-10T09:00:00.000Z',
      },
    ];

    mockDb.set(STORAGE_KEY_TODOS_V1, oldV1Todos);

    const result = await runDataMigration();
    expect(result.migrated).toBe(true);

    // Verify backup exists
    const hasBackup = await hasPreMigrationBackup();
    expect(hasBackup).toBe(true);
    const backup = mockDb.get(STORAGE_KEY_BACKUP_PRE_V3);
    expect(backup.todos).toEqual(oldV1Todos);

    // Verify migrated todos in v2
    const migratedTodos = await loadTodos();
    expect(migratedTodos).toHaveLength(2);

    // Daily task should have date derived from createdAt
    const daily = migratedTodos.find((t) => t.id === 'old-daily-1');
    expect(daily).toBeDefined();
    expect(daily?.date).toBe(toLocalDateKey('2026-11-14T10:00:00.000Z'));
    expect(daily?.completed).toBe(true);

    // Permanent goal should have startDate, status, progress
    const perm = migratedTodos.find((t) => t.id === 'old-perm-1');
    expect(perm).toBeDefined();
    expect(perm?.startDate).toBe(toLocalDateKey('2026-11-10T09:00:00.000Z'));
    expect(perm?.status).toBe('active');
    expect(perm?.progress).toBe(0);
    expect(perm?.progressMode).toBe('manual');

    // Verify ActivityEvents were backfilled
    const events = await loadActivityEvents();
    expect(events.length).toBeGreaterThan(0);
    const compEvent = events.find((e) => e.refId === 'old-daily-1' && e.type === 'task_completed');
    expect(compEvent).toBeDefined();
    expect(compEvent?.title).toBe('Finish writing proposal');
  });

  it('is completely idempotent (running twice does not duplicate or alter data)', async () => {
    const oldV1Todos: any[] = [
      {
        id: 'todo-idem-1',
        text: 'Daily meditation',
        completed: true,
        type: 'daily',
        priority: 'medium',
        createdAt: '2026-11-15T07:00:00.000Z',
        completedAt: '2026-11-15T07:30:00.000Z',
      },
    ];

    mockDb.set(STORAGE_KEY_TODOS_V1, oldV1Todos);

    // Run 1
    const run1 = await runDataMigration();
    expect(run1.migrated).toBe(true);
    const eventsAfterRun1 = await loadActivityEvents();

    // Run 2
    const run2 = await runDataMigration();
    expect(run2.migrated).toBe(false); // Already at schema v3
    const eventsAfterRun2 = await loadActivityEvents();

    expect(eventsAfterRun2.length).toBe(eventsAfterRun1.length);
  });

  it('supports full rollback to pre-migration backup', async () => {
    const oldV1Todos: any[] = [
      {
        id: 'todo-rollback-1',
        text: 'Original state',
        completed: false,
        type: 'daily',
        priority: 'low',
        createdAt: '2026-11-12T12:00:00.000Z',
      },
    ];
    mockDb.set(STORAGE_KEY_TODOS_V1, oldV1Todos);

    await runDataMigration();
    expect(mockDb.get(STORAGE_KEY_SCHEMA_VERSION)).toBe(3);

    // Roll back
    const restored = await restorePreMigrationBackup();
    expect(restored).toBe(true);
    expect(mockDb.get(STORAGE_KEY_TODOS_V1)).toEqual(oldV1Todos);
  });
});
