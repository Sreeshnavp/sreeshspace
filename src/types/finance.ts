export type TransactionType = 'expense' | 'income';

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  categoryIcon: string;
  merchant?: string;
  note?: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategoryPreset {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export const DEFAULT_FINANCE_CATEGORIES: FinanceCategoryPreset[] = [
  // Expenses
  { id: 'cat-food', name: 'Food & Dining', icon: '🍔', type: 'expense' },
  { id: 'cat-coffee', name: 'Coffee & Drinks', icon: '☕', type: 'expense' },
  { id: 'cat-groceries', name: 'Groceries', icon: '🛒', type: 'expense' },
  { id: 'cat-pet', name: 'Pet Care', icon: '🐶', type: 'expense' },
  { id: 'cat-commute', name: 'Commute & Travel', icon: '🚕', type: 'expense' },
  { id: 'cat-house', name: 'House & Repairs', icon: '🛠️', type: 'expense' },
  { id: 'cat-fun', name: 'Fun & Leisure', icon: '🎬', type: 'expense' },
  { id: 'cat-shopping', name: 'Shopping', icon: '🛍️', type: 'expense' },
  { id: 'cat-bills', name: 'Bills & Utilities', icon: '⚡', type: 'expense' },
  { id: 'cat-health', name: 'Health & Fitness', icon: '💊', type: 'expense' },
  { id: 'cat-other-exp', name: 'Other Expense', icon: '🏷️', type: 'expense' },

  // Income
  { id: 'cat-salary', name: 'Salary & Wages', icon: '💼', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance & Side Gig', icon: '💻', type: 'income' },
  { id: 'cat-invest', name: 'Investments & Returns', icon: '📈', type: 'income' },
  { id: 'cat-gift', name: 'Gifts & Rewards', icon: '🎁', type: 'income' },
  { id: 'cat-other-inc', name: 'Other Income', icon: '💰', type: 'income' },
];

export interface FinancialInsights {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage 0 - 100
  topExpenseCategory: { name: string; icon: string; amount: number; pct: number } | null;
  avgDailySpend: number;
  monthlyTrend: {
    monthKey: string; // YYYY-MM
    monthLabel: string; // 'Jul', 'Aug', etc.
    income: number;
    expense: number;
    net: number;
  }[];
  suggestions: {
    id: string;
    type: 'positive' | 'warning' | 'tip';
    title: string;
    message: string;
  }[];
}
