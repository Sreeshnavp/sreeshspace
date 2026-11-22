import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Trophy,
  Calendar
} from 'lucide-react';
import type { TodoItem } from '../types';
import { todayKey, addDays, startOfWeek } from '../utils/dates';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  todos: TodoItem[];
  onAddNextWeekPriorities: (priorities: string[], mondayDateKey: string) => void;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  todos,
  onAddNextWeekPriorities,
}) => {
  const today = todayKey();
  const currentWeekStart = startOfWeek(today);

  // Compute what got done this week
  const thisWeekTasks = todos.filter(
    (t) => (t.type || 'permanent') === 'daily' && t.date && t.date >= currentWeekStart
  );
  const doneThisWeek = thisWeekTasks.filter((t) => t.completed);
  const slippedTasks = thisWeekTasks.filter((t) => !t.completed);

  // Goals needing attention (at_risk or overdue)
  const goalsNeedingAttention = todos.filter(
    (t) =>
      (t.type || 'permanent') === 'permanent' &&
      !t.completed &&
      t.endDate &&
      (t.endDate < today || (t.progress || 0) < 50)
  );

  const [winOfTheWeek, setWinOfTheWeek] = useState('');
  const [priority1, setPriority1] = useState('');
  const [priority2, setPriority2] = useState('');
  const [priority3, setPriority3] = useState('');

  if (!isOpen) return null;

  // Next Monday's date key
  const nextMonday = addDays(currentWeekStart, 7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priorities = [priority1.trim(), priority2.trim(), priority3.trim()].filter(Boolean);
    if (priorities.length > 0) {
      onAddNextWeekPriorities(priorities, nextMonday);
    }
    triggerPartyPop('grand');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-main/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl max-h-[92vh] bg-surface border-t sm:border border-border-strong rounded-t-3xl sm:rounded-3xl shadow-raised flex flex-col overflow-hidden text-main animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-12 h-1 bg-muted/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <Trophy size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-main leading-tight">
                Weekly Reflection & Review
              </h2>
              <span className="text-[11px] text-muted">
                Celebrate wins, reflect on slips, and align top priorities for next week
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form id="weekly-review-form" onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Wins & Slips Summary Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-success-soft/40 border border-success/30">
              <div className="flex items-center gap-1.5 text-success text-xs font-bold mb-1">
                <CheckCircle2 size={14} />
                <span>What Got Done ({doneThisWeek.length})</span>
              </div>
              <ul className="text-[11px] text-muted space-y-1 list-disc pl-3 max-h-24 overflow-y-auto">
                {doneThisWeek.length === 0 ? (
                  <li className="italic text-faint">No tasks completed this week yet.</li>
                ) : (
                  doneThisWeek.slice(0, 4).map((t) => <li key={t.id} className="truncate">{t.text}</li>)
                )}
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl bg-warning-soft/40 border border-warning/30">
              <div className="flex items-center gap-1.5 text-warning-text text-xs font-bold mb-1">
                <AlertTriangle size={14} />
                <span>What Slipped ({slippedTasks.length})</span>
              </div>
              <ul className="text-[11px] text-muted space-y-1 list-disc pl-3 max-h-24 overflow-y-auto">
                {slippedTasks.length === 0 ? (
                  <li className="italic text-faint">Nothing slipped — 100% on track!</li>
                ) : (
                  slippedTasks.slice(0, 4).map((t) => <li key={t.id} className="truncate">{t.text}</li>)
                )}
              </ul>
            </div>
          </div>

          {/* 2. Win of the Week */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1">
              🏆 Win of the Week
            </label>
            <input
              type="text"
              value={winOfTheWeek}
              onChange={(e) => setWinOfTheWeek(e.target.value)}
              placeholder="e.g. Deployed Orbit PWA and kept a 7-day flow state!"
              className="w-full text-xs p-2.5 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring font-medium"
            />
          </div>

          {/* 3. Goals Needing Attention */}
          {goalsNeedingAttention.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-sunken border border-subtle space-y-1.5">
              <span className="text-xs font-bold text-main block">
                🎯 Goals Needing Attention ({goalsNeedingAttention.length})
              </span>
              <div className="space-y-1">
                {goalsNeedingAttention.map((g) => (
                  <div key={g.id} className="text-[11px] text-muted flex items-center justify-between">
                    <span className="truncate flex-1">{g.text}</span>
                    <span className="text-[10px] font-mono text-warning-text shrink-0 ml-2">
                      {g.endDate ? `Due ${g.endDate}` : 'Behind pace'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Next Week's Top 3 Priorities (Pre-fill Monday) */}
          <div className="p-3.5 rounded-2xl bg-accent-soft/30 border border-accent/30 space-y-2">
            <div>
              <h4 className="text-xs font-bold text-main leading-tight">
                Next Week's Top 3 Priorities
              </h4>
              <p className="text-[10px] text-muted">
                These will automatically pre-fill your Daily Focus list for next Monday ({nextMonday}).
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={priority1}
                onChange={(e) => setPriority1(e.target.value)}
                placeholder="Priority 1: Key master milestone..."
                className="w-full text-xs p-2 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                value={priority2}
                onChange={(e) => setPriority2(e.target.value)}
                placeholder="Priority 2: Important habit or deliverable..."
                className="w-full text-xs p-2 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                value={priority3}
                onChange={(e) => setPriority3(e.target.value)}
                placeholder="Priority 3: Weekly polish or study block..."
                className="w-full text-xs p-2 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-subtle bg-sunken/40 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-surface hover:bg-sunken border border-border-input text-main text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="weekly-review-form"
            className="flex-1 min-h-[44px] px-5 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} className="stroke-[2.5]" />
            <span>Finish Review & Pre-fill Monday</span>
          </button>
        </div>
      </div>
    </div>
  );
};
