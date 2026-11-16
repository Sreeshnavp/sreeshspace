import { get, set } from 'idb-keyval';
import type { 
  LinkItem, 
  CategoryInfo, 
  TodoItem, 
  NoteItem, 
  ActivityEvent, 
  DayLog, 
  RoutineItem, 
  StreakState 
} from '../types';
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

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { id: 'work', name: 'Work & Projects', color: 'sage', icon: '🌿' },
  { id: 'tools', name: 'Daily Tools', color: 'sky', icon: '🛠️' },
  { id: 'design', name: 'Design & UI', color: 'clay', icon: '🎨' },
  { id: 'study', name: 'Study & Docs', color: 'lavender', icon: '📚' },
  { id: 'personal', name: 'Personal & Fun', color: 'honey', icon: '☕' },
  { id: 'ideas', name: 'Inspiration', color: 'rose', icon: '💡' },
];

export const INITIAL_TODOS: TodoItem[] = [
  // ☀️ Daily Tasks
  {
    id: 'todo-d1',
    text: 'Explore Orbit notebook and activity tracker',
    completed: true,
    type: 'daily',
    date: todayKey(),
    priority: 'high',
    subtasks: [
      { id: 'st-1', text: 'Check out Daily History navigator', done: true, doneAt: new Date().toISOString() },
      { id: 'st-2', text: 'Test calendar date picker', done: true, doneAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'todo-d2',
    text: 'Review daily study & coding habit',
    completed: false,
    type: 'daily',
    date: todayKey(),
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'todo-d3',
    text: 'Jot down an evening reflection note in the scratchpad',
    completed: false,
    type: 'daily',
    date: todayKey(),
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
  // 📌 Permanent Long-Term Goals
  {
    id: 'todo-p1',
    text: 'Design Orbit personal vault & notebook',
    completed: true,
    type: 'permanent',
    priority: 'high',
    startDate: addDays(todayKey(), -14),
    endDate: addDays(todayKey(), -1),
    status: 'completed',
    progressMode: 'checklist',
    progress: 100,
    subtasks: [
      { id: 'sub-p1-1', text: 'Establish Oat & Sage semantic palette', done: true },
      { id: 'sub-p1-2', text: 'Build liquid drag & drop bento', done: true },
      { id: 'sub-p1-3', text: 'PWA offline install support', done: true },
    ],
    extensions: [],
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'todo-p2',
    text: 'File code and AI resources into cute folders',
    completed: true,
    type: 'permanent',
    priority: 'medium',
    startDate: addDays(todayKey(), -10),
    endDate: addDays(todayKey(), -2),
    status: 'completed',
    progressMode: 'manual',
    progress: 100,
    subtasks: [],
    extensions: [],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'todo-p3',
    text: 'Build daily coding and knowledge streak',
    completed: false,
    type: 'permanent',
    priority: 'high',
    startDate: addDays(todayKey(), -5),
    endDate: addDays(todayKey(), 30),
    status: 'active',
    progressMode: 'checklist',
    progress: 40,
    subtasks: [
      { id: 'sub-p3-1', text: 'Log 5 active days in heatmap', done: true },
      { id: 'sub-p3-2', text: 'Complete 30 daily tasks', done: false },
      { id: 'sub-p3-3', text: 'Save 10 reference bookmarks', done: true },
      { id: 'sub-p3-4', text: 'Write 5 deep-dive study notes', done: false },
    ],
    extensions: [],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'todo-p4',
    text: 'Test PWA install on phone for mobile access',
    completed: false,
    type: 'permanent',
    priority: 'low',
    startDate: todayKey(),
    endDate: addDays(todayKey(), 7),
    status: 'active',
    progressMode: 'manual',
    progress: 25,
    subtasks: [],
    extensions: [],
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-1',
    title: '🌿 Daily Philosophy & Mindset',
    content: 'Build clean, soothing, beautiful things. Keep it simple and calm! Orbit is my digital zen garden for bookmarks, focus, and quick thoughts.\n\nKeep focusing on small daily wins and maintain clarity in everything I do.',
    highlight: '⭐ Focus on small daily wins and stay curious.',
    color: 'sage',
    pinned: true,
    attachments: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'note-2',
    title: '💡 Creative Ideas for Orbit',
    content: '1. PWA mobile home screen ready for iOS and Android\n2. Instant link pasting and fluid folder drag & drop\n3. Heatmap contribution squares to visualize daily progress\n4. Popup note editor with headline, formatted paragraphs, highlights, and file attachments!',
    highlight: '🚀 Turn web app into mobile & desktop daily driver.',
    color: 'clay',
    pinned: false,
    attachments: [],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'note-3',
    title: '🎨 Color Palette & Zen Tokens',
    content: 'Oat & Sage Palette • Warm Charcoal Dark Mode • WCAG AA 4.5:1 Contrast System\n\nDesigned to be calm, cozy, and easy on the eyes at any time of day or night.',
    highlight: '🎨 Calm semantic tokens that prevent eye fatigue.',
    color: 'honey',
    pinned: false,
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_LINKS: LinkItem[] = [
  {
    id: 'link-1',
    url: 'https://ai.google.dev',
    title: 'Google AI Studio & Gemini',
    category: 'Work & Projects',
    notes: 'Fast prompt playground and Gemini models for coding and agent ideas.',
    pinned: true,
    attachments: [],
    clicks: 14,
    favicon: 'https://www.google.com/s2/favicons?sz=128&domain=ai.google.dev',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'link-2',
    url: 'https://tailwindcss.com',
    title: 'Tailwind CSS Reference',
    category: 'Design & UI',
    notes: 'Soft rounded corners, cozy shadows, and pastel styling classes.',
    pinned: true,
    attachments: [],
    clicks: 22,
    favicon: 'https://www.google.com/s2/favicons?sz=128&domain=tailwindcss.com',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'link-3',
    url: 'https://excalidraw.com',
    title: 'Excalidraw Sketchboard',
    category: 'Uncategorized',
    notes: 'Super cute virtual whiteboard for sketching mindmaps and flowcharts. Drag this into Daily Tools above!',
    pinned: false,
    attachments: [],
    clicks: 9,
    favicon: 'https://www.google.com/s2/favicons?sz=128&domain=excalidraw.com',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'link-4',
    url: 'https://developer.mozilla.org',
    title: 'MDN Web Knowledge Base',
    category: 'Uncategorized',
    notes: 'Documentation for modern Web APIs, JavaScript, and CSS. Drag this into Study & Docs above!',
    pinned: false,
    attachments: [],
    clicks: 18,
    favicon: 'https://www.google.com/s2/favicons?sz=128&domain=developer.mozilla.org',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

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
    if (idbData && Array.isArray(idbData) && idbData.length > 0) {
      return sanitizeLinks(idbData);
    }

    const local = localStorage.getItem(STORAGE_KEY_LINKS);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = sanitizeLinks(parsed);
        await set(STORAGE_KEY_LINKS, sanitized);
        return sanitized;
      }
    }

    await saveLinks(INITIAL_LINKS);
    return INITIAL_LINKS;
  } catch (err) {
    return INITIAL_LINKS;
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
    if (data && Array.isArray(data) && data.length > 0) {
      return data;
    }
    const local = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    await saveCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  } catch (err) {
    return DEFAULT_CATEGORIES;
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
    if (data && Array.isArray(data) && data.length > 0) {
      return data;
    }
    const local = localStorage.getItem(STORAGE_KEY_NOTES);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    await saveNotes(INITIAL_NOTES);
    return INITIAL_NOTES;
  } catch (err) {
    return INITIAL_NOTES;
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
    if (data && Array.isArray(data) && data.length > 0) {
      return data;
    }
    const local = localStorage.getItem(STORAGE_KEY_TODOS);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // 2. Fall back to v1 key if migration hasn't run yet
    const v1Data = await get<any[]>(STORAGE_KEY_TODOS_V1);
    if (v1Data && Array.isArray(v1Data) && v1Data.length > 0) {
      await runDataMigration();
      return (await get<TodoItem[]>(STORAGE_KEY_TODOS)) || INITIAL_TODOS;
    }

    // 3. First-time initialization
    await saveTodos(INITIAL_TODOS);
    return INITIAL_TODOS;
  } catch (err) {
    return INITIAL_TODOS;
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
      return data;
    }
    const local = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (local) {
      return JSON.parse(local);
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
}

export async function loadCustomBackground(): Promise<{
  imageUrl: string | null;
  settings: BackgroundSettings;
}> {
  try {
    const imageUrl = (await get<string>(STORAGE_KEY_CUSTOM_BG)) || null;
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
  } catch (err) {
    console.error('Error saving custom background:', err);
  }
}

export function saveBackgroundSettings(settings: BackgroundSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_BG_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving background settings:', err);
  }
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
  routines?: RoutineItem[]
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
