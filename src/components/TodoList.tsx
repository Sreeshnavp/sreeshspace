import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  Calendar, 
  Bookmark, 
  GripVertical,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  Sun,
  Target,
  CheckCircle2,
  Compass
} from 'lucide-react';
import type { TodoItem } from '../types';
import { triggerPartyPop, playPopSound } from '../utils/delight';

interface TodoListProps {
  todos: TodoItem[];
  onAddTodo: (text: string, type: 'daily' | 'permanent', priority: 'low' | 'medium' | 'high') => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onClearCompletedDaily?: () => void;
  onClearCompletedPermanent?: () => void;
  onReorderTodos?: (reordered: TodoItem[]) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onClearCompletedDaily,
  onClearCompletedPermanent,
  onReorderTodos,
}) => {
  const [dailyText, setDailyText] = useState('');
  const [dailyPriority, setDailyPriority] = useState<'low' | 'medium' | 'high'>('high');

  const [permText, setPermText] = useState('');
  const [permPriority, setPermPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Drag and drop state for liquid reordering and cross-column moving
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverTodoId, setDragOverTodoId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'daily' | 'permanent' | null>(null);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Handle adding Daily task
  const handleAddDaily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyText.trim()) return;
    onAddTodo(dailyText.trim(), 'daily', dailyPriority);
    setDailyText('');
    triggerPartyPop('single');
  };

  // Handle adding Permanent task
  const handleAddPermanent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permText.trim()) return;
    onAddTodo(permText.trim(), 'permanent', permPriority);
    setPermText('');
    triggerPartyPop('single');
  };

  const handleToggle = (todo: TodoItem) => {
    const willBeCompleted = !todo.completed;
    if (willBeCompleted) {
      const activeDaily = todos.filter((t) => (t.type || 'permanent') === 'daily' && !t.completed);
      if (todo.type === 'daily' && activeDaily.length === 1 && activeDaily[0].id === todo.id) {
        triggerPartyPop('grand'); // Grand celebration when all daily goals are cleared!
      } else {
        triggerPartyPop('single');
      }
    } else {
      playPopSound();
    }
    onToggleTodo(todo.id);
  };

  // 1. Daily Todos (Active first, completed sink to bottom)
  const dailyTodos = todos.filter((t) => (t.type || 'permanent') === 'daily');
  const sortedDaily = [...dailyTodos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return 0; // Keep user reordered position among active items!
  });
  const dailyActive = dailyTodos.filter((t) => !t.completed).length;
  const dailyDone = dailyTodos.filter((t) => t.completed).length;
  const dailyProgress = dailyTodos.length > 0 ? Math.round((dailyDone / dailyTodos.length) * 100) : 0;

  // 2. Permanent Todos (Active first, completed sink to bottom)
  const permTodos = todos.filter((t) => (t.type || 'permanent') === 'permanent');
  const sortedPerm = [...permTodos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return 0; // Keep user reordered position among active items!
  });
  const permActive = permTodos.filter((t) => !t.completed).length;
  const permDone = permTodos.filter((t) => t.completed).length;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTodoId(id);
    playPopSound();
  };

  const handleDragEnd = () => {
    setDraggedTodoId(null);
    setDragOverTodoId(null);
    setDragOverColumn(null);
  };

  const handleDragOverCard = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTodoId && draggedTodoId !== targetId) {
      setDragOverTodoId(targetId);
    }
  };

  const handleDropOnCard = (e: React.DragEvent, targetTodo: TodoItem) => {
    e.preventDefault();
    if (!draggedTodoId || draggedTodoId === targetTodo.id || !onReorderTodos) {
      handleDragEnd();
      return;
    }

    const draggedItem = todos.find((t) => t.id === draggedTodoId);
    if (!draggedItem) {
      handleDragEnd();
      return;
    }

    // New item with updated section if dragged between columns
    const updatedDragged: TodoItem = {
      ...draggedItem,
      type: targetTodo.type,
    };

    const remaining = todos.filter((t) => t.id !== draggedTodoId);
    const targetIdx = remaining.findIndex((t) => t.id === targetTodo.id);

    if (targetIdx !== -1) {
      remaining.splice(targetIdx, 0, updatedDragged);
    } else {
      remaining.push(updatedDragged);
    }

    onReorderTodos(remaining);
    playPopSound();
    triggerPartyPop('single');
    handleDragEnd();
  };

  const handleDropOnColumn = (e: React.DragEvent, targetType: 'daily' | 'permanent') => {
    e.preventDefault();
    if (!draggedTodoId || !onReorderTodos) {
      handleDragEnd();
      return;
    }

    const draggedItem = todos.find((t) => t.id === draggedTodoId);
    if (!draggedItem) {
      handleDragEnd();
      return;
    }

    // If dropped on the column container (not on a specific card)
    if (draggedItem.type !== targetType) {
      const updated = todos.map((t) =>
        t.id === draggedTodoId ? { ...t, type: targetType } : t
      );
      onReorderTodos(updated);
      playPopSound();
      triggerPartyPop('single');
    }
    handleDragEnd();
  };

  const renderPriorityBadge = (p?: 'low' | 'medium' | 'high') => {
    if (p === 'high') {
      return (
        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-peach-100 text-peach-700 dark:bg-peach-950/80 dark:text-peach-300 border border-peach-200/90 dark:border-peach-700/80">
          High
        </span>
      );
    }
    if (p === 'medium') {
      return (
        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-sage-100 text-sage-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-sage-200/90 dark:border-emerald-700/80">
          Med
        </span>
      );
    }
    return (
      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-wisteria-100 text-wisteria-700 dark:bg-purple-950/80 dark:text-purple-300 border border-wisteria-200/90 dark:border-purple-700/80">
        Low
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
      
      {/* ================= COLUMN 1: DAILY FOCUS (TODAY) ================= */}
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverColumn('daily');
        }}
        onDragLeave={() => {
          if (dragOverColumn === 'daily') setDragOverColumn(null);
        }}
        onDrop={(e) => handleDropOnColumn(e, 'daily')}
        className={`flex flex-col justify-between rounded-3xl p-5 border shadow-soft transition-all duration-300 min-h-[420px] ${
          dragOverColumn === 'daily'
            ? 'border-peach-400 dark:border-peach-400 ring-4 ring-peach-400/20 bg-peach-50/30 dark:bg-peach-950/20'
            : 'bg-white dark:bg-gradient-to-b dark:from-espresso-850 dark:to-[#1f1510] border-cream-200/90 dark:border-peach-900/40'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-peach-500 to-amber-300 text-white flex items-center justify-center shadow-pill">
                <Sun size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-espresso-900 dark:text-cream-50 leading-tight">
                  Daily Focus (Today)
                </h3>
                <span className="text-[11px] text-espresso-800/50 dark:text-cream-100/50 font-medium flex items-center gap-1">
                  <Calendar size={11} />
                  <span>{todayStr} • Drag cards to reorder</span>
                </span>
              </div>
            </div>

            {/* Daily Progress */}
            {dailyTodos.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-espresso-800/60 dark:text-cream-100/60 font-mono">
                  {dailyDone}/{dailyTodos.length} ({dailyProgress}%)
                </span>
                <div className="w-14 h-2 rounded-full bg-cream-200 dark:bg-espresso-800 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full ${
                      dailyProgress === 100 
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                        : 'bg-gradient-to-r from-peach-500 to-amber-400 shadow-[0_0_8px_rgba(238,119,81,0.5)]'
                    }`}
                    style={{ width: `${dailyProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Input Bar */}
          <form onSubmit={handleAddDaily} className="flex items-center gap-2 mb-3.5">
            <input
              type="text"
              value={dailyText}
              onChange={(e) => setDailyText(e.target.value)}
              placeholder="Add today's task..."
              className="flex-1 px-3.5 py-2 text-xs bg-cream-50/80 dark:bg-espresso-900/80 border border-cream-200 dark:border-espresso-750 rounded-2xl focus:outline-none focus:ring-2 focus:ring-peach-400/50 text-espresso-900 dark:text-cream-50 placeholder-espresso-800/40 dark:placeholder-cream-100/40 font-medium shadow-xs"
            />
            <select
              value={dailyPriority}
              onChange={(e) => setDailyPriority(e.target.value as any)}
              className="text-[11px] font-bold px-2.5 py-2 rounded-2xl bg-cream-100 dark:bg-espresso-800 border border-cream-200 dark:border-espresso-750 text-espresso-800 dark:text-cream-100 focus:outline-none cursor-pointer"
            >
              <option value="high">🌸 High</option>
              <option value="medium">🌿 Med</option>
              <option value="low">☕ Low</option>
            </select>
            <button
              type="submit"
              disabled={!dailyText.trim()}
              className="p-2 bg-gradient-to-r from-peach-500 to-amber-400 hover:from-peach-600 hover:to-amber-500 disabled:opacity-40 text-white rounded-2xl shadow-pill transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Add task"
            >
              <Plus size={16} className="stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Task Items: Liquid Drag & Drop, active at top, completed sink to bottom */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 max-h-[220px]">
          {sortedDaily.length === 0 ? (
            <div className="py-8 text-center text-espresso-800/40 dark:text-cream-100/40 text-xs">
              <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-peach-50 dark:bg-peach-950/50 flex items-center justify-center text-peach-500 border border-peach-200/60 dark:border-peach-800/60">
                <CheckCircle2 size={20} className="stroke-[2.2]" />
              </div>
              <span className="font-bold block text-espresso-800/70 dark:text-cream-100/70 mb-0.5">All clear for today!</span>
              <span className="text-[11px] opacity-75">Add a task above to start flow</span>
            </div>
          ) : (
            sortedDaily.map((todo) => {
              const isDraggingThis = draggedTodoId === todo.id;
              const isOverThis = dragOverTodoId === todo.id;

              return (
                <div key={todo.id} className="relative">
                  {/* Liquid drop slot indicator */}
                  {isOverThis && !isDraggingThis && (
                    <div className="h-1.5 my-1 bg-peach-400 rounded-full shadow-[0_0_8px_rgba(238,119,81,0.6)] animate-pulse transition-all duration-200" />
                  )}

                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, todo.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOverCard(e, todo.id)}
                    onDrop={(e) => handleDropOnCard(e, todo)}
                    className={`group flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none cursor-grab active:cursor-grabbing ${
                      isDraggingThis
                        ? 'opacity-35 scale-95 border-peach-400 shadow-inner'
                        : todo.completed
                        ? 'bg-cream-100/30 dark:bg-espresso-900/40 border-cream-200/40 dark:border-espresso-800/40 opacity-60'
                        : 'bg-white dark:bg-espresso-800/90 border-cream-200/90 dark:border-espresso-750 hover:border-peach-300 dark:hover:border-peach-600 shadow-xs hover:shadow-soft hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Drag Handle & Checkmark */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <GripVertical 
                        size={14} 
                        className="text-espresso-800/25 dark:text-cream-100/25 group-hover:text-espresso-800/60 dark:group-hover:text-cream-100/60 transition-colors shrink-0" 
                      />
                      
                      {/* Prominent Tick Square */}
                      <button
                        type="button"
                        onClick={() => handleToggle(todo)}
                        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer ${
                          todo.completed
                            ? 'bg-peach-500 border-peach-500 text-white shadow-xs'
                            : 'border-cream-400/80 dark:border-espresso-600 bg-white dark:bg-espresso-750 hover:border-peach-500 dark:hover:border-peach-400 hover:scale-105'
                        }`}
                      >
                        {todo.completed && <Check size={13} className="stroke-[3.5]" />}
                      </button>

                      <span
                        onClick={() => handleToggle(todo)}
                        className={`text-xs sm:text-sm font-semibold truncate cursor-pointer flex-1 ${
                          todo.completed
                            ? 'line-through text-espresso-800/40 dark:text-cream-100/40 font-normal'
                            : 'text-espresso-900 dark:text-cream-50'
                        }`}
                      >
                        {todo.text}
                      </span>
                    </div>

                    {/* Priority badge & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {renderPriorityBadge(todo.priority)}
                      <button
                        onClick={() => onDeleteTodo(todo.id)}
                        className="p-1 text-espresso-800/20 hover:text-red-500 dark:text-cream-100/20 dark:hover:text-red-400 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Clear Area Below for Daily Focus */}
        <div className="pt-3 mt-auto border-t border-cream-200/80 dark:border-espresso-800 flex items-center justify-between text-xs text-espresso-800/50 dark:text-cream-100/50">
          <span>{dailyActive} tasks remaining</span>
          {dailyDone > 0 && onClearCompletedDaily && (
            <button
              onClick={() => {
                onClearCompletedDaily();
                playPopSound();
              }}
              className="text-peach-600 dark:text-peach-400 font-extrabold hover:underline flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-peach-50 dark:hover:bg-peach-950/60 transition cursor-pointer"
            >
              <Trash2 size={11} />
              <span>Clear completed ({dailyDone})</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= COLUMN 2: PERMANENT GOALS & HABITS ================= */}
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverColumn('permanent');
        }}
        onDragLeave={() => {
          if (dragOverColumn === 'permanent') setDragOverColumn(null);
        }}
        onDrop={(e) => handleDropOnColumn(e, 'permanent')}
        className={`flex flex-col justify-between rounded-3xl p-5 border shadow-soft transition-all duration-300 min-h-[420px] ${
          dragOverColumn === 'permanent'
            ? 'border-sage-400 dark:border-sage-400 ring-4 ring-sage-400/20 bg-sage-50/30 dark:bg-sage-950/20'
            : 'bg-white dark:bg-gradient-to-b dark:from-espresso-850 dark:to-[#0f2219] border-cream-200/90 dark:border-sage-900/40'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sage-600 to-emerald-400 text-white flex items-center justify-center shadow-pill">
                <Target size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-espresso-900 dark:text-cream-50 leading-tight">
                  Permanent Goals & Habits
                </h3>
                <span className="text-[11px] text-espresso-800/50 dark:text-cream-100/50 font-medium flex items-center gap-1">
                  <Bookmark size={11} />
                  <span>Long-term bucket list & mastery</span>
                </span>
              </div>
            </div>

            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-sage-100 dark:bg-emerald-950 text-sage-800 dark:text-emerald-300 font-mono border border-sage-200/80 dark:border-emerald-800/80">
              {permActive} active
            </span>
          </div>

          {/* Quick Input Bar */}
          <form onSubmit={handleAddPermanent} className="flex items-center gap-2 mb-3.5">
            <input
              type="text"
              value={permText}
              onChange={(e) => setPermText(e.target.value)}
              placeholder="Add long-term goal or habit..."
              className="flex-1 px-3.5 py-2 text-xs bg-cream-50/80 dark:bg-espresso-900/80 border border-cream-200 dark:border-espresso-750 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage-400/50 text-espresso-900 dark:text-cream-50 placeholder-espresso-800/40 dark:placeholder-cream-100/40 font-medium shadow-xs"
            />
            <select
              value={permPriority}
              onChange={(e) => setPermPriority(e.target.value as any)}
              className="text-[11px] font-bold px-2.5 py-2 rounded-2xl bg-cream-100 dark:bg-espresso-800 border border-cream-200 dark:border-espresso-750 text-espresso-800 dark:text-cream-100 focus:outline-none cursor-pointer"
            >
              <option value="high">🌸 High</option>
              <option value="medium">🌿 Med</option>
              <option value="low">☕ Low</option>
            </select>
            <button
              type="submit"
              disabled={!permText.trim()}
              className="p-2 bg-gradient-to-r from-sage-600 to-emerald-500 hover:from-sage-500 hover:to-emerald-400 disabled:opacity-40 text-white rounded-2xl shadow-pill transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Add goal"
            >
              <Plus size={16} className="stroke-[2.5]" />
            </button>
          </form>
        </div>

        {/* Task Items: Liquid Drag & Drop, active first, completed sink to bottom */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1 max-h-[220px]">
          {sortedPerm.length === 0 ? (
            <div className="py-8 text-center text-espresso-800/40 dark:text-cream-100/40 text-xs">
              <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-sage-50 dark:bg-emerald-950/50 flex items-center justify-center text-sage-600 dark:text-emerald-400 border border-sage-200/60 dark:border-emerald-800/60">
                <Compass size={20} className="stroke-[2.2]" />
              </div>
              <span className="font-bold block text-espresso-800/70 dark:text-cream-100/70 mb-0.5">No permanent goals yet</span>
              <span className="text-[11px] opacity-75">Add master milestones above</span>
            </div>
          ) : (
            sortedPerm.map((todo) => {
              const isDraggingThis = draggedTodoId === todo.id;
              const isOverThis = dragOverTodoId === todo.id;

              return (
                <div key={todo.id} className="relative">
                  {/* Liquid drop slot indicator */}
                  {isOverThis && !isDraggingThis && (
                    <div className="h-1.5 my-1 bg-sage-500 rounded-full shadow-[0_0_8px_rgba(78,135,108,0.6)] animate-pulse transition-all duration-200" />
                  )}

                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, todo.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOverCard(e, todo.id)}
                    onDrop={(e) => handleDropOnCard(e, todo)}
                    className={`group flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none cursor-grab active:cursor-grabbing ${
                      isDraggingThis
                        ? 'opacity-35 scale-95 border-sage-500 shadow-inner'
                        : todo.completed
                        ? 'bg-cream-100/30 dark:bg-espresso-900/40 border-cream-200/40 dark:border-espresso-800/40 opacity-60'
                        : 'bg-white dark:bg-espresso-800/90 border-cream-200/90 dark:border-espresso-750 hover:border-sage-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-soft hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Drag Handle & Checkmark */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <GripVertical 
                        size={14} 
                        className="text-espresso-800/25 dark:text-cream-100/25 group-hover:text-espresso-800/60 dark:group-hover:text-cream-100/60 transition-colors shrink-0" 
                      />

                      {/* Prominent Tick Square */}
                      <button
                        type="button"
                        onClick={() => handleToggle(todo)}
                        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer ${
                          todo.completed
                            ? 'bg-sage-600 dark:bg-emerald-500 border-sage-600 dark:border-emerald-500 text-white shadow-xs'
                            : 'border-cream-400/80 dark:border-espresso-600 bg-white dark:bg-espresso-750 hover:border-sage-500 dark:hover:border-emerald-400 hover:scale-105'
                        }`}
                      >
                        {todo.completed && <Check size={13} className="stroke-[3.5]" />}
                      </button>

                      <span
                        onClick={() => handleToggle(todo)}
                        className={`text-xs sm:text-sm font-semibold truncate cursor-pointer flex-1 ${
                          todo.completed
                            ? 'line-through text-espresso-800/40 dark:text-cream-100/40 font-normal'
                            : 'text-espresso-900 dark:text-cream-50'
                        }`}
                      >
                        {todo.text}
                      </span>
                    </div>

                    {/* Priority badge & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {renderPriorityBadge(todo.priority)}
                      <button
                        onClick={() => onDeleteTodo(todo.id)}
                        className="p-1 text-espresso-800/20 hover:text-red-500 dark:text-cream-100/20 dark:hover:text-red-400 rounded-lg transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete goal"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-auto border-t border-cream-200/80 dark:border-espresso-800 flex items-center justify-between text-xs text-espresso-800/50 dark:text-cream-100/50">
          <span>{permActive} goals remaining</span>
          {permDone > 0 && onClearCompletedPermanent && (
            <button
              onClick={() => {
                onClearCompletedPermanent();
                playPopSound();
                triggerPartyPop('single');
              }}
              className="text-sage-600 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-sage-50 dark:hover:bg-emerald-950/60 transition cursor-pointer"
            >
              <Trash2 size={11} />
              <span>Clear completed ({permDone})</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
