import React, { useMemo } from 'react';
import { Target, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { TodoItem } from '../types';
import { todayKey, diffInDays, parseLocalDateKey, addDays } from '../utils/dates';

interface GanttTimelineViewProps {
  goals: TodoItem[];
  onSelectGoal: (goal: TodoItem) => void;
}

export const GanttTimelineView: React.FC<GanttTimelineViewProps> = ({
  goals,
  onSelectGoal,
}) => {
  const today = todayKey();

  // Filter goals that have start and/or end dates
  const timelineGoals = useMemo(() => {
    return goals.filter((g) => (g.type || 'permanent') === 'permanent');
  }, [goals]);

  // Determine span: min start date and max end date
  const { minDate, maxDate, totalDays, datesHeader } = useMemo(() => {
    let minD = today;
    let maxD = addDays(today, 30);

    timelineGoals.forEach((g) => {
      const s = g.startDate || g.date || today;
      if (s < minD) minD = s;
      const e = g.endDate || addDays(s, 14);
      if (e > maxD) maxD = e;
    });

    // Pad by 3 days on each side
    minD = addDays(minD, -2);
    maxD = addDays(maxD, 5);

    const span = Math.max(14, diffInDays(maxD, minD));
    const step = Math.max(1, Math.round(span / 8));

    const headers: { key: string; label: string; offsetPct: number }[] = [];
    let cur = minD;
    while (cur <= maxD) {
      const offset = diffInDays(cur, minD);
      const pct = (offset / span) * 100;
      const d = parseLocalDateKey(cur);
      headers.push({
        key: cur,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        offsetPct: pct,
      });
      cur = addDays(cur, step);
    }

    return {
      minDate: minD,
      maxDate: maxD,
      totalDays: span,
      datesHeader: headers,
    };
  }, [timelineGoals, today]);

  // Today line percentage
  const todayOffsetPct = useMemo(() => {
    const offset = diffInDays(today, minDate);
    return Math.max(0, Math.min(100, (offset / totalDays) * 100));
  }, [today, minDate, totalDays]);

  if (timelineGoals.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl bg-sunken border border-subtle text-muted text-xs">
        <Target size={24} className="mx-auto mb-2 text-faint stroke-[1.5]" />
        <p className="font-bold">No active master goals yet</p>
        <p className="text-[11px] text-faint mt-0.5">Create a master goal with a target deadline to visualize it on this timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs px-1 font-bold text-muted">
        <span>Master Goals Timeline (Gantt)</span>
        <span className="text-[11px] text-faint">Scroll horizontally on mobile</span>
      </div>

      {/* Mobile-scrollable container with 320px support */}
      <div className="overflow-x-auto rounded-2xl bg-surface border border-subtle shadow-2xs p-3 scrollbar-none">
        <div className="min-w-[540px] space-y-3 relative">
          
          {/* Header Dates Marker */}
          <div className="relative h-6 border-b border-subtle text-[10px] font-bold text-faint select-none">
            {datesHeader.map((h) => (
              <span
                key={h.key}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${h.offsetPct}%` }}
              >
                {h.label}
              </span>
            ))}
          </div>

          {/* Today vertical line */}
          <div
            className="absolute top-6 bottom-0 w-0.5 bg-accent z-20 pointer-events-none shadow-xs"
            style={{ left: `${todayOffsetPct}%` }}
          >
            <span className="absolute -top-5 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-accent text-on-accent text-[8px] font-black uppercase tracking-wider">
              Today
            </span>
          </div>

          {/* Goal rows */}
          <div className="space-y-2.5 pt-2">
            {timelineGoals.map((g) => {
              const start = g.startDate || g.date || today;
              const end = g.endDate || addDays(start, 14);
              const isOverdue = !g.completed && g.endDate && g.endDate < today;
              const startOffset = Math.max(0, diffInDays(start, minDate));
              const goalSpan = Math.max(2, diffInDays(end, start));
              const leftPct = (startOffset / totalDays) * 100;
              const widthPct = Math.min(100 - leftPct, Math.max(4, (goalSpan / totalDays) * 100));
              const progressVal = g.progress || (g.completed ? 100 : 0);

              return (
                <div
                  key={g.id}
                  onClick={() => onSelectGoal(g)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  {/* Left Label */}
                  <div className="w-28 shrink-0 truncate text-xs font-bold text-main group-hover:underline">
                    {g.text}
                  </div>

                  {/* Horizontal Track & Bar */}
                  <div className="flex-1 h-7 rounded-xl bg-sunken/60 relative overflow-hidden border border-subtle/60">
                    <div
                      className={`absolute top-1 bottom-1 rounded-lg border transition-all duration-300 flex items-center justify-between px-2 text-[10px] font-bold shadow-2xs ${
                        g.completed
                          ? 'bg-success/20 border-success text-success'
                          : isOverdue
                          ? 'bg-danger/20 border-danger text-danger'
                          : 'bg-accent/20 border-accent text-accent-text'
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                    >
                      {/* Inner filled progress bar */}
                      <div
                        className={`absolute top-0 bottom-0 left-0 rounded-l-md opacity-25 ${
                          g.completed ? 'bg-success' : isOverdue ? 'bg-danger' : 'bg-accent'
                        }`}
                        style={{ width: `${progressVal}%` }}
                      />

                      <span className="relative truncate z-10">{progressVal}%</span>
                      {g.endDate && (
                        <span className="relative hidden sm:inline text-[9px] opacity-80 z-10">
                          {diffInDays(g.endDate, today)}d
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
