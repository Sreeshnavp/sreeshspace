import React from 'react';
import { StreakHeroCommandCenter } from './StreakHeroCommandCenter';
import { TodoList } from './TodoList';
import { NotesArea } from './NotesArea';
import type { LinkItem, TodoItem, NoteItem, Attachment } from '../types';

interface NotebookAreaProps {
  links: LinkItem[];
  todos: TodoItem[];
  notes: NoteItem[];
  onAddTodo: (text: string, type: 'daily' | 'permanent', priority: 'low' | 'medium' | 'high') => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onClearCompletedDaily?: () => void;
  onClearCompletedPermanent?: () => void;
  onReorderTodos?: (reordered: TodoItem[]) => void;
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
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onClearCompletedDaily,
  onClearCompletedPermanent,
  onReorderTodos,
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
      />

      {/* 2. SIDE-BY-SIDE TO-DO LISTS: DAILY FOCUS (LEFT) & PERMANENT GOALS (RIGHT) WITH LIQUID DRAG & DROP */}
      <TodoList
        todos={todos}
        onAddTodo={onAddTodo}
        onToggleTodo={onToggleTodo}
        onDeleteTodo={onDeleteTodo}
        onClearCompletedDaily={onClearCompletedDaily}
        onClearCompletedPermanent={onClearCompletedPermanent}
        onReorderTodos={onReorderTodos}
      />

      {/* 3. BOTTOM SECTION: ENHANCED SCRATCHPAD & PASTEL NOTES WITH LIQUID DRAG & DROP & CONCENTRATED DARK COLORS */}
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
