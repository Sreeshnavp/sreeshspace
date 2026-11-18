import { get, set } from 'idb-keyval';
import type { 
  LinkItem, 
  CategoryInfo, 
  TodoItem, 
  NoteItem, 
  ActivityEvent, 
  DayLog, 
  RoutineItem, 
  StreakState,
  FinanceTransaction,
  FinanceCategory,
  SketchItem
} from '../types';
import { DEFAULT_FINANCE_CATEGORIES } from '../types/finance';
import { toLocalDateKey, todayKey, addDays } from '../utils/dates';

export const STORAGE_KEY_LINKS = 'sreeshspace_links_v2';
export const STORAGE_KEY_CATEGORIES = 'sreeshspace_categories_v2';
export const STORAGE_KEY_TODOS_V1 = 'sreeshspace_todos_v1';
export const STORAGE_KEY_TODOS = 'sreeshspace_todos_v2';
export const STORAGE_KEY_NOTES = 'sreeshspace_notes_v1';
export const STORAGE_KEY_EVENTS = 'sreeshspace_activity_events_v1';
export const STORAGE_KEY_DAYLOGS = 'sreeshspace_daylogs_v1';
export const STORAGE_KEY_ROUTINES = 'sreeshspace_routines_v1';
export const STORAGE_KEY_STREAK = 'sreeshspace_streak_v1';
export const STORAGE_KEY_BACKUP_PRE_V3 = 'sreeshspace_backup_pre_v3';
export const STORAGE_KEY_SCHEMA_VERSION = 'sreeshspace_schema_version';

export const DEFAULT_CATEGORIES: CategoryInfo[] = [];

export const PREINSTALLED_CATEGORY_IDS = new Set([
  'work', 'tools', 'design', 'study', 'personal', 'ideas'
]);

export const PREINSTALLED_CATEGORY_NAMES = new Set([
  'work & projects',
  'daily tools',
  'design & ui',
  'study & docs',
  'personal & fun',
  'inspiration',
]);

export function isPreinstalledCategory(cat: any): boolean {
  if (!cat) return false;
  const id = String(cat.id || '').toLowerCase();
  const name = String(cat.name || '').trim().toLowerCase();
  return PREINSTALLED_CATEGORY_IDS.has(id) || PREINSTALLED_CATEGORY_NAMES.has(name);
}

export const INITIAL_TODOS: TodoItem[] = [];
export const INITIAL_NOTES: NoteItem[] = [];
export const INITIAL_LINKS: LinkItem[] = [];

export function isSampleItem(item: any): boolean {
  if (!item) return false;
  const id = String(item.id || '');
  
  if ([
    'link-1', 'link-2', 'link-3', 'link-4',
    'todo-1', 'todo-2', 'todo-3', 'todo-4',
    'todo-d1', 'todo-d2', 'todo-d3',
    'todo-p1', 'todo-p2', 'todo-p3', 'todo-p4',
    'note-1', 'note-2', 'note-3'
  ].includes(id)) {
    return true;
  }
  if (
    id.startsWith('ev-backfill-todo-') ||
    id.startsWith('ev-backfill-link-') ||
    id.startsWith('ev-backfill-note-')
  ) {
    return true;
  }

  return false;
}

export async function purgeAllSampleData(): Promise<void> {
  try {
    await Promise.all([
      set(STORAGE_KEY_LINKS, []),
      set(STORAGE_KEY_TODOS, []),
      set(STORAGE_KEY_TODOS_V1, []),
      set(STORAGE_KEY_NOTES, []),
      set(STORAGE_KEY_EVENTS, []),
      set(STORAGE_KEY_DAYLOGS, {}),
      set(STORAGE_KEY_ROUTINES, []),
      set(STORAGE_KEY_STREAK, {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        freezesRemaining: 1,
        frozenDates: [],
      }),
    ]);

    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEY_TODOS_V1);
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_DAYLOGS, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEY_ROUTINES, JSON.stringify([]));
    localStorage.setItem(
      STORAGE_KEY_STREAK,
      JSON.stringify({
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        freezesRemaining: 1,
        frozenDates: [],
      })
    );
    localStorage.setItem('orbit_clean_slate_v3', 'true');
  } catch (err) {
    console.error('Error purging sample data:', err);
  }
}

