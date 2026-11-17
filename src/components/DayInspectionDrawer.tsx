import React from 'react';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Target, 
  BookOpen, 
  Link2, 
  Clock, 
  Sparkles,
  Smile
} from 'lucide-react';
import type { ActivityEvent, DayLog, TodoItem } from '../types';
import { parseLocalDateKey, formatNavigatorDate, todayKey } from '../utils/dates';
import { playPopSound } from '../utils/delight';

interface DayInspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string | null;
  events: ActivityEvent[];
  dayLog?: DayLog;
  dayTodos: TodoItem[];
  onGoToDay: (dateKey: string) => void;
}

export const DayInspectionDrawer: React.FC<DayInspectionDrawerProps> = ({
  isOpen,
  onClose,
  dateKey,
  events,
  dayLog,
  dayTodos,
  onGoToDay,
}) => {
  if (!isOpen || !dateKey) return null;

  const dateInfo = formatNavigatorDate(dateKey);
  // Exclude deleted tasks or deletion events from Day Activity Log
  const dayEvents = events.filter((e) => {
    if (e.date !== dateKey) return false;
    if (e.type.includes('deleted')) return false;
    if (e.type.startsWith('task_') && e.refId) {
      const taskExists = dayTodos.some((t: TodoItem) => t.id === e.refId);
      if (!taskExists) return false;
    }
    return true;
  });
  const completedTasks = dayTodos.filter((t) => t.completed);
  const unfinishedTasks = dayTodos.filter((t) => !t.completed);

  // Group events by category
  const taskEvents = dayEvents.filter((e) => e.type.startsWith('task_'));
  const goalEvents = dayEvents.filter((e) => e.type.startsWith('goal_'));
  const noteEvents = dayEvents.filter((e) => e.type.startsWith('note_'));
  const linkEvents = dayEvents.filter((e) => e.type.startsWith('link_'));
  const focusEvents = dayEvents.filter((e) => e.type === 'focus_session');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center bg-main/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md max-h-[88vh] bg-surface border-t sm:border border-border-strong rounded-t-3xl sm:rounded-3xl shadow-raised flex flex-col overflow-hidden text-main animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-12 h-1 bg-muted/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <Calendar size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-main leading-tight">
                {dateInfo.title}
              </h2>
              <span className="text-[11px] text-muted">
                {dateInfo.subtitle || dateKey} · {dayEvents.length} activities logged
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
            aria-label="Close day inspection"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable inspection content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Day summary chips */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-sunken border border-subtle">
              <span className="text-[10px] font-bold text-muted uppercase block">Tasks Progress</span>
              <span className="text-lg font-black text-main font-mono">
                {completedTasks.length}/{dayTodos.length}
              </span>
              <span className="text-[10px] text-faint block mt-0.5">
                {dayTodos.length > 0 ? `${Math.round((completedTasks.length / dayTodos.length) * 100)}% completed` : 'No tasks on this day'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-sunken border border-subtle">
              <span className="text-[10px] font-bold text-muted uppercase block">Mood & Reflection</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xl">
                  {dayLog?.mood === 5 ? '🌸' : dayLog?.mood === 4 ? '☀️' : dayLog?.mood === 3 ? '🌿' : dayLog?.mood === 2 ? '⛅' : dayLog?.mood === 1 ? '🌧️' : '—'}
                </span>
                <span className="text-xs font-bold text-main">
                  {dayLog?.mood ? `Mood ${dayLog.mood}/5` : 'No rating'}
                </span>
              </div>
              {dayLog?.reflection && (
                <p className="text-[10px] text-muted line-clamp-1 italic mt-1">"{dayLog.reflection}"</p>
              )}
            </div>
          </div>

          {/* Activity Event Feed on this day */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted block">Day Activity Log</span>

            {dayEvents.length === 0 ? (
              <p className="text-xs text-faint italic p-3 rounded-xl bg-sunken border border-subtle text-center">
                No active events logged for this date.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-sunken border border-subtle text-xs"
                  >
                    <div className="mt-0.5 shrink-0 text-accent">
                      {ev.type.includes('completed') ? (
                        <CheckCircle2 size={13} className="text-success" />
                      ) : ev.type.includes('goal') ? (
                        <Target size={13} />
                      ) : ev.type.includes('note') ? (
                        <BookOpen size={13} />
                      ) : ev.type.includes('link') ? (
                        <Link2 size={13} />
                      ) : (
                        <Sparkles size={13} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-main truncate block">
                        {ev.title}
                      </span>
                      <span className="text-[10px] text-faint">
                        {new Date(ev.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {ev.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with "Go to this day" navigation */}
        <div className="p-4 border-t border-subtle bg-sunken/40 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-surface hover:bg-sunken border border-border-input text-main text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onGoToDay(dateKey);
              playPopSound();
              onClose();
            }}
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Open in Daily To-Do</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
