import React, { useMemo, useState } from 'react';
import { Sparkles, Flame, X, Trophy } from 'lucide-react';
import type { LinkItem, TodoItem, NoteItem, ActivityDay } from '../types';
import { playPopSound } from '../utils/delight';

interface ActivityHeatmapProps {
  links: LinkItem[];
  todos: TodoItem[];
  notes: NoteItem[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  links,
  todos,
  notes,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'tasks' | 'links' | 'notes'>('all');
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(null);
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Compute 16 weeks (112 days) of activity grid ending today
  const { weeks, stats, monthLabels } = useMemo(() => {
    const activityMap: Record<string, { count: number; details: { type: string; text: string; time?: string }[] }> = {};

    const record = (dateStr: string, text: string, type: string) => {
      if (!dateStr) return;
      const key = dateStr.slice(0, 10);
      if (!activityMap[key]) {
        activityMap[key] = { count: 0, details: [] };
      }
      
      const shouldInclude = 
        filterType === 'all' ||
        (filterType === 'links' && type === 'link') ||
        (filterType === 'tasks' && type === 'task') ||
        (filterType === 'notes' && type === 'note');

      if (shouldInclude) {
        activityMap[key].count += 1;
        activityMap[key].details.push({
          type,
          text,
          time: new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    };

    // 1. Links
    links.forEach((l) => {
      record(l.createdAt, `Saved "${l.title || l.url}"`, 'link');
    });

    // 2. Todos
    todos.forEach((t) => {
      record(t.createdAt, `Added task "${t.text}"`, 'task');
      if (t.completed && t.completedAt) {
        record(t.completedAt, `Completed task "${t.text}"`, 'task');
      }
    });

    // 3. Notes
    notes.forEach((n) => {
      record(n.createdAt, `Wrote note "${n.title}"`, 'note');
      if (n.updatedAt && n.updatedAt !== n.createdAt) {
        record(n.updatedAt, `Updated note "${n.title}"`, 'note');
      }
    });

    // 16 weeks = 112 days
    const totalWeeks = 16;
    const totalDays = totalWeeks * 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: ActivityDay[] = [];
    const dateCursor = new Date(today);
    const dayOfWeek = today.getDay();
    dateCursor.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));

    for (let i = 0; i < totalDays; i++) {
      const cur = new Date(dateCursor);
      cur.setDate(dateCursor.getDate() + i);
      const isoKey = cur.toISOString().slice(0, 10);
      const entry = activityMap[isoKey] || { count: 0, details: [] };

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (entry.count >= 6) level = 4;
      else if (entry.count >= 4) level = 3;
      else if (entry.count >= 2) level = 2;
      else if (entry.count >= 1) level = 1;

      days.push({
        date: isoKey,
        count: entry.count,
        level,
        details: entry.details.map(d => `${d.type === 'link' ? '🔗' : d.type === 'task' ? '✅' : '📝'} ${d.text} (${d.time})`),
      });
    }

    const weekChunks: ActivityDay[][] = [];
    for (let w = 0; w < totalWeeks; w++) {
      weekChunks.push(days.slice(w * 7, (w + 1) * 7));
    }

    const months: { name: string; weekIndex: number }[] = [];
    let lastMonth = '';
    weekChunks.forEach((week, wIdx) => {
      const firstDayOfWeek = new Date(week[0].date);
      const mName = firstDayOfWeek.toLocaleString('default', { month: 'short' });
      if (mName !== lastMonth) {
        months.push({ name: mName, weekIndex: wIdx });
        lastMonth = mName;
      }
    });

    // Streaks calculation
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const checkDate = new Date(today);
    while (true) {
      const k = checkDate.toISOString().slice(0, 10);
      if (activityMap[k] && activityMap[k].count > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (currentStreak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayKey = checkDate.toISOString().slice(0, 10);
          if (activityMap[yesterdayKey] && activityMap[yesterdayKey].count > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    days.forEach((d) => {
      if (d.count > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    });

    const totalActiveDays = Object.values(activityMap).filter((v) => v.count > 0).length;
    const totalActions = Object.values(activityMap).reduce((sum, v) => sum + v.count, 0);
    const completedTasksCount = todos.filter((t) => t.completed).length;

    return {
      weeks: weekChunks,
      monthLabels: months,
      stats: {
        currentStreak: Math.max(currentStreak, 1),
        longestStreak: Math.max(longestStreak, currentStreak, 3),
        totalActiveDays,
        totalActions,
        completedTasksCount,
      },
    };
  }, [links, todos, notes, filterType]);

  const levelColorClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-heatmap-1';
      case 2:
        return 'bg-heatmap-2';
      case 3:
        return 'bg-heatmap-3';
      case 4:
        return 'bg-heatmap-4 shadow-2xs';
      default:
        return 'bg-heatmap-0 border border-subtle';
    }
  };

  return (
    <div className="flex flex-col justify-between h-full min-h-[320px] bg-surface rounded-3xl p-4 sm:p-5 border border-subtle shadow-soft text-main">
      
      {/* 1. Top Ribbon */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent flex items-center justify-center text-sm shadow-2xs">
              🌱
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-main leading-tight">
                Activity Heatmap
              </h3>
              <span className="text-[10px] text-faint font-medium">
                Detailed GitHub-style tracker
              </span>
            </div>
          </div>

          {/* Activity Category Filters */}
          <div className="flex items-center p-0.5 rounded-xl bg-sunken text-[10px] font-bold border border-subtle">
            {(['all', 'tasks', 'links', 'notes'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  playPopSound();
                }}
                className={`px-2 py-0.5 rounded-lg capitalize transition cursor-pointer ${
                  filterType === type
                    ? 'bg-surface text-accent-text shadow-2xs font-extrabold'
                    : 'text-muted hover:text-main'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Stat Badges */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-2xl bg-sunken border border-subtle flex items-center gap-1.5">
            <Flame size={14} className="text-accent fill-accent shrink-0" />
            <div className="min-w-0">
              <span className="block text-[9px] text-faint font-bold uppercase truncate">
                Streak
              </span>
              <span className="text-xs font-black text-main font-mono">
                {stats.currentStreak}d
              </span>
            </div>
          </div>

          <div className="p-2 rounded-2xl bg-sunken border border-subtle flex items-center gap-1.5">
            <Trophy size={13} className="text-accent shrink-0" />
            <div className="min-w-0">
              <span className="block text-[9px] text-faint font-bold uppercase truncate">
                Best
              </span>
              <span className="text-xs font-black text-main font-mono">
                {stats.longestStreak}d
              </span>
            </div>
          </div>

          <div className="p-2 rounded-2xl bg-sunken border border-subtle flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent shrink-0" />
            <div className="min-w-0">
              <span className="block text-[9px] text-faint font-bold uppercase truncate">
                Actions
              </span>
              <span className="text-xs font-black text-main font-mono">
                {stats.totalActions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 16-Week Heatmap Grid */}
      <div className="overflow-x-auto my-auto pb-1">
        <div className="min-w-[320px]">
          
          {/* Month Labels */}
          <div className="flex text-[9px] font-bold text-faint mb-1 ml-5">
            {monthLabels.map((m, idx) => (
              <span
                key={`${m.name}-${idx}`}
                style={{ marginLeft: idx === 0 ? 0 : `${(m.weekIndex - (monthLabels[idx - 1]?.weekIndex || 0)) * 14.5}px` }}
              >
                {m.name}
              </span>
            ))}
          </div>

          {/* Grid Rows: 7 rows for Sun..Sat */}
          <div className="flex gap-1.5 items-center">
            
            {/* Weekday indicators */}
            <div className="flex flex-col justify-between h-[86px] text-[8px] font-bold text-faint pr-1 select-none">
              <span>M</span>
              <span>W</span>
              <span>F</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-1">
              {weeks.map((week, wIdx) => (
                <div key={`week-${wIdx}`} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onClick={() => {
                        setSelectedDay(day);
                        playPopSound();
                      }}
                      onMouseEnter={(e) => {
                        setHoveredDay(day);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[4px] transition-transform duration-150 hover:scale-135 hover:z-10 cursor-pointer ${levelColorClass(
                        day.level
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && tooltipPos && (
        <div 
          className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 pointer-events-none bg-raised text-main px-3 py-1.5 rounded-xl shadow-raised text-[10px] backdrop-blur-md border border-subtle max-w-xs animate-in fade-in zoom-in-95 duration-100"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 6 }}
        >
          <p className="font-extrabold flex items-center gap-1">
            <span>📅 {hoveredDay.date}</span>
            <span>•</span>
            <span className="text-accent">{hoveredDay.count} activities</span>
          </p>
          {hoveredDay.details.length > 0 ? (
            <ul className="mt-1 space-y-0.5 opacity-90 text-[9px] list-disc pl-3">
              {hoveredDay.details.slice(0, 3).map((d, i) => (
                <li key={i} className="truncate">{d}</li>
              ))}
              {hoveredDay.details.length > 3 && (
                <li className="italic">+{hoveredDay.details.length - 3} more</li>
              )}
            </ul>
          ) : (
            <p className="opacity-60 text-[9px]">Click cell to view history</p>
          )}
        </div>
      )}

      {/* Day Detail Modal Drawer */}
      {selectedDay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-main/40 backdrop-blur-xs animate-in fade-in duration-100"
          onClick={() => setSelectedDay(null)}
        >
          <div 
            className="w-full max-w-sm bg-surface rounded-3xl p-5 border border-subtle shadow-raised space-y-3 text-main"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-subtle pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <div>
                  <h4 className="font-extrabold text-sm text-main">
                    {selectedDay.date}
                  </h4>
                  <span className="text-[10px] text-accent font-bold">
                    {selectedDay.count} activities logged
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-faint hover:text-main cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 text-xs">
              {selectedDay.details.length > 0 ? (
                selectedDay.details.map((detail, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-sunken text-main font-medium border border-subtle">
                    {detail}
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-faint italic">
                  No activity on this date.
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="w-full py-1.5 bg-accent hover:bg-accent-hover text-on-accent rounded-xl text-xs font-bold shadow-soft cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 3. Footer Legend */}
      <div className="pt-2 mt-auto border-t border-subtle flex items-center justify-between text-[10px] text-faint h-7">
        <span className="font-medium">
          {stats.totalActiveDays} active days • Click cell for details
        </span>

        <div className="flex items-center gap-1">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-[3px] bg-heatmap-0 border border-subtle inline-block" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-heatmap-1 inline-block" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-heatmap-2 inline-block" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-heatmap-3 inline-block" />
          <span className="w-2.5 h-2.5 rounded-[3px] bg-heatmap-4 inline-block" />
          <span>More</span>
        </div>
      </div>

    </div>
  );
};
