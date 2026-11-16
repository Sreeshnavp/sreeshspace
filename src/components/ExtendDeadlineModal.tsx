import React, { useState } from 'react';
import { Calendar, Check, X, Clock } from 'lucide-react';
import type { TodoItem, GoalExtension } from '../types';
import { todayKey, addDays } from '../utils/dates';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface ExtendDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: TodoItem | null;
  onExtend: (goalId: string, newEndDate: string, reason?: string) => void;
}

export const ExtendDeadlineModal: React.FC<ExtendDeadlineModalProps> = ({
  isOpen,
  onClose,
  goal,
  onExtend,
}) => {
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (goal) {
      setNewDate(goal.endDate ? addDays(goal.endDate, 14) : addDays(todayKey(), 14));
      setReason('');
    }
  }, [goal, isOpen]);

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    onExtend(goal.id, newDate, reason.trim() || undefined);
    triggerPartyPop('single');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-main/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-surface border-t sm:border border-border-strong rounded-t-3xl sm:rounded-3xl shadow-raised flex flex-col overflow-hidden text-main animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-12 h-1 bg-muted/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        <div className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-warning-soft text-warning-text flex items-center justify-center shrink-0">
              <Clock size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-main leading-tight">
                Extend Target Deadline
              </h2>
              <span className="text-[11px] text-muted">
                Adjust timeline thoughtfully while preserving history
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          <div>
            <span className="text-xs font-bold text-muted block mb-1">Goal</span>
            <p className="text-sm font-extrabold text-main truncate">{goal.text}</p>
            {goal.endDate && (
              <span className="text-[11px] text-faint block mt-0.5">
                Current deadline: {goal.endDate}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1">
              New Target Date <span className="text-accent">*</span>
            </label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-surface border border-border-input text-main focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1">
              Reason / Learning (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Scope expanded, focused on deep understanding"
              className="w-full text-xs p-2.5 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Quick Extension chips */}
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-[10px] font-bold text-faint uppercase">Add:</span>
            <button
              type="button"
              onClick={() => setNewDate(addDays(goal.endDate || todayKey(), 7))}
              className="px-2 py-0.5 rounded-lg bg-sunken hover:bg-surface border border-subtle text-[11px] font-semibold text-muted"
            >
              +1 Week
            </button>
            <button
              type="button"
              onClick={() => setNewDate(addDays(goal.endDate || todayKey(), 14))}
              className="px-2 py-0.5 rounded-lg bg-sunken hover:bg-surface border border-subtle text-[11px] font-semibold text-muted"
            >
              +2 Weeks
            </button>
            <button
              type="button"
              onClick={() => setNewDate(addDays(goal.endDate || todayKey(), 30))}
              className="px-2 py-0.5 rounded-lg bg-sunken hover:bg-surface border border-subtle text-[11px] font-semibold text-muted"
            >
              +1 Month
            </button>
          </div>

          <div className="pt-3 border-t border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-surface hover:bg-sunken border border-border-input text-main text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} className="stroke-[2.5]" />
              <span>Confirm Extension</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
