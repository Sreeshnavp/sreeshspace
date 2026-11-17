export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  createdAt: string;
}

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  category: string;
  notes: string;
  pinned: boolean;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'archived';
  attachments: Attachment[];
  clicks: number;
  favicon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export type MainTab = 'all' | 'categories';
export type ViewMode = 'grid' | 'list';
export type WorkspaceView = 'links' | 'notebook' | 'finance' | 'both';
export type AccentTheme = 'sage' | 'peach' | 'wisteria' | 'sky' | 'honey';

export * from './todo';
export * from './finance';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  highlight?: string;
  color: string;
  pinned: boolean;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  details: string[];
}
