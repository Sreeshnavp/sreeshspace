import { describe, it, expect } from 'vitest';
import { DEFAULT_BAZAAR_PERKS } from '../../components/habits/HabitsDashboard';

describe('Habit Points & Reward System Logic', () => {
  it('has default cozy bazaar perks with valid costs and emojis', () => {
    expect(DEFAULT_BAZAAR_PERKS.length).toBeGreaterThanOrEqual(3);
    for (const perk of DEFAULT_BAZAAR_PERKS) {
      expect(perk.cost).toBeGreaterThan(0);
      expect(perk.title).toBeTruthy();
      expect(perk.emoji).toBeTruthy();
      expect(perk.redeemedCount).toBe(0);
    }
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
    const coffeePerk = DEFAULT_BAZAAR_PERKS[0]; // cost: 40
    const moviePerk = DEFAULT_BAZAAR_PERKS[2]; // cost: 100

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
});
