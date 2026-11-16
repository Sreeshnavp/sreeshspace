import React from 'react';
import { StreakHeroCommandCenter } from './StreakHeroCommandCenter';
import { TodoList } from './TodoList';
import { NotesArea } from './NotesArea';
import type { 
  LinkItem, 
  TodoItem, 
  NoteItem, 
  Attachment, 
  ActivityEvent, 
  StreakState, 
  DayLog 
} from '../types';

interface NotebookAreaProps {
  links: LinkItem[];
  todos: TodoItem[];
  notes: NoteItem[];
  events?: ActivityEvent[];
  streakState?: StreakState;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayLogs: Record<string, DayLog>;
  onSaveDayLog: (dateKey: string, updates: Partial<DayLog>) => void;
  onAddTodo: (text: string, type: 'daily' | 'permanent', priority: 'low' | 'medium' | 'high', dateKey?: string, tags?: string[]) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onArchiveCompletedDaily?: (dateKey: string) => void;
  onArchiveCompletedPermanent?: () => void;
  onReorderTodos?: (reordered: TodoItem[]) => void;
  onOpenHistoryTimeline: () => void;
  onOpenCreateGoal: () => void;
  onOpenEditGoal: (goal: TodoItem) => void;
  onOpenExtendGoal: (goal: TodoItem) => void;
  onStartFocusSession: (task: TodoItem) => void;
  onToggleSubtask: (goalId: string, subtaskId: string) => void;
  onCopyYesterdayList?: () => void;
  onClearAllGoals?: () => void;
  onInspectDay?: (dateKey: string) => void;
  onOpenInsights?: () => void;
  onOpenWeeklyReview?: () => void;
  onAddNote: (note: { title: string; content: string; highlight?: string; color: string; pinned: boolean; attachments?: Attachment[] }) => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onOpenAttachment?: (attachment: Attachment) => void;
  onReorderNotes?: (reordered: NoteItem[]) => void;
}

export const NotebookArea: React.FC<NotebookAreaProps> = ({
  links,
  todos,
  notes,
  events,
  streakState,
  selectedDate,
  onSelectDate,
  dayLogs,
  onSaveDayLog,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onArchiveCompletedDaily,
  onArchiveCompletedPermanent,
  onReorderTodos,
  onOpenHistoryTimeline,
  onOpenCreateGoal,
  onOpenEditGoal,
  onOpenExtendGoal,
  onStartFocusSession,
  onToggleSubtask,
  onCopyYesterdayList,
  onClearAllGoals,
  onInspectDay,
  onOpenInsights,
  onOpenWeeklyReview,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onOpenAttachment,
  onReorderNotes,
}) => {
  return (
    <div className="space-y-6">
      
      {/* 1. TOP MAIN: STREAK HERO COMMAND CENTER & DETAILED GITHUB ACTIVITY INSIGHTS */}
      <StreakHeroCommandCenter
        links={links}
        todos={todos}
        notes={notes}
        events={events}
        streakState={streakState}
        selectedDate={selectedDate}
        onInspectDay={onInspectDay}
        onOpenInsights={onOpenInsights}
        onOpenWeeklyReview={onOpenWeeklyReview}
      />

      {/* 2. SIDE-BY-SIDE OR MOBILE TABS TO-DO LISTS: DAILY FOCUS & PERMANENT GOALS */}
      <TodoList
        todos={todos}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        dayLogs={dayLogs}
        onSaveDayLog={onSaveDayLog}
        onAddTodo={onAddTodo}
        onToggleTodo={onToggleTodo}
        onDeleteTodo={onDeleteTodo}
        onArchiveCompletedDaily={onArchiveCompletedDaily}
        onArchiveCompletedPermanent={onArchiveCompletedPermanent}
        onReorderTodos={onReorderTodos}
        onOpenHistoryTimeline={onOpenHistoryTimeline}
        onOpenCreateGoal={onOpenCreateGoal}
        onOpenEditGoal={onOpenEditGoal}
        onOpenExtendGoal={onOpenExtendGoal}
        onStartFocusSession={onStartFocusSession}
        onToggleSubtask={onToggleSubtask}
        onCopyYesterdayList={onCopyYesterdayList}
        onClearAllGoals={onClearAllGoals}
      />

      {/* 3. BOTTOM SECTION: ENHANCED SCRATCHPAD & PASTEL NOTES WITH DRAG & DROP */}
      <NotesArea
        notes={notes}
        onAddNote={onAddNote}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
        onOpenAttachment={onOpenAttachment}
        onReorderNotes={onReorderNotes}
      />

    </div>
  );
};
