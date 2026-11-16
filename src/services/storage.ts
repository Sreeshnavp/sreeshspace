import { get, set } from 'idb-keyval';
import type { LinkItem, CategoryInfo, TodoItem, NoteItem } from '../types';

const STORAGE_KEY_LINKS = 'sreeshspace_links_v2';
const STORAGE_KEY_CATEGORIES = 'sreeshspace_categories_v2';
const STORAGE_KEY_TODOS = 'sreeshspace_todos_v1';
const STORAGE_KEY_NOTES = 'sreeshspace_notes_v1';

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { id: 'work', name: 'Work & Projects', color: '#4e876c', icon: '🌿' },
  { id: 'tools', name: 'Daily Tools', color: '#38bdf8', icon: '🛠️' },
  { id: 'design', name: 'Design & UI', color: '#f7885e', icon: '🎨' },
  { id: 'study', name: 'Study & Docs', color: '#aa73d7', icon: '📚' },
  { id: 'personal', name: 'Personal & Fun', color: '#f59e0b', icon: '☕' },
  { id: 'ideas', name: 'Inspiration', color: '#ec4899', icon: '💡' },
];

export const INITIAL_TODOS: TodoItem[] = [
  // ☀️ Daily Tasks
  {
    id: 'todo-d1',
    text: 'Explore SreeshSpace notebook and activity tracker',
    completed: true,
    type: 'daily',
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'todo-d2',
    text: 'Review daily study & coding habit',
    completed: false,
    type: 'daily',
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'todo-d3',
    text: 'Jot down an evening reflection note in the scratchpad',
    completed: false,
    type: 'daily',
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
  // 📌 Permanent Long-Term Goals
  {
    id: 'todo-p1',
    text: 'Design SreeshSpace personal vault & notebook',
    completed: true,
    type: 'permanent',
    priority: 'high',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'todo-p2',
    text: 'File code and AI resources into cute folders',
    completed: true,
    type: 'permanent',
    priority: 'medium',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'todo-p3',
    text: 'Build daily coding and knowledge streak',
    completed: false,
    type: 'permanent',
    priority: 'high',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'todo-p4',
    text: 'Test PWA install on phone for mobile access',
    completed: false,
    type: 'permanent',
    priority: 'low',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-1',
    title: '🌿 Daily Philosophy & Mindset',
    content: 'Build clean, soothing, beautiful things. Keep it simple and cute! SreeshSpace is my digital zen garden for bookmarks, focus, and quick thoughts.\n\nKeep focusing on small daily wins and maintain clarity in everything I do.',
    highlight: '⭐ Focus on small daily wins and stay curious.',
    color: '#e1ede6',
    pinned: true,
    attachments: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'note-2',
    title: '💡 Creative Ideas for SreeshSpace',
    content: '1. PWA mobile home screen ready for iOS and Android\n2. Instant link pasting and fluid folder drag & drop\n3. GitHub contribution squares to visualize daily progress\n4. Popup note editor with headline, formatted paragraphs, highlights, and file attachments!',
    highlight: '🚀 Turn web app into mobile & desktop daily driver.',
    color: '#feeddf',
    pinned: false,
    attachments: [],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'note-3',
    title: '🎨 Color Palette & Zen Tokens',
    content: 'Soothing Cream (#fbf9f6) • Matcha Sage (#4e876c) • Apricot Peach (#ee7751) • Lavender Wisteria (#8e6eb4) • Espresso Dark Roast (#14110e)\n\nDesigned to be gentle and relaxing on the eyes at any time of day or night.',
    highlight: '🎨 Gentle pastel tones that prevent eye fatigue.',
    color: '#fef5e1',
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
    category: 'Uncategorized', // Loose link ready to be dragged!
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
    category: 'Uncategorized', // Loose link ready to be dragged!
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

export async function loadTodos(): Promise<TodoItem[]> {
  try {
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
    await saveTodos(INITIAL_TODOS);
    return INITIAL_TODOS;
  } catch (err) {
    return INITIAL_TODOS;
  }
}

export async function saveTodos(todos: TodoItem[]): Promise<void> {
  try {
    await set(STORAGE_KEY_TODOS, todos);
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
  } catch (err) {
    console.error('Error saving todos:', err);
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

export function exportBackup(
  links: LinkItem[], 
  categories: CategoryInfo[], 
  todos?: TodoItem[], 
  notes?: NoteItem[]
): string {
  return JSON.stringify({
    app: 'SreeshSpace',
    owner: 'Sreeshnav',
    version: '4.0',
    exportedAt: new Date().toISOString(),
    categories,
    links,
    todos: todos || [],
    notes: notes || [],
  }, null, 2);
}

export function downloadJsonFile(content: string, filename = 'sreeshspace-backup.json') {
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
