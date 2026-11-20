import type { Attachment } from './index';

export type TodoType = 'daily' | 'permanent';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type ProgressMode = 'checklist' | 'manual';
export type RoutineFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom' | 'period';
export type MoodScore = 1 | 2 | 3 | 4 | 5; // 1: 😞, 2: 🙁, 3: 😐, 4: 🙂, 5: 🌸

export interface SubTask {
  id: string;
  text: string;
  done: boolean;
  doneAt?: string; // ISO string
}

export interface GoalExtension {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  reason?: string;
  at: string; // ISO string
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  type: TodoType;
  priority: PriorityLevel;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  completedAt?: string; // ISO string
  notes?: string;
  tags?: string[];
  subtasks?: SubTask[];

  // Daily specific
  date?: string; // YYYY-MM-DD (local calendar date, set for daily)
  carriedFrom?: string; // YYYY-MM-DD
  originId?: string; // links carried-over copies to the original
  recurringId?: string; // links to a saved Routine
  carryCount?: number; // Number of times carried forward
  attachments?: Attachment[];
  focusMinutes?: number;
  rolloverDecision?: 'left_behind' | 'carried';
  rolloverHandled?: boolean;

  // Permanent specific
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: GoalStatus;
  progressMode?: ProgressMode;
  progress?: number; // 0-100
  extensions?: GoalExtension[];
}

export type ActivityEventType =
  | 'task_added'
  | 'task_completed'
  | 'task_uncompleted'
  | 'task_deleted'
  | 'task_archived'
  | 'goal_created'
  | 'goal_completed'
  | 'goal_extended'
  | 'goal_archived'
  | 'subtask_done'
  | 'note_added'
  | 'note_edited'
  | 'link_added'
  | 'link_opened'
  | 'focus_session'
  | 'streak_freeze';

export interface ActivityEvent {
  id: string;
  ts: number; // Date.now() timestamp
  date: string; // YYYY-MM-DD (local date of the event)
  type: ActivityEventType;
  refId: string;
  title: string; // Snapshot at time of event
  meta?: {
    priority?: PriorityLevel;
    itemType?: 'daily' | 'permanent' | 'note' | 'link';
    durationMinutes?: number;
    progress?: number;
    from?: string;
    to?: string;
    reason?: string;
    carriedFrom?: string;
    [key: string]: any;
  };
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  reflection?: string;
  mood?: MoodScore;
  planned: number;
  completed: number;
  focusMinutes?: number;
  finalizedAt?: string; // ISO string
}

export interface RoutineItem {
  id: string;
  text: string;
  priority: PriorityLevel;
  frequency: RoutineFrequency;
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  active?: boolean;
  tags?: string[];
  createdAt: string;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  freezesRemaining: number;
  lastActiveDate?: string;
  frozenDates: string[]; // YYYY-MM-DD
}

export type GoalHealthStatus = 
  | 'on_track'
  | 'at_risk'
  | 'due_soon'
  | 'overdue'
  | 'completed'
  | 'late';
