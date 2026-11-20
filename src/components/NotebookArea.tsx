import React from 'react';
import { HabitsDashboard } from './habits/HabitsDashboard';
import type { 
  LinkItem, 
  TodoItem, 
  NoteItem, 
  Attachment, 
  ActivityEvent, 
  StreakState, 
  DayLog,
  RoutineItem
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
  onOpenHistoryTimeline?: () => void;
  onOpenCreateGoal?: () => void;
  onOpenEditGoal?: (goal: TodoItem) => void;
  onOpenExtendGoal?: (goal: TodoItem) => void;
  onStartFocusSession?: (task: TodoItem) => void;
  onToggleSubtask?: (goalId: string, subtaskId: string) => void;
  onCopyYesterdayList?: () => void;
  onClearAllGoals?: () => void;
  onInspectDay?: (dateKey: string) => void;
  onOpenInsights?: () => void;
  onOpenWeeklyReview?: () => void;
  routines?: RoutineItem[];
  onSaveRoutine?: (routine: RoutineItem) => void;
  onDeleteRoutine?: (id: string) => void;
  onAddNote?: (note: { title: string; content: string; highlight?: string; color: string; pinned: boolean; attachments?: Attachment[] }) => void;
  onUpdateNote?: (note: NoteItem) => void;
  onDeleteNote?: (id: string) => void;
  onOpenAttachment?: (attachment: Attachment) => void;
  onReorderNotes?: (reordered: NoteItem[]) => void;
}

export const NotebookArea: React.FC<NotebookAreaProps> = (props) => {
  return (
    <div className="space-y-6">
      <HabitsDashboard
        todos={props.todos}
        routines={props.routines}
        streakState={props.streakState}
        events={props.events}
        selectedDate={props.selectedDate}
        onSelectDate={props.onSelectDate}
        dayLogs={props.dayLogs}
        onSaveDayLog={props.onSaveDayLog}
        onAddTodo={props.onAddTodo}
        onToggleTodo={props.onToggleTodo}
        onDeleteTodo={props.onDeleteTodo}
        onArchiveCompletedDaily={props.onArchiveCompletedDaily}
        onArchiveCompletedPermanent={props.onArchiveCompletedPermanent}
        onSaveRoutine={props.onSaveRoutine}
        onDeleteRoutine={props.onDeleteRoutine}
        onOpenCreateGoal={props.onOpenCreateGoal}
        onOpenEditGoal={props.onOpenEditGoal}
        onOpenInsights={props.onOpenInsights}
        onOpenWeeklyReview={props.onOpenWeeklyReview}
      />
    </div>
  );
};
