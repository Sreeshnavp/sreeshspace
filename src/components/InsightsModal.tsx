import React, { useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  ShieldAlert,
  Snowflake,
  BarChart2
} from 'lucide-react';
import type { ActivityEvent, DayLog, TodoItem, StreakState } from '../types';
import { todayKey, addDays, startOfWeek } from '../utils/dates';
import { playPopSound, triggerPartyPop } from '../utils/delight';

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ActivityEvent[];
  todos: TodoItem[];
  dayLogs: Record<string, DayLog>;
  streakState: StreakState;
  onApplyFreeze: (dateKey: string) => void;
}

export const InsightsModal: React.FC<InsightsModalProps> = ({
  isOpen,
  onClose,
  events,
  todos,
  dayLogs,
  streakState,
  onApplyFreeze,
}) => {
  const today = todayKey();

  // Compute insights
  const metrics = useMemo(() => {
    // 1. Completion by week (last 6 weeks)
    const weeksData: { weekStart: string; completed: number; total: number }[] = [];
    for (let w = 5; w >= 0; w--) {
      const wDate = addDays(today, -w * 7);
      const wStart = startOfWeek(wDate);
      const wEnd = addDays(wStart, 6);

      const weekTasks = todos.filter(
        (t) => (t.type || 'permanent') === 'daily' && t.date && t.date >= wStart && t.date <= wEnd
      );
      const done = weekTasks.filter((t) => t.completed).length;
      weeksData.push({
        weekStart: wStart.slice(5), // MM-DD
        completed: done,
        total: Math.max(done, weekTasks.length),
      });
    }

    // 2. Best weekday from completed events
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun..Sat
    const hourCounts = new Array(24).fill(0);

    events.forEach((ev) => {
      if (['task_completed', 'goal_completed'].includes(ev.type)) {
        const d = new Date(ev.ts);
        weekdayCounts[d.getDay()]++;
        hourCounts[d.getHours()]++;
      }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDayIdx = 1; // default Mon
    let maxDayCount = 0;
    weekdayCounts.forEach((c, idx) => {
      if (c > maxDayCount) {
        maxDayCount = c;
        bestDayIdx = idx;
      }
    });

    // 3. Peak productive hour
    let peakHour = 10;
    let maxHourCount = 0;
    hourCounts.forEach((c, h) => {
      if (c > maxHourCount) {
        maxHourCount = c;
        peakHour = h;
      }
    });

    const peakHourStr = `${peakHour % 12 || 12} ${peakHour >= 12 ? 'PM' : 'AM'}`;

    // 4. Goals on time vs late
    const completedGoals = todos.filter((t) => (t.type || 'permanent') === 'permanent' && t.completed);
    let onTimeGoals = 0;
    let lateGoals = 0;
    completedGoals.forEach((g) => {
      if (g.endDate && g.completedAt) {
        if (g.completedAt.slice(0, 10) > g.endDate) lateGoals++;
        else onTimeGoals++;
      } else {
        onTimeGoals++;
      }
    });

    // 5. Carried tasks count
    const carriedTasks = todos.filter((t) => (t.carryCount || 0) > 0);

    // 6. Mood correlation
    const logsWithMood = Object.values(dayLogs).filter((l) => typeof l.mood === 'number');
    let highMoodAvgDone = 0;
    const happyLogs = logsWithMood.filter((l) => l.mood && l.mood >= 4);
    if (happyLogs.length > 0) {
      highMoodAvgDone = Math.round(
        happyLogs.reduce((acc, l) => acc + l.completed, 0) / happyLogs.length
      );
    }

    return {
      weeksData,
      bestWeekday: dayNames[bestDayIdx],
      peakHourStr,
      onTimeGoals,
      lateGoals,
      carriedCount: carriedTasks.length,
      highMoodAvgDone,
    };
  }, [todos, events, dayLogs, today]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-main/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-xl max-h-[90vh] bg-surface border-t sm:border border-border-strong rounded-t-3xl sm:rounded-3xl shadow-raised flex flex-col overflow-hidden text-main animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-12 h-1 bg-muted/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-3 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-main leading-tight">
                Productivity & Habit Insights
              </h2>
              <span className="text-[11px] text-muted">
                Action rhythm, streak health, and completion patterns
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
            aria-label="Close insights"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Streak Health & Freeze Banner */}
          <div className="p-4 rounded-2xl bg-accent-soft/40 border border-accent/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-accent fill-accent" />
                <span className="text-xs font-black text-main">
                  Streak Protection: {streakState.freezesRemaining} Freeze Available
                </span>
              </div>

              {streakState.freezesRemaining > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = addDays(today, -1);
                    onApplyFreeze(yesterday);
                    triggerPartyPop('single');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-accent text-on-accent text-xs font-bold hover:bg-accent-hover transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Snowflake size={12} />
                  <span>Freeze Yesterday</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-muted leading-relaxed">
              <strong>How streaks work:</strong> Complete at least 1 daily task or master goal milestone to count that calendar day. Missed a day? Apply your 1 weekly streak freeze to keep your rhythm unbroken!
            </p>
          </div>

          {/* 2. Hand-Built SVG Weekly Completion Bar Chart */}
          <div className="p-4 rounded-2xl bg-sunken border border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-main">Weekly Tasks Done (Last 6 Weeks)</span>
              <span className="text-[10px] text-faint">Hand-built SVG · Zero dependencies</span>
            </div>

            <div className="pt-2">
              <svg viewBox="0 0 300 90" className="w-full h-24 overflow-visible">
                {/* Horizontal grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="currentColor" className="text-subtle" strokeDasharray="3,3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="currentColor" className="text-subtle" strokeDasharray="3,3" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="currentColor" className="text-subtle" />

                {/* Bars */}
                {metrics.weeksData.map((w, idx) => {
                  const x = idx * 50 + 12;
                  const maxH = 60;
                  const h = w.total > 0 ? Math.max(6, Math.min(maxH, (w.completed / Math.max(1, w.total)) * maxH)) : 6;
                  const y = 80 - h;

                  return (
                    <g key={w.weekStart}>
                      {/* Background track bar */}
                      <rect
                        x={x}
                        y={20}
                        width={26}
                        height={60}
                        rx={5}
                        fill="currentColor"
                        className="text-subtle/40"
                      />
                      {/* Completed fill bar */}
                      <rect
                        x={x}
                        y={y}
                        width={26}
                        height={h}
                        rx={5}
                        fill="currentColor"
                        className="text-accent"
                      />
                      {/* Count label */}
                      <text
                        x={x + 13}
                        y={y - 4}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="currentColor"
                        className="text-main"
                      >
                        {w.completed}
                      </text>
                      {/* Week date label */}
                      <text
                        x={x + 13}
                        y={92}
                        textAnchor="middle"
                        fontSize="8"
                        fill="currentColor"
                        className="text-faint"
                      >
                        {w.weekStart}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* 3. 4-Grid Deep Metric Insights */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-sunken border border-subtle">
              <div className="flex items-center gap-1.5 text-muted text-xs font-bold mb-1">
                <Calendar size={13} className="text-accent" />
                <span>Best Weekday</span>
              </div>
              <div className="text-lg font-black text-main">{metrics.bestWeekday}</div>
              <span className="text-[10px] text-faint">Peak task completion day</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-sunken border border-subtle">
              <div className="flex items-center gap-1.5 text-muted text-xs font-bold mb-1">
                <Clock size={13} className="text-accent" />
                <span>Peak Focus Time</span>
              </div>
              <div className="text-lg font-black text-main">{metrics.peakHourStr}</div>
              <span className="text-[10px] text-faint">Most tasks finished around this time</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-sunken border border-subtle">
              <div className="flex items-center gap-1.5 text-muted text-xs font-bold mb-1">
                <CheckCircle2 size={13} className="text-success" />
                <span>Goals on Target</span>
              </div>
              <div className="text-lg font-black text-main">
                {metrics.onTimeGoals} on-time <span className="text-xs font-semibold text-faint">({metrics.lateGoals} late)</span>
              </div>
              <span className="text-[10px] text-faint">Master goal deadline health</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-sunken border border-subtle">
              <div className="flex items-center gap-1.5 text-muted text-xs font-bold mb-1">
                <Sparkles size={13} className="text-accent" />
                <span>Mood Correlation</span>
              </div>
              <div className="text-sm font-extrabold text-main leading-tight mt-0.5">
                {metrics.highMoodAvgDone > 0 ? `~${metrics.highMoodAvgDone} tasks done on thriving days` : 'Log reflections to see trend'}
              </div>
              <span className="text-[10px] text-faint">High mood aligns with momentum</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-subtle bg-sunken/40 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 rounded-xl bg-surface hover:bg-sunken border border-border-input text-main text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
