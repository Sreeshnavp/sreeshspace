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
  createdAt?: string;
  updatedAt?: string;
  order?: number;
}

export type MainTab = 'all' | 'categories';
export type ViewMode = 'grid' | 'list';
export type WorkspaceView = 'links' | 'notebook' | 'reels' | 'finance' | 'notes' | 'both';
export type AccentTheme = 'sage' | 'peach' | 'wisteria' | 'sky' | 'honey';

export * from './todo';
export * from './finance';
export * from './reels';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  highlight?: string;
  color: string;
  pinned: boolean;
  tag?: string;
  drawing?: string; // Optional embedded sketch data URL
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface SketchItem {
  id: string;
  title: string;
  dataUrl: string; // Base64 PNG image data
  paperStyle?: 'cream' | 'blank' | 'grid' | 'dots' | 'ruled' | 'dark';
  colorTheme?: string;
  tag?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  details: string[];
}
