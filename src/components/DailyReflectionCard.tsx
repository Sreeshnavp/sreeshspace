import React, { useState, useEffect } from 'react';
import { Sparkles, Smile, Check, MessageSquare } from 'lucide-react';
import type { DayLog, MoodScore } from '../types';
import { playPopSound } from '../utils/delight';

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
  const [isSaved, setIsSaved] = useState(false);

  // Sync state when day changes
  useEffect(() => {
    setReflection(dayLog?.reflection || '');
    setSelectedMood(dayLog?.mood);
    setIsSaved(false);
  }, [selectedDate, dayLog]);

  const handleMoodSelect = (mood: MoodScore) => {
    setSelectedMood(mood);
    onSaveDayLog({ mood });
    playPopSound();
  };

  const handleSaveReflection = () => {
    onSaveDayLog({ reflection: reflection.trim() });
    setIsSaved(true);
    playPopSound();
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-4 rounded-2xl bg-sunken border border-subtle text-main space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-surface text-accent flex items-center justify-center shrink-0 border border-subtle">
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

        {/* Saved confirmation indicator */}
        {isSaved && (
          <span className="text-[11px] font-bold text-success flex items-center gap-1 animate-in fade-in">
            <Check size={12} className="stroke-[3]" />
            <span>Saved</span>
          </span>
        )}
      </div>

      {/* 5-Mood Rating Row */}
      <div className="flex items-center justify-between gap-1.5 pt-1">
        {MOODS.map((m) => {
          const isSelected = selectedMood === m.score;
          return (
            <button
              key={m.score}
              type="button"
              onClick={() => handleMoodSelect(m.score)}
              className={`flex-1 min-h-[44px] flex flex-col items-center justify-center rounded-xl transition active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-surface border-2 border-accent shadow-soft text-main font-bold'
                  : 'bg-surface/50 hover:bg-surface border border-subtle text-muted'
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
      <div className="space-y-2 pt-1">
        <textarea
          rows={2}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="One win, insight, or peaceful thought from today..."
          className="w-full text-xs p-2.5 rounded-xl bg-surface border border-border-input text-main placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-ring resize-none transition"
        />

        {reflection !== (dayLog?.reflection || '') && (
          <button
            type="button"
            onClick={handleSaveReflection}
            className="w-full min-h-[36px] py-1.5 px-3 rounded-xl bg-accent hover:bg-accent-hover text-on-accent text-xs font-bold shadow-soft transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check size={13} className="stroke-[2.5]" />
            <span>Save Reflection</span>
          </button>
        )}
      </div>
    </div>
  );
};
