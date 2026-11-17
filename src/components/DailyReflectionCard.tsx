import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Pencil, X, Quote } from 'lucide-react';
import type { DayLog, MoodScore } from '../types';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface DailyReflectionCardProps {
  selectedDate: string;
  dayLog?: DayLog;
  onSaveDayLog: (updates: Partial<DayLog>) => void;
  completedTasksCount: number;
}

const MOODS: { score: MoodScore; emoji: string; label: string }[] = [
  { score: 1, emoji: '🌧️', label: 'Rough' },
  { score: 2, emoji: '⛅', label: 'Low' },
  { score: 3, emoji: '🌿', label: 'Steady' },
  { score: 4, emoji: '☀️', label: 'Good' },
  { score: 5, emoji: '🌸', label: 'Thriving' },
];

export const DailyReflectionCard: React.FC<DailyReflectionCardProps> = ({
  selectedDate,
  dayLog,
  onSaveDayLog,
  completedTasksCount,
}) => {
  const [reflection, setReflection] = useState(dayLog?.reflection || '');
  const [selectedMood, setSelectedMood] = useState<MoodScore | undefined>(dayLog?.mood);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sync state when day changes
  useEffect(() => {
    setReflection(dayLog?.reflection || '');
    setSelectedMood(dayLog?.mood);
    setIsEditing(false);
    setIsSaved(false);
  }, [selectedDate, dayLog?.reflection, dayLog?.mood]);

  const hasSavedContent = Boolean(dayLog?.mood || dayLog?.reflection?.trim());
  const activeMoodObj = MOODS.find((m) => m.score === (selectedMood || dayLog?.mood));

  const handleMoodSelect = (mood: MoodScore) => {
    setSelectedMood(mood);
    playPopSound();
  };

  const handleSave = () => {
    const trimmed = reflection.trim();
    onSaveDayLog({
      mood: selectedMood,
      reflection: trimmed,
    });
    setIsSaved(true);
    setIsEditing(false);
    playPopSound();
    triggerPartyPop('single');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCancel = () => {
    setReflection(dayLog?.reflection || '');
    setSelectedMood(dayLog?.mood);
    setIsEditing(false);
  };

  // DISPLAY MODE: "only see mood and lines" - clean, beautiful, distraction-free
  if (hasSavedContent && !isEditing) {
    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="group relative p-3.5 sm:p-4 rounded-2xl bg-surface hover:bg-surface/90 border border-subtle transition-all cursor-pointer shadow-soft hover:shadow-raised hover:border-accent/40"
        title="Click to edit reflection and mood"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            {/* Mood Pill / Line */}
            {activeMoodObj && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent-soft border border-accent/20 text-accent-text text-xs font-bold shadow-2xs">
                <span className="text-sm select-none">{activeMoodObj.emoji}</span>
                <span>{activeMoodObj.label}</span>
              </div>
            )}

            {/* Reflection Lines */}
            {dayLog?.reflection ? (
              <div className="text-xs sm:text-sm text-main font-medium leading-relaxed whitespace-pre-line pl-0.5">
                {dayLog.reflection}
              </div>
            ) : (
              <div className="text-xs text-faint italic pl-0.5">
                No reflection written. Click to add your thoughts...
              </div>
            )}
          </div>

          {/* Edit Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sunken hover:bg-surface border border-subtle text-muted hover:text-main text-[11px] font-semibold transition active:scale-95 cursor-pointer shrink-0"
            aria-label="Edit reflection"
          >
            <Pencil size={12} className="stroke-[2.2]" />
            <span>Edit</span>
          </button>
        </div>

        {/* Saved Toast Indicator */}
        {isSaved && (
          <div className="absolute top-2.5 right-14 text-[11px] font-bold text-success flex items-center gap-1 animate-in fade-in">
            <Check size={12} className="stroke-[3]" />
            <span>Saved</span>
          </div>
        )}
      </div>
    );
  }

  // EDIT / INPUT MODE
  return (
    <div className="p-4 rounded-2xl bg-sunken border border-subtle text-main space-y-3.5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-surface text-accent flex items-center justify-center shrink-0 border border-subtle shadow-2xs">
            <Sparkles size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-main leading-tight">
              Daily Reflection & Mood
            </h4>
            <span className="text-[10px] text-faint">
              {completedTasksCount > 0 ? `${completedTasksCount} tasks checked off today` : 'Capture your thoughts'}
            </span>
          </div>
        </div>

        {hasSavedContent && (
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 rounded-xl text-faint hover:text-main hover:bg-surface transition cursor-pointer"
            title="Cancel editing"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* 5-Mood Rating Row */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        {MOODS.map((m) => {
          const isSelected = selectedMood === m.score;
          return (
            <button
              key={m.score}
              type="button"
              onClick={() => handleMoodSelect(m.score)}
              className={`flex-1 min-h-[44px] flex flex-col items-center justify-center rounded-xl transition active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-surface border-2 border-accent shadow-soft text-main font-bold ring-2 ring-accent/20'
                  : 'bg-surface/60 hover:bg-surface border border-subtle text-muted'
              }`}
              title={m.label}
              aria-label={`Rate mood ${m.label}`}
            >
              <span className="text-base select-none">{m.emoji}</span>
              <span className="text-[9px] font-semibold mt-0.5">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reflection Note Input */}
      <div className="space-y-2.5">
        <textarea
          rows={3}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="One win, insight, or peaceful thought from today..."
          className="w-full text-xs sm:text-sm p-3 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring resize-none transition shadow-2xs"
          autoFocus={hasSavedContent}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[38px] py-2 px-3.5 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check size={14} className="stroke-[2.5]" />
            <span>Save Reflection</span>
          </button>

          {hasSavedContent && (
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-[38px] py-2 px-3 rounded-xl bg-surface hover:bg-sunken border border-subtle text-muted hover:text-main text-xs font-semibold transition active:scale-98 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
