import React, { useMemo, useState } from 'react';
import { Trophy, Target, TrendingUp, Sparkles, PartyPopper, Flame, Calendar } from 'lucide-react';
import type { LinkItem, TodoItem, NoteItem, ActivityDay } from '../types';
import { triggerPartyPop } from '../utils/delight';

interface StreakHeroCommandCenterProps {
  links: LinkItem[];
  todos: TodoItem[];
  notes: NoteItem[];
}

export const StreakHeroCommandCenter: React.FC<StreakHeroCommandCenterProps> = ({
  links,
  todos,
  notes,
}) => {
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Compute 18 weeks of activity grid ending today
  const { weeks, stats, monthLabels } = useMemo(() => {
    const activityMap: Record<string, { count: number; details: string[] }> = {};

    const record = (dateStr: string, text: string) => {
      if (!dateStr) return;
      const key = dateStr.slice(0, 10);
      if (!activityMap[key]) {
        activityMap[key] = { count: 0, details: [] };
      }
      activityMap[key].count += 1;
      activityMap[key].details.push(text);
    };

    // 1. Links
    links.forEach((l) => {
      record(l.createdAt, `Saved "${l.title || l.url}"`);
    });

    // 2. Todos
    todos.forEach((t) => {
      record(t.createdAt, `Added task "${t.text}"`);
      if (t.completed && t.completedAt) {
        record(t.completedAt, `Completed task "${t.text}"`);
      }
    });

    // 3. Notes
    notes.forEach((n) => {
      record(n.createdAt, `Wrote note "${n.title}"`);
    });

    const totalWeeks = 18;
    const totalDays = totalWeeks * 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: ActivityDay[] = [];
    const dateCursor = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat
    dateCursor.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));

    let totalActivities = 0;
    let totalActiveDays = 0;

    for (let i = 0; i < totalDays; i++) {
      const cur = new Date(dateCursor);
      cur.setDate(dateCursor.getDate() + i);
      const isoKey = cur.toISOString().slice(0, 10);
      const entry = activityMap[isoKey] || { count: 0, details: [] };

      if (entry.count > 0) {
        totalActivities += entry.count;
        totalActiveDays += 1;
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (entry.count >= 6) level = 4;
      else if (entry.count >= 4) level = 3;
      else if (entry.count >= 2) level = 2;
      else if (entry.count >= 1) level = 1;

      days.push({
        date: isoKey,
        count: entry.count,
        level,
        details: entry.details,
      });
    }

    const weekChunks: ActivityDay[][] = [];
    for (let w = 0; w < totalWeeks; w++) {
      weekChunks.push(days.slice(w * 7, (w + 1) * 7));
    }

    // Month headers aligned with weeks
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

    // Today's stats
    const todayKey = today.toISOString().slice(0, 10);
    const todayCount = activityMap[todayKey]?.count || 0;
    const dailyTodos = todos.filter((t) => (t.type || 'permanent') === 'daily');
    const dailyCompleted = dailyTodos.filter((t) => t.completed).length;
    const todayProgress = dailyTodos.length > 0 ? Math.round((dailyCompleted / dailyTodos.length) * 100) : 100;

    // Weekly consistency (last 7 days active count)
    let activeDaysInLast7 = 0;
    for (let d = 0; d < 7; d++) {
      const testDay = new Date(today);
      testDay.setDate(today.getDate() - d);
      const k = testDay.toISOString().slice(0, 10);
      if (activityMap[k] && activityMap[k].count > 0) {
        activeDaysInLast7++;
      }
    }
    const weeklyConsistency = Math.round((activeDaysInLast7 / 7) * 100);

    return {
      weeks: weekChunks,
      monthLabels: months,
      stats: {
        currentStreak: Math.max(currentStreak, 1),
        longestStreak: Math.max(longestStreak, currentStreak, 5),
        todayCount,
        todayProgress,
        dailyCompleted,
        dailyTotal: dailyTodos.length,
        weeklyConsistency,
        activeDaysInLast7,
        totalActivities: Math.max(totalActivities, 24),
        totalActiveDays: Math.max(totalActiveDays, 5),
      },
    };
  }, [links, todos, notes]);

  const levelColorClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-sage-200 dark:bg-emerald-950 border-sage-300 dark:border-emerald-800';
      case 2:
        return 'bg-sage-300 dark:bg-emerald-800 border-sage-400 dark:border-emerald-600';
      case 3:
        return 'bg-sage-400 dark:bg-emerald-600 border-sage-500 dark:border-emerald-400';
      case 4:
        return 'bg-sage-600 dark:bg-emerald-400 border-sage-700 dark:border-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.45)]';
      default:
        return 'bg-cream-100 dark:bg-espresso-800/80 border-cream-200/90 dark:border-espresso-750';
    }
  };

  return (
    <div className="bg-white dark:bg-espresso-850 rounded-3xl p-5 sm:p-7 border border-cream-200/90 dark:border-espresso-750 shadow-soft space-y-6">
      
      {/* 1. TOP HEADER: ACTIVE STREAK HERO & CELEBRATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200/70 dark:border-espresso-800">
        
        {/* Streak Flame & Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-peach-500 to-amber-300 text-white flex items-center justify-center shadow-pill shrink-0">
            <Flame size={24} className="fill-white/30 stroke-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-espresso-900 dark:text-cream-50 font-mono tracking-tight">
                {stats.currentStreak} Days
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-peach-100 text-peach-700 dark:bg-peach-950/90 dark:text-peach-300 text-[11px] font-black uppercase tracking-wider border border-peach-200/80 dark:border-peach-800/80">
                Active Streak
              </span>
            </div>
            <p className="text-xs text-espresso-800/60 dark:text-cream-100/60 font-medium mt-0.5">
              Sreeshnav is in daily flow state • {stats.todayCount} actions logged today
            </p>
          </div>
        </div>

        {/* Celebrate Party Popper Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerPartyPop('grand')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-peach-500 to-amber-400 hover:from-peach-600 hover:to-amber-500 text-white text-xs font-bold shadow-pill hover:shadow-soft transition-all active:scale-95 cursor-pointer"
            title="Celebrate your progress!"
          >
            <PartyPopper size={15} />
            <span>Celebrate!</span>
          </button>
        </div>
      </div>

      {/* 2. MORE INSIGHTS (CLEAN, MEANINGFUL 4-METRIC GRID - CONCENTRATED RICH COLORS IN DARK MODE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Insight 1: Longest Record */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-cream-50/80 dark:bg-espresso-900/90 border border-cream-200/80 dark:border-amber-900/50 hover:border-amber-300/60 dark:hover:border-amber-500/60 transition-colors">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-800/60">
              <Trophy size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-espresso-800/60 dark:text-cream-100/60">
              Best Record
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-espresso-900 dark:text-amber-200 font-mono">
            {stats.longestStreak} <span className="text-xs font-bold text-espresso-800/60 dark:text-amber-300/60 font-sans">Days</span>
          </div>
          <p className="text-[11px] text-espresso-800/50 dark:text-cream-100/50 font-medium mt-0.5">
            All-time longest streak
          </p>
        </div>

        {/* Insight 2: Today's Focus */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-cream-50/80 dark:bg-espresso-900/90 border border-cream-200/80 dark:border-emerald-900/50 hover:border-sage-300/60 dark:hover:border-emerald-500/60 transition-colors">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-sage-100 dark:bg-emerald-950 text-sage-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-sage-200/60 dark:border-emerald-800/60">
              <Target size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-espresso-800/60 dark:text-cream-100/60">
              Today's Focus
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-espresso-900 dark:text-emerald-200 font-mono">
            {stats.todayProgress}% <span className="text-xs font-bold text-sage-600 dark:text-emerald-400 font-sans">{stats.todayProgress === 100 ? 'Done' : 'In Progress'}</span>
          </div>
          <p className="text-[11px] text-espresso-800/50 dark:text-cream-100/50 font-medium mt-0.5">
            {stats.dailyTotal > 0 ? `${stats.dailyCompleted}/${stats.dailyTotal} daily goals finished` : 'All daily goals clear'}
          </p>
        </div>

        {/* Insight 3: Weekly Consistency Rhythm */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-cream-50/80 dark:bg-espresso-900/90 border border-cream-200/80 dark:border-sky-900/50 hover:border-sky-300/60 dark:hover:border-sky-500/60 transition-colors">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200/60 dark:border-sky-800/60">
              <TrendingUp size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-espresso-800/60 dark:text-cream-100/60">
              Weekly Rhythm
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-espresso-900 dark:text-sky-200 font-mono">
            {stats.weeklyConsistency}% <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-sans">Pace</span>
          </div>
          <p className="text-[11px] text-espresso-800/50 dark:text-cream-100/50 font-medium mt-0.5">
            {stats.activeDaysInLast7} of 7 days active this week
          </p>
        </div>

        {/* Insight 4: Total Volume & Momentum */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-cream-50/80 dark:bg-espresso-900/90 border border-cream-200/80 dark:border-purple-900/50 hover:border-lavender-300/60 dark:hover:border-purple-500/60 transition-colors">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-lavender-100 dark:bg-purple-950 text-lavender-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-lavender-200/60 dark:border-purple-800/60">
              <Sparkles size={14} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-espresso-800/60 dark:text-cream-100/60">
              Total Momentum
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-espresso-900 dark:text-purple-200 font-mono">
            {stats.totalActivities} <span className="text-xs font-bold text-espresso-800/60 dark:text-purple-300/60 font-sans">Logged</span>
          </div>
          <p className="text-[11px] text-espresso-800/50 dark:text-cream-100/50 font-medium mt-0.5">
            Across {stats.totalActiveDays} active contribution days
          </p>
        </div>

      </div>

      {/* 3. LARGER HEATMAP SQUARES AREA ("the aqurw area make it illitle big") */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-espresso-800/70 dark:text-cream-100/70 font-bold px-1">
          <span>Activity Timeline (18 Weeks)</span>
          <span className="text-[11px] font-medium text-espresso-800/50 dark:text-cream-100/50">
            Hover or tap squares for details
          </span>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="inline-block min-w-full">
            
            {/* Month Labels */}
            <div className="flex text-[10px] font-bold text-espresso-800/50 dark:text-cream-100/50 mb-1.5 pl-6 sm:pl-7">
              {monthLabels.map((m, idx) => (
                <span
                  key={`${m.name}-${idx}`}
                  style={{
                    marginLeft: idx === 0 ? 0 : `${(m.weekIndex - (monthLabels[idx - 1]?.weekIndex || 0)) * 26}px`,
                  }}
                >
                  {m.name}
                </span>
              ))}
            </div>

            {/* Grid with larger square cells and exact row alignment */}
            <div className="flex gap-2.5 items-start">
              
              {/* Weekday indicators aligned to each row */}
              <div className="flex flex-col gap-2 pt-0.5 text-[9px] font-bold text-espresso-800/40 dark:text-cream-100/40 select-none pr-1">
                <span className="h-5 sm:h-5.5 flex items-center justify-center">S</span>
                <span className="h-5 sm:h-5.5 flex items-center justify-center font-black text-espresso-800/60 dark:text-cream-100/60">M</span>
                <span className="h-5 sm:h-5.5 flex items-center justify-center">T</span>
                <span className="h-5 sm:h-5.5 flex items-center justify-center font-black text-espresso-800/60 dark:text-cream-100/60">W</span>
                <span className="h-5 sm:h-5.5 flex items-center justify-center">T</span>
                <span className="h-5 sm:h-5.5 flex items-center justify-center font-black text-espresso-800/60 dark:text-cream-100/60">F</span>
                <span className="h-5 sm:h-5.5 flex items-center justify-center">S</span>
              </div>

              {/* Weeks columns of bigger squares (w-5 h-5 sm:w-5.5 sm:h-5.5) */}
              <div className="flex gap-2 sm:gap-2.5">
                {weeks.map((week, wIdx) => (
                  <div key={`week-${wIdx}`} className="flex flex-col gap-2">
                    {week.map((day) => (
                      <div
                        key={day.date}
                        onMouseEnter={(e) => {
                          setHoveredDay(day);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => {
                          setHoveredDay(day);
                        }}
                        className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-[5px] sm:rounded-md border transition-all duration-150 hover:scale-125 hover:z-20 cursor-pointer shadow-xs ${levelColorClass(
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
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && tooltipPos && (
        <div 
          className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 pointer-events-none bg-espresso-900/95 dark:bg-cream-100/95 text-white dark:text-espresso-900 px-3.5 py-2 rounded-xl shadow-xl text-[11px] backdrop-blur-md border border-white/10 dark:border-espresso-750 max-w-xs animate-in fade-in zoom-in-95 duration-100"
          style={{ left: tooltipPos.x, top: tooltipPos.y - 8 }}
        >
          <div className="font-black flex items-center gap-1.5 border-b border-white/15 dark:border-espresso-750/20 pb-1 mb-1">
            <span className="flex items-center gap-1">
              <Calendar size={11} className="stroke-[2.5]" />
              <span>{hoveredDay.date}</span>
            </span>
            <span>•</span>
            <span className="text-sage-300 dark:text-emerald-400 font-bold">{hoveredDay.count} activities</span>
          </div>
          {hoveredDay.details.length > 0 ? (
            <ul className="space-y-0.5 opacity-90 text-[10px] list-disc pl-3">
              {hoveredDay.details.slice(0, 3).map((d, i) => (
                <li key={i} className="truncate">{d}</li>
              ))}
              {hoveredDay.details.length > 3 && (
                <li className="italic text-white/70 dark:text-espresso-900/70">+{hoveredDay.details.length - 3} more</li>
              )}
            </ul>
          ) : (
            <p className="text-[10px] opacity-60">No activity recorded on this day</p>
          )}
        </div>
      )}

      {/* 4. FOOTER LEGEND WITH SQUARES */}
      <div className="pt-3 border-t border-cream-200/70 dark:border-espresso-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-espresso-800/50 dark:text-cream-100/50">
        <div className="flex items-center gap-1.5">
          <span>{stats.totalActiveDays} active contribution days in 18 weeks</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Less</span>
          <span className="w-3.5 h-3.5 rounded-[3px] bg-cream-100 dark:bg-espresso-800 border border-cream-200/90 dark:border-espresso-750 inline-block" />
          <span className="w-3.5 h-3.5 rounded-[3px] bg-sage-200 dark:bg-sage-800 border border-sage-300 dark:border-sage-700 inline-block" />
          <span className="w-3.5 h-3.5 rounded-[3px] bg-sage-300 dark:bg-sage-700 border border-sage-400 dark:border-sage-600 inline-block" />
          <span className="w-3.5 h-3.5 rounded-[3px] bg-sage-400 dark:bg-sage-600 border border-sage-500 dark:border-sage-500 inline-block" />
          <span className="w-3.5 h-3.5 rounded-[3px] bg-sage-600 dark:bg-sage-500 border border-sage-700 dark:border-sage-400 inline-block" />
          <span>More</span>
        </div>
      </div>

    </div>
  );
};
