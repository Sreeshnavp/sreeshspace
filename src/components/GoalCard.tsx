import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Download,
  AlertCircle,
  HelpCircle,
  Tag,
  Sparkles
} from 'lucide-react';
import type { TodoItem, GoalHealthStatus } from '../types';
import { 
  todayKey, 
  diffInDays, 
  formatDeadlineRelative, 
  generateIcsCalendar,
  toLocalDateKey
} from '../utils/dates';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface GoalCardProps {
  goal: TodoItem;
  onToggleComplete: (goal: TodoItem) => void;
  onEdit: (goal: TodoItem) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (goalId: string, subtaskId: string) => void;
  onOpenExtendModal: (goal: TodoItem) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onToggleComplete,
  onEdit,
  onDelete,
  onToggleSubtask,
  onOpenExtendModal,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const today = todayKey();

  // 1. Calculate time elapsed & status
  const { timeElapsedPct, healthStatus, paceHint, finishedNote } = React.useMemo(() => {
    let elapsedPct = 0;
    let status: GoalHealthStatus = 'on_track';
    let pace = '';
    let finishNote = '';

    const start = goal.startDate || goal.date || today;
    const end = goal.endDate;
    const currentProgress = goal.progress || (goal.completed ? 100 : 0);

    if (start && end) {
      const totalSpan = Math.max(1, diffInDays(end, start));
      const elapsedSpan = diffInDays(today, start);
      elapsedPct = Math.max(0, Math.min(100, Math.round((elapsedSpan / totalSpan) * 100)));
    }

    if (goal.completed) {
      if (end && goal.completedAt) {
        const compDate = toLocalDateKey(goal.completedAt);
        const compDiff = diffInDays(end, compDate);
        if (compDiff > 0) {
          status = 'completed';
          finishNote = `Finished ${compDiff} ${compDiff === 1 ? 'day' : 'days'} early 🌟`;
        } else if (compDiff < 0) {
          status = 'late';
          finishNote = `Finished ${Math.abs(compDiff)} ${Math.abs(compDiff) === 1 ? 'day' : 'days'} late`;
        } else {
          status = 'completed';
          finishNote = 'Finished right on target! ✨';
        }
      } else {
        status = 'completed';
        finishNote = 'Goal completed 🎉';
      }
    } else if (end) {
      const daysLeft = diffInDays(end, today);
      if (daysLeft < 0) {
        status = 'overdue';
      } else if (daysLeft <= 3) {
        status = 'due_soon';
      } else if (currentProgress < elapsedPct - 10) {
        status = 'at_risk';
      } else {
        status = 'on_track';
      }

      // Compute pace hint
      if (daysLeft > 0) {
        const weeksLeft = Math.max(1, Math.round(daysLeft / 7));
        if (goal.progressMode === 'checklist' && goal.subtasks && goal.subtasks.length > 0) {
          const unfinished = goal.subtasks.filter((s) => !s.done).length;
          const rate = Math.ceil(unfinished / weeksLeft);
          pace = rate === 1 ? '~1 subtask / week' : `~${rate} subtasks / week`;
        } else {
          const remain = 100 - currentProgress;
          const ratePct = Math.ceil(remain / weeksLeft);
          pace = `~${ratePct}% progress / week`;
        }
      }
    }

    return {
      timeElapsedPct: elapsedPct,
      healthStatus: status,
      paceHint: pace,
      finishedNote: finishNote,
    };
  }, [goal, today]);

  // 2. Render status badge with Icon + Label + Color Token
  const renderStatusBadge = () => {
    switch (healthStatus) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-soft text-success text-[10px] font-bold border border-success/20">
            <CheckCircle2 size={11} className="stroke-[2.5]" />
            <span>Completed</span>
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-soft text-warning-text text-[10px] font-bold border border-warning/20">
            <Clock size={11} className="stroke-[2.5]" />
            <span>Completed Late</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-soft text-danger-text text-[10px] font-bold border border-danger/20">
            <AlertCircle size={11} className="stroke-[2.5]" />
            <span>Overdue</span>
          </span>
        );
      case 'due_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-soft text-warning-text text-[10px] font-bold border border-warning/20">
            <Clock size={11} className="stroke-[2.5]" />
            <span>Due Soon</span>
          </span>
        );
      case 'at_risk':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-soft text-warning-text text-[10px] font-bold border border-warning/20">
            <AlertTriangle size={11} className="stroke-[2.5]" />
            <span>At Risk</span>
          </span>
        );
      case 'on_track':
        if (!goal.endDate) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunken text-muted text-[10px] font-bold border border-subtle">
              <span>Ongoing</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-soft text-accent-text text-[10px] font-bold border border-accent/20">
            <Sparkles size={11} className="stroke-[2.5]" />
            <span>On Track</span>
          </span>
        );
    }
  };

  const deadlineRel = formatDeadlineRelative(goal.endDate);

  const subtasks = goal.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.done).length;
  const progressVal = goal.progress || (goal.completed ? 100 : 0);

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 select-none shadow-2xs hover:shadow-soft text-main ${
        goal.completed
          ? 'bg-sunken/60 border-subtle opacity-75'
          : healthStatus === 'overdue'
          ? 'bg-surface border-danger/40'
          : 'bg-surface border-subtle hover:border-strong'
      }`}
    >
      {/* 1. Header Row: Tick Square + Title + Status */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Prominent 44px touch target tick checkbox */}
          <button
            type="button"
            onClick={() => onToggleComplete(goal)}
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 mt-0.5 transition-all cursor-pointer ${
              goal.completed
                ? 'bg-accent border-accent text-on-accent'
                : 'border-border-input bg-surface hover:border-accent'
            }`}
            aria-label={goal.completed ? 'Mark goal active' : 'Mark goal complete'}
          >
            {goal.completed && <Check size={14} className="stroke-[3.5]" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                onClick={() => onEdit(goal)}
                className={`text-xs sm:text-sm font-bold truncate cursor-pointer hover:underline ${
                  goal.completed ? 'line-through text-muted' : 'text-main'
                }`}
              >
                {goal.text}
              </h3>
              {renderStatusBadge()}
            </div>

            {/* Notes preview or Finished early note */}
            {finishedNote ? (
              <p className="text-[11px] font-semibold text-accent mt-0.5">
                {finishedNote}
              </p>
            ) : goal.notes ? (
              <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                {goal.notes}
              </p>
            ) : null}
          </div>
        </div>

        {/* Priority pill */}
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${
            goal.priority === 'high'
              ? 'bg-danger-soft text-danger-text'
              : goal.priority === 'medium'
              ? 'bg-warning-soft text-warning-text'
              : 'bg-sunken text-muted'
          }`}
        >
          {goal.priority}
        </span>
      </div>

      {/* 2. Dual Progress Bar with Thin Time-Elapsed Marker */}
      <div className="space-y-1 mb-2.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
          <span>Progress: <strong className="font-mono text-main">{progressVal}%</strong></span>
          {goal.endDate ? (
            <span className={deadlineRel.isOverdue ? 'text-danger font-bold' : ''}>
              {deadlineRel.text}
            </span>
          ) : (
            <span>No deadline</span>
          )}
        </div>

        <div className="relative w-full h-2 rounded-full bg-sunken overflow-hidden">
          {/* Work Done fill */}
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              goal.completed ? 'bg-success' : 'bg-accent'
            }`}
            style={{ width: `${progressVal}%` }}
          />

          {/* Thin Time-Elapsed marker (if ongoing with deadline) */}
          {goal.endDate && !goal.completed && timeElapsedPct > 0 && timeElapsedPct < 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-main shadow-xs"
              style={{ left: `${timeElapsedPct}%` }}
              title={`Time elapsed: ${timeElapsedPct}%`}
            />
          )}
        </div>

        {/* Pace hint & timeline indicator */}
        {paceHint && !goal.completed && (
          <div className="flex items-center justify-between text-[10px] text-faint pt-0.5">
            <span>Required pace: <strong className="text-muted">{paceHint}</strong></span>
            {timeElapsedPct > 0 && <span>Time elapsed: {timeElapsedPct}%</span>}
          </div>
        )}
      </div>

      {/* 3. Subtasks toggle & extensions summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-subtle text-xs">
        <div className="flex items-center gap-2">
          {subtasks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setShowSubtasks(!showSubtasks);
                playPopSound();
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-accent hover:underline cursor-pointer"
            >
              <span>{completedSubtasks}/{subtasks.length} Milestones</span>
              {showSubtasks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          {goal.extensions && goal.extensions.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenExtendModal(goal)}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sunken hover:bg-surface border border-subtle text-muted transition cursor-pointer"
            >
              Extended {goal.extensions.length}x
            </button>
          )}

          {goal.tags && goal.tags.map((t) => (
            <span key={t} className="text-[10px] text-faint">
              #{t}
            </span>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {goal.endDate && !goal.completed && (
            <button
              type="button"
              onClick={() => onOpenExtendModal(goal)}
              className="p-1.5 text-muted hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
              title="Extend deadline"
            >
              <Calendar size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="p-1.5 text-muted hover:text-main rounded-lg hover:bg-sunken transition cursor-pointer"
            title="Edit goal"
          >
            <Edit3 size={13} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            className="p-1.5 text-muted hover:text-danger rounded-lg hover:bg-sunken transition cursor-pointer"
            title="Archive or delete goal"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 4. Expanded Subtasks Checklist */}
      {showSubtasks && subtasks.length > 0 && (
        <div className="mt-3 pt-2 border-t border-subtle space-y-1.5">
          {subtasks.map((st) => (
            <div
              key={st.id}
              onClick={() => onToggleSubtask(goal.id, st.id)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-sunken transition cursor-pointer select-none text-xs"
            >
              <div
                className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border transition ${
                  st.done
                    ? 'bg-accent border-accent text-on-accent'
                    : 'border-border-input bg-surface'
                }`}
              >
                {st.done && <Check size={10} className="stroke-[3]" />}
              </div>
              <span className={`truncate ${st.done ? 'line-through text-faint' : 'text-main'}`}>
                {st.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
