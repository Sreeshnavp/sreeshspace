import type { FinanceTransaction, FinancialInsights } from '../types/finance';

/**
 * Calculates comprehensive financial metrics, trends, and smart actionable suggestions
 * for a given list of transactions and selected month (e.g. '2026-11').
 */
export function calculateFinanceInsights(
  transactions: FinanceTransaction[],
  selectedMonthKey?: string // 'YYYY-MM'
): FinancialInsights {
  const now = new Date();
  const currentMonthKey = selectedMonthKey || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter transactions for the selected month
  const monthTransactions = transactions.filter(
    (tx) => tx.date && tx.date.startsWith(currentMonthKey)
  );

  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpendMap: Record<string, { name: string; icon: string; amount: number }> = {};

  monthTransactions.forEach((tx) => {
    const val = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += val;
    } else {
      totalExpenses += val;
      if (!categorySpendMap[tx.category]) {
        categorySpendMap[tx.category] = {
          name: tx.category,
          icon: tx.categoryIcon || '💸',
          amount: 0,
        };
      }
      categorySpendMap[tx.category].amount += val;
    }
  });

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // Find top expense category
  const sortedCategories = Object.values(categorySpendMap).sort((a, b) => b.amount - a.amount);
  const topCat = sortedCategories[0];
  const topExpenseCategory = topCat && totalExpenses > 0
    ? {
        name: topCat.name,
        icon: topCat.icon,
        amount: Math.round(topCat.amount * 100) / 100,
        pct: Math.round((topCat.amount / totalExpenses) * 100),
      }
    : null;

  // Average daily spend for the month so far
  const [yearStr, monthStr] = currentMonthKey.split('-');
  const daysInMonth = new Date(Number(yearStr), Number(monthStr), 0).getDate();
  const currentDay = now.getFullYear() === Number(yearStr) && (now.getMonth() + 1) === Number(monthStr)
    ? now.getDate()
    : daysInMonth;
  const avgDailySpend = currentDay > 0 ? Math.round((totalExpenses / currentDay) * 100) / 100 : 0;

  // 6-Month Historical Trend for Wave Line Chart (Jul, Aug, Sep, Oct, Nov, Dec)
  const monthlyTrend: FinancialInsights['monthlyTrend'] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Number(yearStr), Number(monthStr) - 1 - i, 1);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mLabel = d.toLocaleString('default', { month: 'short' }).toLowerCase();

    let mInc = 0;
    let mExp = 0;
    transactions.forEach((tx) => {
      if (tx.date && tx.date.startsWith(mKey)) {
        const val = Number(tx.amount) || 0;
        if (tx.type === 'income') mInc += val;
        else mExp += val;
      }
    });

    monthlyTrend.push({
      monthKey: mKey,
      monthLabel: mLabel,
      income: Math.round(mInc * 100) / 100,
      expense: Math.round(mExp * 100) / 100,
      net: Math.round((mInc - mExp) * 100) / 100,
    });
  }

  // Generate Smart Actionable Insights & Suggestions
  const suggestions: FinancialInsights['suggestions'] = [];

  if (monthTransactions.length === 0) {
    suggestions.push({
      id: 'sug-first-entry',
      type: 'tip',
      title: 'Start your financial journey',
      message: 'Tap the "+" keypad to log your first income or expense for this month. Simple records build wealth!',
    });
  } else {
    // 1. Savings rate evaluation
    if (totalIncome > 0 && netSavings >= 0) {
      if (savingsRate >= 30) {
        suggestions.push({
          id: 'sug-high-savings',
          type: 'positive',
          title: `Superb saving pace! (${savingsRate}%)`,
          message: `You are retaining $${netSavings.toFixed(2)} of your income this month. You're well on track for your financial goals!`,
        });
      } else {
        suggestions.push({
          id: 'sug-mod-savings',
          type: 'tip',
          title: `Saving ${savingsRate}% of income`,
          message: `Aiming for a 20-30% savings cushion gives peace of mind. Trimming secondary expenses can help boost this.`,
        });
      }
    } else if (totalExpenses > totalIncome && totalIncome > 0) {
      suggestions.push({
        id: 'sug-deficit',
        type: 'warning',
        title: 'Spending exceeds income',
        message: `Expenses exceed incoming funds by $${Math.abs(netSavings).toFixed(2)}. Review discretionary purchases to rebalance.`,
      });
    }

    // 2. Top Category analysis
    if (topExpenseCategory && topExpenseCategory.pct >= 30) {
      suggestions.push({
        id: 'sug-top-cat',
        type: 'warning',
        title: `Heavy spend on ${topExpenseCategory.name}`,
        message: `${topExpenseCategory.icon} ${topExpenseCategory.name} accounts for ${topExpenseCategory.pct}% ($${topExpenseCategory.amount.toFixed(2)}) of all spending this month.`,
      });
    }

    // 3. Daily spend pacing
    if (avgDailySpend > 0) {
      const projectedMonth = avgDailySpend * daysInMonth;
      suggestions.push({
        id: 'sug-pacing',
        type: 'tip',
        title: `Daily average: $${avgDailySpend.toFixed(2)} / day`,
        message: `At this pacing, month-end spending will project around $${projectedMonth.toFixed(2)}.`,
      });
    }
  }

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netSavings: Math.round(netSavings * 100) / 100,
    savingsRate,
    topExpenseCategory,
    avgDailySpend,
    monthlyTrend,
    suggestions,
  };
}
