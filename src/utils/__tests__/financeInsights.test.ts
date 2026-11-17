import { describe, it, expect } from 'vitest';
import { calculateFinanceInsights } from '../financeInsights';
import type { FinanceTransaction } from '../../types/finance';

describe('calculateFinanceInsights', () => {
  it('returns clean zero state when transactions list is empty', () => {
    const insights = calculateFinanceInsights([], '2026-11');
    expect(insights.totalIncome).toBe(0);
    expect(insights.totalExpenses).toBe(0);
    expect(insights.netSavings).toBe(0);
    expect(insights.savingsRate).toBe(0);
    expect(insights.topExpenseCategory).toBeNull();
    expect(insights.avgDailySpend).toBe(0);
    expect(insights.monthlyTrend).toHaveLength(6);
    expect(insights.suggestions.length).toBeGreaterThan(0);
    expect(insights.suggestions[0].id).toBe('sug-first-entry');
  });

  it('correctly calculates income, expenses, and savings rate', () => {
    const mockTxs: FinanceTransaction[] = [
      {
        id: 'tx-1',
        type: 'income',
        amount: 2500,
        category: 'Salary & Wages',
        categoryIcon: '💼',
        date: '2026-11-01',
        createdAt: '2026-11-01T10:00:00Z',
        updatedAt: '2026-11-01T10:00:00Z',
      },
      {
        id: 'tx-2',
        type: 'expense',
        amount: 179.99,
        category: 'Pet Care',
        categoryIcon: '🐶',
        merchant: 'Petco',
        date: '2026-11-05',
        createdAt: '2026-11-05T10:00:00Z',
        updatedAt: '2026-11-05T10:00:00Z',
      },
      {
        id: 'tx-3',
        type: 'expense',
        amount: 8.95,
        category: 'Coffee & Drinks',
        categoryIcon: '☕',
        merchant: 'Starbucks',
        date: '2026-11-06',
        createdAt: '2026-11-06T10:00:00Z',
        updatedAt: '2026-11-06T10:00:00Z',
      },
    ];

    const insights = calculateFinanceInsights(mockTxs, '2026-11');
    expect(insights.totalIncome).toBe(2500);
    expect(insights.totalExpenses).toBe(188.94);
    expect(insights.netSavings).toBe(2311.06);
    expect(insights.savingsRate).toBe(92);
    expect(insights.topExpenseCategory?.name).toBe('Pet Care');
    expect(insights.topExpenseCategory?.amount).toBe(179.99);
    // Savings rate >= 30% triggers positive suggestion
    const highSavingSug = insights.suggestions.find((s) => s.id === 'sug-high-savings');
    expect(highSavingSug).toBeDefined();
    expect(highSavingSug?.type).toBe('positive');
  });

  it('detects deficit and warns when expenses exceed income', () => {
    const mockTxs: FinanceTransaction[] = [
      {
        id: 'tx-1',
        type: 'income',
        amount: 100,
        category: 'Gift',
        categoryIcon: '🎁',
        date: '2026-11-01',
        createdAt: '2026-11-01T10:00:00Z',
        updatedAt: '2026-11-01T10:00:00Z',
      },
      {
        id: 'tx-2',
        type: 'expense',
        amount: 350,
        category: 'House & Repairs',
        categoryIcon: '🛠️',
        date: '2026-11-02',
        createdAt: '2026-11-02T10:00:00Z',
        updatedAt: '2026-11-02T10:00:00Z',
      },
    ];

    const insights = calculateFinanceInsights(mockTxs, '2026-11');
    expect(insights.netSavings).toBe(-250);
    const deficitSug = insights.suggestions.find((s) => s.id === 'sug-deficit');
    expect(deficitSug).toBeDefined();
    expect(deficitSug?.type).toBe('warning');
  });
});
