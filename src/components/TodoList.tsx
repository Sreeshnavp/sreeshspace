import React, { useState } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  Calendar, 
  Bookmark, 
  GripVertical,
  Sun,
  Target,
  CheckCircle2,
  Compass,
  RotateCcw,
  Clock,
  Sparkles,
  BarChart2,
  Sliders,
  Archive,
  ArrowRight
} from 'lucide-react';
import type { TodoItem, DayLog, GoalHealthStatus } from '../types';
import { triggerPartyPop, playPopSound } from '../utils/delight';
import { DateNavigator } from './DateNavigator';
import { DailyReflectionCard } from './DailyReflectionCard';
import { GoalCard } from './GoalCard';
import { GanttTimelineView } from './GanttTimelineView';
import { parseNaturalLanguageTodo } from '../utils/nlpTodoParser';
import { todayKey, addDays } from '../utils/dates';

interface TodoListProps {
  todos: TodoItem[];
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
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
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
}) => {
  // Mobile tab state: 'daily' vs 'goals' vs 'timeline'
  const [mobileTab, setMobileTab] = useState<'daily' | 'goals'>('daily');
  const [goalsViewMode, setGoalsViewMode] = useState<'cards' | 'timeline'>('cards');
  const [goalsFilter, setGoalsFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Daily task quick add
  const [dailyInput, setDailyInput] = useState('');
  const [isPastReadOnly, setIsPastReadOnly] = useState(true);

  // Drag and drop state
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverTodoId, setDragOverTodoId] = useState<string | null>(null);

  const today = todayKey();
  const isViewingPast = selectedDate < today;
  const isLocked = isViewingPast && isPastReadOnly;

  // Filter daily tasks strictly for selectedDate
  const dailyTasksForDate = React.useMemo(() => {
    return todos.filter(
      (t) => (t.type || 'permanent') === 'daily' && (t.date === selectedDate || (!t.date && selectedDate === today))
    );
  }, [todos, selectedDate, today]);

  // Sort: active tasks top, completed sink to bottom
  const sortedDailyTasks = React.useMemo(() => {
    return [...dailyTasksForDate].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return 0;
    });
  }, [dailyTasksForDate]);

  const dailyActive = dailyTasksForDate.filter((t) => !t.completed).length;
  const dailyDone = dailyTasksForDate.filter((t) => t.completed).length;
  const dailyTotal = dailyTasksForDate.length;
  const dailyProgress = dailyTotal > 0 ? Math.round((dailyDone / dailyTotal) * 100) : 0;

  // Filter permanent goals
  const permanentGoals = React.useMemo(() => {
    return todos.filter((t) => (t.type || 'permanent') === 'permanent');
  }, [todos]);

  const filteredGoals = React.useMemo(() => {
    if (goalsFilter === 'active') {
      return permanentGoals.filter((g) => !g.completed && g.status !== 'archived');
    }
    if (goalsFilter === 'completed') {
      return permanentGoals.filter((g) => g.completed || g.status === 'completed');
    }
    return permanentGoals;
  }, [permanentGoals, goalsFilter]);

  const permActive = permanentGoals.filter((g) => !g.completed && g.status !== 'archived').length;
  const permDone = permanentGoals.filter((g) => g.completed || g.status === 'completed').length;

  // Handle Natural Language Daily Add
  const handleAddDailySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyInput.trim() || isLocked) return;

    const parsed = parseNaturalLanguageTodo(dailyInput);
    if (!parsed.cleanText) return;

    const targetDate = parsed.dateKey || selectedDate;
    const priority = parsed.priority || 'medium';

    onAddTodo(parsed.cleanText, 'daily', priority, targetDate, parsed.tags);
    setDailyInput('');
    triggerPartyPop('single');
  };

  const handleToggle = (todo: TodoItem) => {
    const willBeCompleted = !todo.completed;
    if (willBeCompleted) {
      if (todo.type === 'daily' && dailyActive === 1) {
        triggerPartyPop('grand'); // Grand celebration when all daily tasks complete!
      } else {
        triggerPartyPop('single');
      }
    } else {
      playPopSound();
    }
    onToggleTodo(todo.id);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isLocked) return;
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTodoId(id);
    playPopSound();
  };

  const handleDragEnd = () => {
    setDraggedTodoId(null);
    setDragOverTodoId(null);
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

    const remaining = todos.filter((t) => t.id !== draggedTodoId);
    const targetIdx = remaining.findIndex((t) => t.id === targetTodo.id);

    if (targetIdx !== -1) {
      remaining.splice(targetIdx, 0, draggedItem);
    } else {
      remaining.push(draggedItem);
    }

    onReorderTodos(remaining);
    playPopSound();
    handleDragEnd();
  };

  return (
    <div className="space-y-4">
      {/* Mobile Switcher Tab (Visible on small screens) */}
      <div className="flex sm:hidden p-1 rounded-2xl bg-sunken border border-subtle">
        <button
          type="button"
          onClick={() => {
            setMobileTab('daily');
            playPopSound();
          }}
          className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            mobileTab === 'daily'
              ? 'bg-surface text-main shadow-2xs font-extrabold'
              : 'text-muted'
          }`}
        >
          <Sun size={14} className="text-accent" />
          <span>Daily Focus ({dailyActive})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileTab('goals');
            playPopSound();
          }}
          className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            mobileTab === 'goals'
              ? 'bg-surface text-main shadow-2xs font-extrabold'
              : 'text-muted'
          }`}
        >
          <Target size={14} className="text-accent" />
          <span>Master Goals ({permActive})</span>
        </button>
      </div>

      {/* Main Grid: Responsive 2-column on desktop, tabbed on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        
        {/* ========================================================= */}
        {/* COLUMN 1: DAILY FOCUS & HABIT TRACKING                   */}
        {/* ========================================================= */}
        <div
          className={`bg-surface rounded-3xl p-4 sm:p-5 border border-subtle shadow-soft space-y-4 ${
            mobileTab !== 'daily' ? 'hidden sm:block' : ''
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Sun size={18} className="stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-main leading-tight">
                  Daily Focus
                </h3>
                <span className="text-[11px] text-muted">
                  {dailyDone}/{dailyTotal} completed ({dailyProgress}%)
                </span>
              </div>
            </div>

            {/* Progress Badge */}
            <span className="px-2.5 py-1 rounded-full bg-accent-soft text-accent-text text-xs font-black font-mono border border-accent/20">
              {dailyProgress}%
            </span>
          </div>

          {/* Date Navigator with Calendar Popover & Keyboard Shortcuts */}
          <DateNavigator
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            todos={todos}
            isPastReadOnly={isPastReadOnly}
            onTogglePastReadOnly={() => setIsPastReadOnly(!isPastReadOnly)}
            onOpenHistoryTimeline={onOpenHistoryTimeline}
          />

          {/* Natural Language Task Input (Disabled if past day is locked) */}
          {!isLocked && (
            <form onSubmit={handleAddDailySubmit} className="relative">
              <input
                type="text"
                value={dailyInput}
                onChange={(e) => setDailyInput(e.target.value)}
                placeholder="Add daily task (try: read book !high #study)..."
                className="w-full min-h-[44px] text-xs sm:text-sm pl-3.5 pr-11 py-2.5 rounded-2xl bg-sunken border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring transition shadow-2xs font-medium"
              />
              <button
                type="submit"
                disabled={!dailyInput.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-accent text-on-accent disabled:opacity-40 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-soft"
                aria-label="Add task"
              >
                <Plus size={16} className="stroke-[2.5]" />
              </button>
            </form>
          )}

          {/* Tasks List */}
          <div className="space-y-2 min-h-[160px]">
            {sortedDailyTasks.length === 0 ? (
              <div className="py-10 text-center rounded-2xl bg-sunken/40 border border-subtle/60 text-muted space-y-1">
                <Sun size={24} className="mx-auto text-faint stroke-[1.5] mb-1.5" />
                <p className="text-xs font-bold text-main">No tasks for this day</p>
                <p className="text-[11px] text-faint">
                  {isViewingPast
                    ? 'No tasks were logged on this date.'
                    : 'Add your primary focus above to start your flow state.'}
                </p>
                {onCopyYesterdayList && selectedDate === today && (
                  <button
                    type="button"
                    onClick={onCopyYesterdayList}
                    className="mt-2 text-xs font-bold text-accent hover:underline cursor-pointer"
                  >
                    Copy yesterday's list
                  </button>
                )}
              </div>
            ) : (
              sortedDailyTasks.map((todo) => {
                const isDraggingThis = draggedTodoId === todo.id;
                const isOverThis = dragOverTodoId === todo.id;
                const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
                const doneSubtasks = hasSubtasks ? todo.subtasks!.filter((s) => s.done).length : 0;

                return (
                  <div key={todo.id} className="relative">
                    {/* Liquid drop slot indicator */}
                    {isOverThis && !isDraggingThis && (
                      <div className="h-1.5 my-1 bg-accent rounded-full animate-pulse transition-all duration-200" />
                    )}

                    <div
                      draggable={!isLocked}
                      onDragStart={(e) => handleDragStart(e, todo.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOverCard(e, todo.id)}
                      onDrop={(e) => handleDropOnCard(e, todo)}
                      className={`group flex items-center justify-between gap-2.5 p-3 rounded-2xl border transition-all duration-200 select-none ${
                        isDraggingThis
                          ? 'opacity-35 scale-95 border-accent'
                          : todo.completed
                          ? 'bg-sunken/50 border-subtle opacity-70'
                          : 'bg-surface border-subtle hover:border-strong shadow-2xs hover:shadow-soft'
                      }`}
                    >
                      {/* Left: Drag grip & 44px Tick Checkbox */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {!isLocked && (
                          <GripVertical
                            size={14}
                            className="text-faint/40 group-hover:text-muted cursor-grab active:cursor-grabbing shrink-0"
                          />
                        )}

                        {/* Prominent 44px Target Tick Square Checkbox */}
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleToggle(todo)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all cursor-pointer ${
                            todo.completed
                              ? 'bg-accent border-accent text-on-accent'
                              : 'border-border-input bg-surface hover:border-accent'
                          }`}
                          aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {todo.completed && <Check size={14} className="stroke-[3.5]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <span
                            onClick={() => !isLocked && handleToggle(todo)}
                            className={`text-xs sm:text-sm font-semibold truncate block cursor-pointer ${
                              todo.completed
                                ? 'line-through text-muted font-normal'
                                : 'text-main'
                            }`}
                          >
                            {todo.text}
                          </span>

                          {/* Chips row: carried badge, tags, subtasks */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {todo.carriedFrom && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-warning-soft text-warning-text border border-warning/20">
                                Carried
                              </span>
                            )}

                            {hasSubtasks && (
                              <span className="text-[10px] text-faint font-mono">
                                [{doneSubtasks}/{todo.subtasks!.length}]
                              </span>
                            )}

                            {todo.tags && todo.tags.map((t) => (
                              <span key={t} className="text-[10px] text-faint">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right action group: Focus Timer & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!todo.completed && !isLocked && (
                          <button
                            type="button"
                            onClick={() => onStartFocusSession(todo)}
                            className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-sunken transition cursor-pointer"
                            title="Start Focus Timer"
                          >
                            <Clock size={13} />
                          </button>
                        )}

                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => onDeleteTodo(todo.id)}
                            className="p-1.5 rounded-lg text-faint hover:text-danger hover:bg-sunken opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Evening Reflection Card (Prompts gently) */}
          <DailyReflectionCard
            selectedDate={selectedDate}
            dayLog={dayLogs[selectedDate]}
            onSaveDayLog={(updates) => onSaveDayLog(selectedDate, updates)}
            completedTasksCount={dailyDone}
          />

          {/* Daily Footer */}
          <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-muted">
            <span>{dailyActive} remaining</span>

            {dailyDone > 0 && onArchiveCompletedDaily && (
              <button
                type="button"
                onClick={() => onArchiveCompletedDaily(selectedDate)}
                className="text-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Archive size={12} />
                <span>Archive completed ({dailyDone})</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: PERMANENT GOALS & DEADLINE TRACKING             */}
        {/* ========================================================= */}
        <div
          className={`bg-surface rounded-3xl p-4 sm:p-5 border border-subtle shadow-soft space-y-4 ${
            mobileTab !== 'goals' ? 'hidden sm:block' : ''
          }`}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                <Target size={18} className="stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-main leading-tight">
                  Master Goals
                </h3>
                <span className="text-[11px] text-muted">
                  {permActive} active · {permDone} completed
                </span>
              </div>
            </div>

            {/* View Switcher: Cards vs Timeline (Gantt) */}
            <div className="flex items-center p-0.5 rounded-xl bg-sunken border border-subtle text-xs">
              <button
                type="button"
                onClick={() => {
                  setGoalsViewMode('cards');
                  playPopSound();
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  goalsViewMode === 'cards'
                    ? 'bg-surface text-main shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoalsViewMode('timeline');
                  playPopSound();
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  goalsViewMode === 'timeline'
                    ? 'bg-surface text-main shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
                }`}
              >
                Timeline
              </button>
            </div>
          </div>

          {/* New Goal Button & Filter Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setGoalsFilter(f);
                    playPopSound();
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize transition cursor-pointer ${
                    goalsFilter === f
                      ? 'bg-accent text-on-accent shadow-2xs'
                      : 'bg-sunken hover:bg-surface border border-subtle text-muted'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenCreateGoal}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>New Goal</span>
            </button>
          </div>

          {/* Goal Content: Timeline (Gantt) View vs Cards Grid */}
          {goalsViewMode === 'timeline' ? (
            <GanttTimelineView
              goals={filteredGoals}
              onSelectGoal={onOpenEditGoal}
            />
          ) : (
            <div className="space-y-3 min-h-[160px]">
              {filteredGoals.length === 0 ? (
                <div className="py-10 text-center rounded-2xl bg-sunken/40 border border-subtle/60 text-muted space-y-1">
                  <Target size={24} className="mx-auto text-faint stroke-[1.5] mb-1.5" />
                  <p className="text-xs font-bold text-main">No goals found</p>
                  <p className="text-[11px] text-faint">
                    Create a master goal above to start deadline tracking.
                  </p>
                </div>
              ) : (
                filteredGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onToggleComplete={handleToggle}
                    onEdit={onOpenEditGoal}
                    onDelete={onDeleteTodo}
                    onToggleSubtask={onToggleSubtask}
                    onOpenExtendModal={onOpenExtendGoal}
                  />
                ))
              )}
            </div>
          )}

          {/* Permanent Goals Footer */}
          <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-muted">
            <span>{permActive} goals in progress</span>

            {permDone > 0 && onArchiveCompletedPermanent && (
              <button
                type="button"
                onClick={onArchiveCompletedPermanent}
                className="text-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Archive size={12} />
                <span>Archive completed ({permDone})</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
