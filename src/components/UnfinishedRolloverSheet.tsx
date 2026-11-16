import React, { useState } from 'react';
import { 
  ArrowRight, 
  Check, 
  X, 
  AlertCircle, 
  RotateCcw, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import type { TodoItem } from '../types';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface UnfinishedRolloverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  yesterdayTasks: TodoItem[];
  yesterdayDateStr: string; // e.g. "Sun 15 Nov"
  onCarryOver: (taskIdsToCarry: string[]) => void;
  onLeaveBehind: () => void;
}

export const UnfinishedRolloverSheet: React.FC<UnfinishedRolloverSheetProps> = ({
  isOpen,
  onClose,
  yesterdayTasks,
  yesterdayDateStr,
  onCarryOver,
  onLeaveBehind,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(yesterdayTasks.map((t) => t.id))
  );

  if (!isOpen || yesterdayTasks.length === 0) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    playPopSound();
  };

  const handleCarryAll = () => {
    onCarryOver(yesterdayTasks.map((t) => t.id));
    triggerPartyPop('single');
    onClose();
  };

  const handleCarrySelected = () => {
    onCarryOver(Array.from(selectedIds));
    triggerPartyPop('single');
    onClose();
  };

  const handleLeaveAllBehind = () => {
    onLeaveBehind();
    playPopSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-main/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md max-h-[88vh] bg-surface border-t sm:border border-border-strong rounded-t-3xl sm:rounded-3xl shadow-raised flex flex-col overflow-hidden text-main animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-muted/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <RotateCcw size={17} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-main leading-tight">
                Yesterday's Unfinished Tasks
              </h2>
              <span className="text-[11px] text-muted">
                From {yesterdayDateStr} ({yesterdayTasks.length} pending)
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

        {/* Content list with checkboxes */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          <p className="text-xs text-muted mb-2">
            Start today with a fresh, clean slate or carry unfinished tasks forward to keep momentum:
          </p>

          {yesterdayTasks.map((t) => {
            const isSelected = selectedIds.has(t.id);
            const carryCount = (t.carryCount || 0) + 1;
            const isRepeated = carryCount >= 3;

            return (
              <div
                key={t.id}
                onClick={() => toggleSelect(t.id)}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-accent-soft/40 border-accent/40 shadow-2xs'
                    : 'bg-sunken/50 border-subtle opacity-70'
                }`}
              >
                {/* 44px Touch-Target Checkbox */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 mt-0.5 transition ${
                    isSelected
                      ? 'bg-accent border-accent text-on-accent'
                      : 'border-border-input bg-surface'
                  }`}
                >
                  {isSelected && <Check size={14} className="stroke-[3.5]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-semibold text-main block truncate">
                    {t.text}
                  </span>

                  {isRepeated && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-warning-text mt-1">
                      <HelpCircle size={11} />
                      <span>Carried {carryCount} times · consider breaking it down</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons (Thumb-friendly on mobile) */}
        <div className="p-4 border-t border-subtle bg-sunken/40 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCarryAll}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowRight size={14} />
              <span>Carry All to Today ({yesterdayTasks.length})</span>
            </button>

            {selectedIds.size > 0 && selectedIds.size < yesterdayTasks.length && (
              <button
                type="button"
                onClick={handleCarrySelected}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-surface hover:bg-sunken border border-border-input text-main text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              >
                Carry ({selectedIds.size})
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleLeaveAllBehind}
            className="w-full min-h-[38px] py-1.5 text-xs text-muted hover:text-main font-semibold text-center transition cursor-pointer"
          >
            Leave behind in yesterday's archive
          </button>
        </div>

      </div>
    </div>
  );
};