function sanitizeLinks(raw: any[]): LinkItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    id: item.id || `link-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    url: item.url || '',
    title: item.title || item.url || 'Untitled Link',
    category: item.category || 'Uncategorized',
    notes: item.notes || '',
    pinned: Boolean(item.pinned),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    clicks: typeof item.clicks === 'number' ? item.clicks : 0,
    favicon: item.favicon || '',
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
  }));
}

export async function loadLinks(): Promise<LinkItem[]> {
  try {
    const idbData = await get<any[]>(STORAGE_KEY_LINKS);
    if (idbData !== undefined && Array.isArray(idbData)) {
      return sanitizeLinks(idbData).filter((l) => !isSampleItem(l));
    }

    const local = localStorage.getItem(STORAGE_KEY_LINKS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        const sanitized = sanitizeLinks(parsed).filter((l) => !isSampleItem(l));
        await set(STORAGE_KEY_LINKS, sanitized);
        return sanitized;
      }
    }

    await saveLinks([]);
    return [];
  } catch (err) {
    return [];
  }
}

export async function saveLinks(links: LinkItem[]): Promise<void> {
  try {
    await set(STORAGE_KEY_LINKS, links);
    try {
      const lightLinks = links.map((link) => ({
        ...link,
        attachments: (link.attachments || []).map((a) => ({
          ...a,
          dataUrl: a.dataUrl && a.dataUrl.length > 500 ? '[stored-in-idb]' : a.dataUrl,
        })),
      }));
      localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(lightLinks));
    } catch {
      // Ignore localStorage quota
    }
  } catch (err) {
    console.error('Error saving links:', err);
  }
}

export async function loadCategories(): Promise<CategoryInfo[]> {
  try {
    const data = await get<CategoryInfo[]>(STORAGE_KEY_CATEGORIES);
    if (data && Array.isArray(data)) {
      return data.filter((c) => !isPreinstalledCategory(c));
    }
    const local = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed.filter((c) => !isPreinstalledCategory(c));
      }
    }
    return [];
  } catch (err) {
    return [];
  }
}

export async function saveCategories(categories: CategoryInfo[]): Promise<void> {
  try {
    await set(STORAGE_KEY_CATEGORIES, categories);
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories:', err);
  }
}

export async function loadNotes(): Promise<NoteItem[]> {
  try {
    const data = await get<NoteItem[]>(STORAGE_KEY_NOTES);
    if (data !== undefined && Array.isArray(data)) {
      return data.filter((n) => !isSampleItem(n));
    }
    const local = localStorage.getItem(STORAGE_KEY_NOTES);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed.filter((n) => !isSampleItem(n));
      }
    }
    await saveNotes([]);
    return [];
  } catch (err) {
    return [];
  }
}

export async function saveNotes(notes: NoteItem[]): Promise<void> {
  try {
    await set(STORAGE_KEY_NOTES, notes);
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  } catch (err) {
    console.error('Error saving notes:', err);
  }
}

// ==========================================
// 🚀 VERSIONED MIGRATION & BACKUP ENGINE
// ==========================================

export async function hasPreMigrationBackup(): Promise<boolean> {
  try {
    const b = await get<any>(STORAGE_KEY_BACKUP_PRE_V3);
    return Boolean(b);
  } catch {
    return false;
  }
}

export async function restorePreMigrationBackup(): Promise<boolean> {
  try {
    const backup = await get<any>(STORAGE_KEY_BACKUP_PRE_V3);
    if (!backup) return false;
    if (backup.todos) await set(STORAGE_KEY_TODOS_V1, backup.todos);
    await set(STORAGE_KEY_SCHEMA_VERSION, 1);
    localStorage.setItem(STORAGE_KEY_SCHEMA_VERSION, '1');
    return true;
  } catch (err) {
    console.error('Failed to restore backup:', err);
    return false;
  }
}

export async function deletePreMigrationBackup(): Promise<void> {
  try {
    await set(STORAGE_KEY_BACKUP_PRE_V3, null);
    localStorage.removeItem(STORAGE_KEY_BACKUP_PRE_V3);
  } catch (err) {
    console.error('Failed to delete backup:', err);
  }
}

/**
 * Runs idempotent schema version migration to bump to v3.
 * Safely preserves all existing user data.
 */
export async function runDataMigration(): Promise<{ migrated: boolean; error?: string }> {
  try {
    const currentVersion = (await get<number>(STORAGE_KEY_SCHEMA_VERSION)) || 
      parseInt(localStorage.getItem(STORAGE_KEY_SCHEMA_VERSION) || '1', 10);

    if (currentVersion >= 3) {
      return { migrated: false };
    }

    // 1. Read existing v1 data to create pre-migration backup
    const oldV1Todos = (await get<any[]>(STORAGE_KEY_TODOS_V1)) || 
      JSON.parse(localStorage.getItem(STORAGE_KEY_TODOS_V1) || 'null') || [];
    const oldLinks = (await get<any[]>(STORAGE_KEY_LINKS)) || [];
    const oldNotes = (await get<any[]>(STORAGE_KEY_NOTES)) || [];
    const oldCats = (await get<any[]>(STORAGE_KEY_CATEGORIES)) || [];

    // Store safety backup in IndexedDB
    await set(STORAGE_KEY_BACKUP_PRE_V3, {
      todos: oldV1Todos,
      links: oldLinks,
      notes: oldNotes,
      categories: oldCats,
      timestamp: new Date().toISOString(),
    });

    // 2. Migrate todos to new shape
    const todosToMigrate = oldV1Todos.length > 0 ? oldV1Todos : INITIAL_TODOS;
    const migratedTodos: TodoItem[] = todosToMigrate.map((t: any) => {
      const isDaily = (t.type || 'permanent') === 'daily';
      const createdDate = toLocalDateKey(t.createdAt);
      
      if (isDaily) {
        return {
          ...t,
          type: 'daily',
          date: t.date || createdDate,
          priority: t.priority || 'medium',
          subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        };
      }

      // Permanent goal
      return {
        ...t,
        type: 'permanent',
        date: t.date || createdDate,
        startDate: t.startDate || createdDate,
        endDate: t.endDate,
        status: t.status || (t.completed ? 'completed' : 'active'),
        progressMode: t.progressMode || 'manual',
        progress: typeof t.progress === 'number' ? t.progress : (t.completed ? 100 : 0),
        priority: t.priority || 'medium',
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        extensions: Array.isArray(t.extensions) ? t.extensions : [],
      };
    });

    // 3. Backfill initial ActivityEvent log from existing items
    const existingEvents = (await get<ActivityEvent[]>(STORAGE_KEY_EVENTS)) || [];
    const newEvents: ActivityEvent[] = [];

    // Todos
    migratedTodos.forEach((t) => {
      if (t.completed) {
        newEvents.push({
          id: `ev-backfill-${t.id}-done`,
          ts: t.completedAt ? new Date(t.completedAt).getTime() : new Date(t.createdAt).getTime(),
          date: toLocalDateKey(t.completedAt || t.createdAt),
          type: t.type === 'daily' ? 'task_completed' : 'goal_completed',
          refId: t.id,
          title: t.text,
          meta: { priority: t.priority, itemType: t.type },
        });
      } else {
        newEvents.push({
          id: `ev-backfill-${t.id}-add`,
          ts: new Date(t.createdAt).getTime(),
          date: toLocalDateKey(t.createdAt),
          type: t.type === 'daily' ? 'task_added' : 'goal_created',
          refId: t.id,
          title: t.text,
          meta: { priority: t.priority, itemType: t.type },
        });
      }
    });

    // Links
    oldLinks.forEach((l) => {
      newEvents.push({
        id: `ev-backfill-link-${l.id}`,
        ts: new Date(l.createdAt).getTime(),
        date: toLocalDateKey(l.createdAt),
        type: 'link_added',
        refId: l.id,
        title: l.title || l.url,
        meta: { itemType: 'link' },
      });
    });

    // Notes
    oldNotes.forEach((n) => {
      newEvents.push({
        id: `ev-backfill-note-${n.id}`,
        ts: new Date(n.createdAt).getTime(),
        date: toLocalDateKey(n.createdAt),
        type: 'note_added',
        refId: n.id,
        title: n.title,
        meta: { itemType: 'note' },
      });
    });

    // Merge & deduplicate by id
    const eventMap = new Map<string, ActivityEvent>();
    [...existingEvents, ...newEvents].forEach((ev) => {
      if (!eventMap.has(ev.id)) {
        eventMap.set(ev.id, ev);
      }
    });
    const finalEvents = Array.from(eventMap.values()).sort((a, b) => b.ts - a.ts);

    // Save migrated data
    await set(STORAGE_KEY_TODOS, migratedTodos);
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(migratedTodos));

    await set(STORAGE_KEY_EVENTS, finalEvents);
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(finalEvents.slice(0, 100))); // cache top 100

    // Set schema version to 3
    await set(STORAGE_KEY_SCHEMA_VERSION, 3);
    localStorage.setItem(STORAGE_KEY_SCHEMA_VERSION, '3');

    return { migrated: true };
  } catch (err: any) {
    console.error('Migration failed:', err);
    return { migrated: false, error: err?.message || 'Unknown error' };
  }
}

// ==========================================
// 📋 TODOS (V2) STORAGE APIS
// ==========================================

export async function loadTodos(): Promise<TodoItem[]> {
  try {
    // 1. Try v2 key
    const data = await get<TodoItem[]>(STORAGE_KEY_TODOS);
    if (data !== undefined && Array.isArray(data)) {
      return data.filter((t) => !isSampleItem(t));
    }
    const local = localStorage.getItem(STORAGE_KEY_TODOS);
    if (local !== null) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed.filter((t) => !isSampleItem(t));
      }
    }

    // 2. Fall back to v1 key if migration hasn't run yet
    const v1Data = await get<any[]>(STORAGE_KEY_TODOS_V1);
    if (v1Data !== undefined && Array.isArray(v1Data)) {
      await runDataMigration();
      return ((await get<TodoItem[]>(STORAGE_KEY_TODOS)) || []).filter((t) => !isSampleItem(t));
    }

    // 3. First-time initialization
    await saveTodos([]);
    return [];
  } catch (err) {
    return [];
  }
}

export async function saveTodos(todos: TodoItem[]): Promise<void> {
  try {
    await set(STORAGE_KEY_TODOS, todos);
    try {
      localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
    } catch {
      // Ignore localStorage size quota
    }
  } catch (err) {
    console.error('Error saving todos:', err);
  }
}

// ==========================================
// 📜 PERSISTENT ACTIVITY EVENT LOG APIS
// ==========================================

export async function loadActivityEvents(): Promise<ActivityEvent[]> {
  try {
    const data = await get<ActivityEvent[]>(STORAGE_KEY_EVENTS);
    if (data && Array.isArray(data)) {
      return data.filter((e) => !isSampleItem(e));
    }
    const local = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed.filter((e) => !isSampleItem(e));
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveActivityEvents(events: ActivityEvent[]): Promise<void> {
  try {
    await set(STORAGE_KEY_EVENTS, events);
    try {
      // Keep recent 100 in localStorage
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events.slice(0, 100)));
    } catch {
      // Ignore quota
    }
  } catch (err) {
    console.error('Error saving activity events:', err);
  }
}

export async function logActivityEvent(event: Omit<ActivityEvent, 'id' | 'ts'>): Promise<ActivityEvent> {
  const fullEvent: ActivityEvent = {
    ...event,
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ts: Date.now(),
  };

  try {
    const current = await loadActivityEvents();
    const updated = [fullEvent, ...current];
    await saveActivityEvents(updated);
  } catch (err) {
    console.error('Error logging activity event:', err);
  }

  return fullEvent;
}

export async function logActivity(
  type: ActivityEvent['type'],
  refId: string,
  title: string,
  meta?: Record<string, any>,
  date?: string
): Promise<ActivityEvent> {
  return logActivityEvent({
    type,
    refId,
    title,
    date: date || toLocalDateKey(new Date()),
    meta,
  });
}

// ==========================================
// 🌅 DAYLOGS & EVENING REFLECTIONS
// ==========================================

export async function loadDayLogs(): Promise<Record<string, DayLog>> {
  try {
    const data = await get<Record<string, DayLog>>(STORAGE_KEY_DAYLOGS);
    if (data && typeof data === 'object') {
      return data;
    }
    const local = localStorage.getItem(STORAGE_KEY_DAYLOGS);
    if (local) {
      return JSON.parse(local);
    }
    return {};
  } catch {
    return {};
  }
}

export async function saveDayLogs(logs: Record<string, DayLog>): Promise<void> {
  try {
    await set(STORAGE_KEY_DAYLOGS, logs);
    localStorage.setItem(STORAGE_KEY_DAYLOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving daylogs:', err);
  }
}

export async function saveDayLog(dateKey: string, dayLog: DayLog): Promise<void> {
  const current = await loadDayLogs();
  current[dateKey] = dayLog;
  await saveDayLogs(current);
}

export async function getDayLog(dateKey: string): Promise<DayLog | undefined> {
  const logs = await loadDayLogs();
  return logs[dateKey];
}

export async function updateDayLog(dateKey: string, updates: Partial<DayLog>): Promise<DayLog> {
  const logs = await loadDayLogs();
  const existing = logs[dateKey] || {
    date: dateKey,
    planned: 0,
    completed: 0,
  };
  const updated: DayLog = {
    ...existing,
    ...updates,
    date: dateKey,
  };
  logs[dateKey] = updated;
  await saveDayLogs(logs);
  return updated;
}

// ==========================================
// 🔁 SAVED ROUTINES (RECURRING TEMPLATES)
// ==========================================

export async function loadRoutines(): Promise<RoutineItem[]> {
  try {
    const data = await get<RoutineItem[]>(STORAGE_KEY_ROUTINES);
    if (data && Array.isArray(data)) {
      return data;
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveRoutines(routines: RoutineItem[]): Promise<void> {
  try {
    await set(STORAGE_KEY_ROUTINES, routines);
  } catch (err) {
    console.error('Error saving routines:', err);
  }
}

// ==========================================
// 🔥 STREAK STATE & FREEZES
// ==========================================

export async function loadStreakState(): Promise<StreakState> {
  const defaultStreak: StreakState = {
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    freezesRemaining: 1, // 1 freeze per week
    frozenDates: [],
  };

  try {
    const data = await get<StreakState>(STORAGE_KEY_STREAK);
    if (data && typeof data === 'object') {
      return { ...defaultStreak, ...data };
    }
    return defaultStreak;
  } catch {
    return defaultStreak;
  }
}

export async function saveStreakState(streak: StreakState): Promise<void> {
  try {
    await set(STORAGE_KEY_STREAK, streak);
    localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(streak));
  } catch (err) {
    console.error('Error saving streak state:', err);
  }
}

// ==========================================
// 🖼️ CUSTOM WALLPAPER & BACKGROUND
// ==========================================

export const STORAGE_KEY_CUSTOM_BG = 'orbit_custom_bg_v1';
export const STORAGE_KEY_BG_SETTINGS = 'orbit_bg_settings_v1';

export interface BackgroundSettings {
  opacity: number;
  blur: number;
  enabled: boolean;
  updatedAt?: string;
  removedAt?: string;
}

export async function loadCustomBackground(): Promise<{
  imageUrl: string | null;
  settings: BackgroundSettings;
}> {
  try {
    let imageUrl = (await get<string>(STORAGE_KEY_CUSTOM_BG)) || null;
    if (!imageUrl) {
      try {
        imageUrl = localStorage.getItem(STORAGE_KEY_CUSTOM_BG) || null;
        if (imageUrl) {
          // Restore to IndexedDB
          set(STORAGE_KEY_CUSTOM_BG, imageUrl).catch(() => {});
        }
      } catch {}
    }
    const settingsRaw = localStorage.getItem(STORAGE_KEY_BG_SETTINGS);
    const settings: BackgroundSettings = settingsRaw
      ? JSON.parse(settingsRaw)
      : { opacity: 0.25, blur: 0, enabled: true };
    return { imageUrl, settings };
  } catch {
    return { imageUrl: null, settings: { opacity: 0.25, blur: 0, enabled: true } };
  }
}

export async function saveCustomBackgroundImage(dataUrl: string | null): Promise<void> {
  try {
    await set(STORAGE_KEY_CUSTOM_BG, dataUrl);
    if (dataUrl) {
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_BG, dataUrl);
      } catch (e) {
        console.warn('Could not cache wallpaper in localStorage:', e);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY_CUSTOM_BG);
      } catch {}
    }
    // Also record last modified timestamp and removal flag
    const currentRaw = localStorage.getItem(STORAGE_KEY_BG_SETTINGS);
    const parsed: BackgroundSettings = currentRaw
      ? JSON.parse(currentRaw)
      : { opacity: 0.25, blur: 0, enabled: true };
    const nowIso = new Date().toISOString();
    parsed.updatedAt = nowIso;
    if (dataUrl === null) {
      parsed.removedAt = nowIso;
    } else {
      delete parsed.removedAt;
    }
    localStorage.setItem(STORAGE_KEY_BG_SETTINGS, JSON.stringify(parsed));
  } catch (err) {
    console.error('Error saving custom background:', err);
  }
}

export function saveBackgroundSettings(settings: BackgroundSettings): void {
  try {
    const withTimestamp: BackgroundSettings = {
      ...settings,
      updatedAt: settings.updatedAt || new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_BG_SETTINGS, JSON.stringify(withTimestamp));
  } catch (err) {
    console.error('Error saving background settings:', err);
  }
}

// ==========================================
// 🪦 DELETION TOMBSTONES (PREVENTS GHOST RESURRECTIONS)
// ==========================================

export const STORAGE_KEY_TOMBSTONES = 'orbit_tombstones_v1';

export function pruneTombstones(
  tombstones: Record<string, string>,
  maxAgeDays = 30
): Record<string, string> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const pruned: Record<string, string> = {};
  for (const [id, dateStr] of Object.entries(tombstones || {})) {
    const time = new Date(dateStr).getTime();
    if (!isNaN(time) && time > cutoff) {
      pruned[id] = dateStr;
    }
  }
  return pruned;
}

export async function loadTombstones(): Promise<Record<string, string>> {
  try {
    const data = await get<Record<string, string>>(STORAGE_KEY_TOMBSTONES);
    if (data && typeof data === 'object') {
      return pruneTombstones(data);
    }
    const local = localStorage.getItem(STORAGE_KEY_TOMBSTONES);
    if (local) {
      return pruneTombstones(JSON.parse(local));
    }
    return {};
  } catch {
    return {};
  }
}

export async function saveTombstones(tombstones: Record<string, string>): Promise<void> {
  try {
    const cleaned = pruneTombstones(tombstones);
    await set(STORAGE_KEY_TOMBSTONES, cleaned);
    localStorage.setItem(STORAGE_KEY_TOMBSTONES, JSON.stringify(cleaned));
  } catch (err) {
    console.error('Error saving tombstones:', err);
  }
}

export async function recordTombstone(id: string): Promise<Record<string, string>> {
  const current = await loadTombstones();
  current[id] = new Date().toISOString();
  await saveTombstones(current);
  return current;
}

export async function recordTombstones(ids: string[]): Promise<Record<string, string>> {
  if (!ids || ids.length === 0) return loadTombstones();
  const current = await loadTombstones();
  const nowIso = new Date().toISOString();
  for (const id of ids) {
    if (id) current[id] = nowIso;
  }
  await saveTombstones(current);
  return current;
}

// ==========================================
// 📤 EXPORT & IMPORT BACKUP (ENHANCED V4)
// ==========================================

export function exportBackup(
  links: LinkItem[], 
  categories: CategoryInfo[], 
  todos?: TodoItem[], 
  notes?: NoteItem[],
  events?: ActivityEvent[],
  dayLogs?: Record<string, DayLog>,
  routines?: RoutineItem[],
  sketches?: SketchItem[]
): string {
  return JSON.stringify({
    app: 'Orbit',
    owner: 'Sreeshnav',
    version: '4.2',
    schemaVersion: 3,
    exportedAt: new Date().toISOString(),
    categories,
    links,
    todos: todos || [],
    notes: notes || [],
    events: events || [],
    dayLogs: dayLogs || {},
    routines: routines || [],
    sketches: sketches || [],
  }, null, 2);
}

export function downloadJsonFile(content: string, filename = 'orbit-backup.json') {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 💳 FINANCE & EXPENSE / INCOME TRACKING (MIBU V1)
// ==========================================

export const STORAGE_KEY_FINANCE = 'orbit_finance_transactions_v1';

export async function loadFinanceTransactions(): Promise<FinanceTransaction[]> {
  try {
    const data = await get<FinanceTransaction[]>(STORAGE_KEY_FINANCE);
    if (data && Array.isArray(data)) {
      return data;
    }
    const local = localStorage.getItem(STORAGE_KEY_FINANCE);
    if (local) {
      return JSON.parse(local);
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveFinanceTransactions(transactions: FinanceTransaction[]): Promise<void> {
  try {
    await set(STORAGE_KEY_FINANCE, transactions);
    localStorage.setItem(STORAGE_KEY_FINANCE, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving finance transactions:', err);
  }
}

export const STORAGE_KEY_FINANCE_CATEGORIES = 'orbit_finance_categories_v1';
export const STORAGE_KEY_FINANCE_CURRENCY = 'orbit_finance_currency_v1';

export async function loadFinanceCategories(): Promise<FinanceCategory[]> {
  try {
    const data = await get<FinanceCategory[]>(STORAGE_KEY_FINANCE_CATEGORIES);
    if (data && Array.isArray(data)) {
      return data.filter((c) => !c.isDefault && !c.id.startsWith('cat-'));
    }
    const local = localStorage.getItem(STORAGE_KEY_FINANCE_CATEGORIES);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed.filter((c: any) => !c.isDefault && !c.id?.startsWith('cat-'));
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveFinanceCategories(categories: FinanceCategory[]): Promise<void> {
  try {
    await set(STORAGE_KEY_FINANCE_CATEGORIES, categories);
    localStorage.setItem(STORAGE_KEY_FINANCE_CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving finance categories:', err);
  }
}

export function loadFinanceCurrency(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_FINANCE_CURRENCY) || '₹';
  } catch {
    return '₹';
  }
}

export function saveFinanceCurrency(currency: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_FINANCE_CURRENCY, currency);
  } catch (err) {
    console.error('Error saving finance currency:', err);
  }
}

// ==========================================
// 🎨 SKETCHPAD & DOODLES STORAGE (V1)
// ==========================================

export const STORAGE_KEY_SKETCHES = 'orbit_sketches_v1';

export async function loadSketches(): Promise<SketchItem[]> {
  try {
    const data = await get<SketchItem[]>(STORAGE_KEY_SKETCHES);
    if (data && Array.isArray(data)) {
      return data;
    }
    const local = localStorage.getItem(STORAGE_KEY_SKETCHES);
    if (local) {
      return JSON.parse(local);
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveSketches(sketches: SketchItem[]): Promise<void> {
  try {
    await set(STORAGE_KEY_SKETCHES, sketches);
    localStorage.setItem(STORAGE_KEY_SKETCHES, JSON.stringify(sketches));
  } catch (err) {
    console.error('Error saving sketches:', err);
  }
}
