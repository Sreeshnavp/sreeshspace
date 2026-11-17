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

export interface FinanceCategory {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  color?: string;
  isDefault?: boolean;
}

export type FinanceCategoryPreset = FinanceCategory;

export const DEFAULT_FINANCE_CATEGORIES: FinanceCategory[] = [];

export const CUTE_CATEGORY_ICONS = [
  '🍔', '☕', '🧋', '🍕', '🍰', '🥑', '🛒', '🚕', '🚌', '✈️',
  '⛽', '🛍️', '👗', '🎮', '🎧', '📚', '💊', '🏋️', '💇', '🐾',
  '🏠', '⚡', '💻', '💼', '📈', '🎁', '💰', '🍿', '🍣', '🌱',
  '🎨', '🏖️', '🎟️', '🚲', '🩺', '💡', '✨', '💎', '🧾', '🪙'
];

export const CATEGORY_QUICK_NOTES: Record<string, string[]> = {
  'Food & Dining': ['Lunch', 'Dinner', 'Breakfast', 'Snacks', 'Restaurant', 'Takeout'],
  'Coffee & Drinks': ['Starbucks', 'Boba / Tea', 'Latte', 'Café', 'Juice Bar'],
  'Groceries': ['Supermarket', 'Costco', 'Trader Joe\'s', 'Fruits & Veggies', 'Snacks'],
  'Pet Care': ['Vet visit', 'Pet food', 'Toys', 'Grooming', 'Supplements'],
  'Commute & Travel': ['Uber / Lyft', 'Gas / Fuel', 'Metro / Subway', 'Parking', 'Flight / Train'],
  'House & Repairs': ['Rent', 'Plumber', 'Hardware store', 'Furniture', 'Maintenance'],
  'Fun & Leisure': ['Movies / Cinema', 'Video Games', 'Concert', 'Books', 'Outing with friends'],
  'Shopping': ['Amazon', 'Clothing', 'Electronics', 'Skincare', 'Gifts'],
  'Bills & Utilities': ['Electricity', 'Water', 'Internet / Wi-Fi', 'Phone bill', 'Subscription'],
  'Health & Fitness': ['Gym membership', 'Pharmacy / Meds', 'Doctor consultation', 'Supplements'],
  'Salary & Wages': ['Monthly salary', 'Bonus', 'Overtime', 'Biweekly paycheck'],
  'Freelance & Side Gig': ['Client project', 'Consulting', 'Design work', 'Coding gig'],
  'Investments & Returns': ['Dividends', 'Stock sale', 'Crypto', 'Interest payout'],
  'Gifts & Rewards': ['Birthday gift', 'Cashback', 'Holiday bonus', 'Reward voucher'],
};

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
