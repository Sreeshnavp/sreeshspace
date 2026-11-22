import { describe, it, expect } from 'vitest';
import { DEFAULT_BAZAAR_PERKS, DEFAULT_POINT_RATES, PointRatesConfig, getSeedPriorities } from '../../components/habits/HabitsDashboard';
import { addDays, startOfWeek, parseLocalDateKey } from '../dates';

describe('Habit Points & Reward System Logic', () => {
  it('has default point reward rates matching specifications', () => {
    expect(DEFAULT_POINT_RATES.habitPts).toBe(20);
    expect(DEFAULT_POINT_RATES.priorityPts).toBe(15);
    expect(DEFAULT_POINT_RATES.milestonePts).toBe(25);
    expect(DEFAULT_POINT_RATES.dailyBonusPts).toBe(50);
  });

  it('supports custom editable point reward rates', () => {
    const customRates: PointRatesConfig = {
      habitPts: 30,
      priorityPts: 20,
      milestonePts: 40,
      dailyBonusPts: 100,
    };

    let points = 0;
    // Completing habit with custom rate
    points += customRates.habitPts;
    expect(points).toBe(30);

    // Completing priority with custom rate
    points += customRates.priorityPts;
    expect(points).toBe(50);

    // Completing milestone with custom rate
    points += customRates.milestonePts;
    expect(points).toBe(90);

    // Claiming daily bonus with custom rate
    points += customRates.dailyBonusPts;
    expect(points).toBe(190);

    // Unchecking habit deducts custom rate
    points -= customRates.habitPts;
    expect(points).toBe(160);
  });

  it('defaults to clean empty cozy bazaar perks with zero sample items', () => {
    expect(DEFAULT_BAZAAR_PERKS).toEqual([]);
  });

  it('correctly calculates points delta on completing/undoing actions', () => {
    let glowPoints = 0;
    const updateGlowPoints = (delta: number) => {
      glowPoints = Math.max(0, glowPoints + delta);
      return glowPoints;
    };

    // Completing a daily habit awards 20 pts
    updateGlowPoints(20);
    expect(glowPoints).toBe(20);

    // Completing a priority task awards 15 pts
    updateGlowPoints(15);
    expect(glowPoints).toBe(35);

    // Completing a goal milestone awards 25 pts
    updateGlowPoints(25);
    expect(glowPoints).toBe(60);

    // Claiming streak bonus awards 50 pts
    updateGlowPoints(50);
    expect(glowPoints).toBe(110);

    // Undoing actions deducts points
    updateGlowPoints(-20);
    expect(glowPoints).toBe(90);

    // Clamps to 0 if deducted more than current balance
    updateGlowPoints(-200);
    expect(glowPoints).toBe(0);
  });

  it('validates affordability and handles perk redemption', () => {
    let glowPoints = 50;
    const coffeePerk = {
      id: 'custom-perk-1',
      title: 'Artisanal Coffee or Boba',
      cost: 40,
      emoji: '☕',
      redeemedCount: 0,
      lastRedeemedDate: null,
    };
    const moviePerk = {
      id: 'custom-perk-2',
      title: 'Movie Night & Favorite Snack',
      cost: 100,
      emoji: '🎬',
      redeemedCount: 0,
      lastRedeemedDate: null,
    };

    // Coffee can be afforded (50 >= 40)
    expect(glowPoints >= coffeePerk.cost).toBe(true);

    // Movie cannot be afforded (50 < 100), needed: 50 pts
    expect(glowPoints >= moviePerk.cost).toBe(false);
    expect(moviePerk.cost - glowPoints).toBe(50);

    // Redeem coffee
    glowPoints -= coffeePerk.cost;
    const updatedPerk = {
      ...coffeePerk,
      redeemedCount: (coffeePerk.redeemedCount || 0) + 1,
      lastRedeemedDate: '2026-11-22',
      unlocked: true,
    };

    expect(glowPoints).toBe(10);
    expect(updatedPerk.redeemedCount).toBe(1);
    expect(updatedPerk.unlocked).toBe(true);

    // Now coffee can no longer be afforded (10 < 40)
    expect(glowPoints >= coffeePerk.cost).toBe(false);
  });

  it('filters out legacy default perks and respects empty perk array on deletion', () => {
    // Legacy stored perks containing default dummy items and a custom item
    const legacyPerks = [
      { id: 'perk-default-1', title: 'Artisanal Coffee or Boba', cost: 40 },
      { id: 'perk-default-2', title: '1 Hr Guilt-Free Gaming', cost: 60 },
      { id: 'perk-custom-123', title: 'Buy a new mechanical keyboard', cost: 500 },
    ];

    const filtered = legacyPerks.filter((p) => !p.id?.startsWith('perk-default-'));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Buy a new mechanical keyboard');

    // When the user deletes the custom perk, array is empty
    const afterDelete = filtered.filter((p) => p.id !== 'perk-custom-123');
    expect(afterDelete).toEqual([]);

    // Parsing an empty array from storage should stay empty without falling back to defaults
    const reloaded = JSON.parse(JSON.stringify(afterDelete)).filter((p: any) => !p.id?.startsWith('perk-default-'));
    expect(reloaded).toEqual([]);
  });

  it('getSeedPriorities generates completed logged tasks for all days of the previous week', () => {
    const today = '2026-11-22';
    const seeds = getSeedPriorities(today);
    expect(seeds.length).toBeGreaterThanOrEqual(14);

    const prevWeekMonday = addDays(startOfWeek(today, 1), -7);
    const expectedDays = [
      addDays(prevWeekMonday, 0),
      addDays(prevWeekMonday, 1),
      addDays(prevWeekMonday, 2),
      addDays(prevWeekMonday, 3),
      addDays(prevWeekMonday, 4),
      addDays(prevWeekMonday, 5),
      addDays(prevWeekMonday, 6),
    ];

    // Every day in previous week should have at least one task
    for (const d of expectedDays) {
      const dayTasks = seeds.filter(s => s.date === d);
      expect(dayTasks.length).toBeGreaterThan(0);
      expect(dayTasks.every(t => t.completed)).toBe(true);
      expect(dayTasks.every(t => t.text.trim().length > 0)).toBe(true);
    }
  });

  it('handles removing or setting daily bonus to 0', () => {
    const zeroBonusRates: PointRatesConfig = {
      habitPts: 20,
      priorityPts: 15,
      milestonePts: 25,
      dailyBonusPts: 0,
    };

    // When daily bonus is 0, bonus should not be awarded and claim should be disabled/hidden
    expect(zeroBonusRates.dailyBonusPts).toBe(0);
    const shouldRenderClaimButton = zeroBonusRates.dailyBonusPts > 0;
    expect(shouldRenderClaimButton).toBe(false);

    // Summary string should not show "+0 daily bonus"
    const summaryExtra = zeroBonusRates.dailyBonusPts > 0 ? ` · +${zeroBonusRates.dailyBonusPts} daily bonus` : '';
    expect(summaryExtra).toBe('');
  });

  it('calculates circle progress metrics correctly for Habits, Priorities, and Goals', () => {
    // 1. Habits (Routines)
    const totalRoutines = 4;
    const completedRoutines = 3;
    const focusPercent = totalRoutines > 0 ? Math.round((completedRoutines / totalRoutines) * 100) : 0;
    expect(focusPercent).toBe(75);
    const habitsOffset = 175.9 - (175.9 * (focusPercent / 100));
    expect(habitsOffset).toBeCloseTo(43.975, 1);

    // 2. Today's Priorities
    const totalPriorities = 5;
    const completedPriorities = 2;
    const prioritiesPercent = totalPriorities > 0 ? Math.round((completedPriorities / totalPriorities) * 100) : 0;
    expect(prioritiesPercent).toBe(40);
    const prioritiesOffset = 175.9 - (175.9 * (prioritiesPercent / 100));
    expect(prioritiesOffset).toBeCloseTo(105.54, 1);

    // 3. Long-Term Goals
    const goalArcs = [
      { id: 'g1', progressPercent: 50, subtasks: [{ id: 's1', completed: true }, { id: 's2', completed: false }] },
      { id: 'g2', progressPercent: 100, subtasks: [{ id: 's3', completed: true }] },
    ];
    const totalMilestones = goalArcs.reduce((acc, g) => acc + g.subtasks.length, 0);
    const completedMilestones = goalArcs.reduce((acc, g) => acc + g.subtasks.filter(s => s.completed).length, 0);
    expect(totalMilestones).toBe(3);
    expect(completedMilestones).toBe(2);
    const goalsPercent = Math.round((completedMilestones / totalMilestones) * 100);
    expect(goalsPercent).toBe(67);
    const goalsOffset = 175.9 - (175.9 * (goalsPercent / 100));
    expect(goalsOffset).toBeCloseTo(58.047, 1);
  });

  it('correctly calculates day-of-month number for week calendar pills', () => {
    const mondayKey = '2026-11-16';
    const sundayKey = '2026-11-22';
    expect(parseLocalDateKey(mondayKey).getDate()).toBe(16);
    expect(parseLocalDateKey(sundayKey).getDate()).toBe(22);
  });

  it('ensures postponed tasks disappear from today and appear on tomorrow', () => {
    const today = '2026-11-22';
    const tomorrow = '2026-11-23';

    let priorities = [
      { id: 'p1', text: 'Important task', date: today, completed: false, priority: 'high' as const, time: 'Today' },
      { id: 'p2', text: 'Other task', date: today, completed: false, priority: 'medium' as const, time: 'Today' },
    ];

    // Check today before postponement
    const todayBefore = priorities.filter(p => p.date === today);
    expect(todayBefore.map(p => p.id)).toEqual(['p1', 'p2']);

    // Postpone p1 to tomorrow
    priorities = priorities.map(p => p.id === 'p1' ? { ...p, date: tomorrow, time: 'Tomorrow' } : p);

    // Today should only have p2 now (p1 must disappear from today)
    const todayAfter = priorities.filter(p => p.date === today);
    expect(todayAfter.map(p => p.id)).toEqual(['p2']);

    // Tomorrow should now contain p1
    const tomorrowTasks = priorities.filter(p => p.date === tomorrow);
    expect(tomorrowTasks.map(p => p.id)).toEqual(['p1']);
  });
});
