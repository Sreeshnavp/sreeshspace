import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  X,
  CreditCard,
  Tag,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  Activity,
  ArrowRight
} from 'lucide-react';
import type { FinanceTransaction, FinancialInsights, FinanceCategory, TransactionType } from '../../types/finance';
import { CUTE_CATEGORY_ICONS } from '../../types/finance';
import { calculateFinanceInsights } from '../../utils/financeInsights';
import { todayKey, diffInDays } from '../../utils/dates';
import { playPopSound, triggerPartyPop } from '../../utils/delight';
import avatarImg from '../../assets/avatar.png';

interface FinanceDashboardProps {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  currency?: string;
  onChangeCurrency?: (symbol: string) => void;
  onOpenAddModal: (type?: TransactionType, category?: FinanceCategory) => void;
  onEditTransaction: (tx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSaveCategory: (cat: FinanceCategory) => void;
  onDeleteCategory: (id: string) => void;
  onQuickAdd?: (tx: Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  transactions,
  categories,
  currency = '₹',
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showBalance, setShowBalance] = useState<boolean>(true);
  
  // Detailed Chart Controls
  const [chartTimeframe, setChartTimeframe] = useState<'6m' | '30d'>('6m');
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // Category Manager Modal state
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catIconInput, setCatIconInput] = useState('🏷️');
  const [catTypeInput, setCatTypeInput] = useState<TransactionType>('expense');

  // Format Indian Rupee currency with standard en-IN grouping (e.g. ₹1,23,456.78)
  const formatRupees = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Month selector options
  const monthOptions = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      let label = d.toLocaleDateString('default', { month: 'long', year: 'numeric' }).toLowerCase();
      if (i === 0) label = 'This Month';
      else if (i === 1) label = 'Last Month';
      list.push({ key, label });
    }
    return list;
  }, []);

  const selectedMonthOption = monthOptions.find((m) => m.key === selectedMonthKey) || monthOptions[0];

  const insights: FinancialInsights = useMemo(() => {
    return calculateFinanceInsights(transactions, selectedMonthKey);
  }, [transactions, selectedMonthKey]);

  // Overall lifetime balance
  const overallBalance = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach((tx) => {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'income') inc += val;
      else exp += val;
    });
    return Math.round((inc - exp) * 100) / 100;
  }, [transactions]);

  // Lifetime Inflow & Outflow
  const lifetimeStats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    transactions.forEach((tx) => {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'income') totalIn += val;
      else totalOut += val;
    });
    return { totalIn, totalOut };
  }, [transactions]);

  // Category breakdown for statistics (Ranked & Detailed)
  const categoryBreakdown = useMemo(() => {
    const monthExpenses = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date && tx.date.startsWith(selectedMonthKey)
    );
    const map: Record<string, { name: string; icon: string; amount: number; count: number }> = {};
    let totalExp = 0;
    monthExpenses.forEach((tx) => {
      const val = Number(tx.amount) || 0;
      totalExp += val;
      if (!map[tx.category]) {
        map[tx.category] = { name: tx.category, icon: tx.categoryIcon || '💸', amount: 0, count: 0 };
      }
      map[tx.category].amount += val;
      map[tx.category].count += 1;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        pct: totalExp > 0 ? Math.round((item.amount / totalExp) * 100) : 0,
        avg: item.count > 0 ? Math.round((item.amount / item.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonthKey]);

  // Filtered transactions for feed
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (selectedMonthKey && (!tx.date || !tx.date.startsWith(selectedMonthKey))) {
          return false;
        }
        if (typeFilter !== 'all' && tx.type !== typeFilter) {
          return false;
        }
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCat = tx.category.toLowerCase().includes(q);
          const matchMerchant = (tx.merchant || '').toLowerCase().includes(q);
          const matchNote = (tx.note || '').toLowerCase().includes(q);
          const matchAmount = String(tx.amount).includes(q);
          return matchCat || matchMerchant || matchNote || matchAmount;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [transactions, selectedMonthKey, typeFilter, categoryFilter, searchQuery]);

  // Comprehensive Period Ledger Totals (For bottom area)
  const periodTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let maxExpense = 0;
    let incCount = 0;
    let expCount = 0;

    filteredTransactions.forEach((tx) => {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        income += val;
        incCount++;
      } else {
        expense += val;
        expCount++;
        if (val > maxExpense) maxExpense = val;
      }
    });

    const net = income - expense;
    const count = filteredTransactions.length;
    const avg = count > 0 ? (income + expense) / count : 0;
    const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;

    return {
      income,
      expense,
      net,
      count,
      incCount,
      expCount,
      avg,
      maxExpense,
      savingsRate,
    };
  }, [filteredTransactions]);

  // Group transactions by date with detailed income & expense sub-totals
  const groupedTransactions = useMemo(() => {
    const groups: {
      dateStr: string;
      label: string;
      income: number;
      expense: number;
      net: number;
      items: FinanceTransaction[];
    }[] = [];
    const dateMap: Record<
      string,
      { label: string; income: number; expense: number; net: number; items: FinanceTransaction[] }
    > = {};

    filteredTransactions.forEach((tx) => {
      const d = tx.date || todayKey();
      if (!dateMap[d]) {
        let label = d;
        const diff = diffInDays(todayKey(), d);
        if (diff === 0) label = 'Today';
        else if (diff === 1) label = 'Yesterday';
        else {
          const dObj = new Date(d + 'T00:00:00');
          label = dObj.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
        }

        dateMap[d] = {
          label,
          income: 0,
          expense: 0,
          net: 0,
          items: [],
        };
        groups.push({
          dateStr: d,
          label,
          income: 0,
          expense: 0,
          net: 0,
          items: dateMap[d].items,
        });
      }

      const val = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        dateMap[d].income += val;
      } else {
        dateMap[d].expense += val;
      }
      dateMap[d].items.push(tx);
    });

    groups.forEach((g) => {
      const entry = dateMap[g.dateStr];
      g.income = entry.income;
      g.expense = entry.expense;
      g.net = entry.income - entry.expense;
    });

    return groups;
  }, [filteredTransactions]);

  // 6-Month Detailed Trend Calculation
  const sixMonthTrendData = useMemo(() => {
    const data = insights.monthlyTrend || [];
    if (data.length === 0) return null;

    const width = 600;
    const height = 160;
    const padX = 45;
    const padY = 25;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const allValues = data.flatMap((d) => [d.income, d.expense]);
    const maxVal = Math.max(...allValues, 100);
    const gridLevels = [maxVal, maxVal * 0.66, maxVal * 0.33, 0];

    const calcPoints = (key: 'income' | 'expense') => {
      return data.map((item, idx) => {
        const x = padX + (idx / (data.length - 1)) * innerW;
        const normalized = item[key] / maxVal;
        const y = padY + innerH - normalized * innerH;
        return {
          ...item,
          x,
          y: Math.max(padY, Math.min(height - padY, y)),
          val: item[key],
          idx,
        };
      });
    };

    const makeSpline = (pts: { x: number; y: number }[]) => {
      if (pts.length <= 1) return pts[0] ? `M ${pts[0].x} ${pts[0].y}` : '';
      let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
      return path;
    };

    const incPts = calcPoints('income');
    const expPts = calcPoints('expense');

    const incPath = makeSpline(incPts);
    const expPath = makeSpline(expPts);

    const incArea = incPts.length > 0 ? `${incPath} L ${incPts[incPts.length - 1].x} ${height - padY} L ${incPts[0].x} ${height - padY} Z` : '';
    const expArea = expPts.length > 0 ? `${expPath} L ${expPts[expPts.length - 1].x} ${height - padY} L ${expPts[0].x} ${height - padY} Z` : '';

    // Summary metrics inside chart
    const peakInc = [...data].sort((a, b) => b.income - a.income)[0];
    const peakExp = [...data].sort((a, b) => b.expense - a.expense)[0];
    const totalTrendNet = data.reduce((acc, cur) => acc + (cur.income - cur.expense), 0);

    return {
      width,
      height,
      padX,
      padY,
      innerW,
      innerH,
      maxVal,
      gridLevels,
      incPts,
      expPts,
      incPath,
      expPath,
      incArea,
      expArea,
      peakInc,
      peakExp,
      totalTrendNet,
    };
  }, [insights.monthlyTrend]);

  // 30-Day Daily Detailed Activity Calculation
  const thirtyDayData = useMemo(() => {
    const days: { dateStr: string; label: string; dayNum: number; income: number; expense: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      let inc = 0;
      let exp = 0;
      transactions.forEach((tx) => {
        if (tx.date === key) {
          const val = Number(tx.amount) || 0;
          if (tx.type === 'income') inc += val;
          else exp += val;
        }
      });
      days.push({ dateStr: key, label, dayNum: d.getDate(), income: inc, expense: exp });
    }

    const allValues = days.flatMap((d) => [d.income, d.expense]);
    const maxVal = Math.max(...allValues, 50);

    return {
      days,
      maxVal,
      totalIncome: days.reduce((acc, cur) => acc + cur.income, 0),
      totalExpense: days.reduce((acc, cur) => acc + cur.expense, 0),
      activeDays: days.filter((d) => d.income > 0 || d.expense > 0).length,
    };
  }, [transactions]);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto pb-16">
      
      {/* 1. TOP HERO BANNER WITH USER AVATAR & DELIGHTFUL MOOD */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-subtle shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0 select-none">
            <img
              src={avatarImg}
              alt="Sreeshnav"
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-accent/30 shadow-soft"
            />
            <span className="absolute -bottom-1 -right-1 text-xs select-none">✨</span>
          </div>
          <div>
            <h2 className="font-black text-base sm:text-lg text-main flex items-center gap-2">
              <span>Personal Finance</span>
            </h2>
            <p className="text-[11px] text-muted font-medium flex items-center gap-1.5 mt-0.5">
              {insights.netSavings >= 0 ? (
                <>
                  <span className="text-emerald-500">🌸</span>
                  <span>
                    Cozy savings! Net +<span className="font-sans font-bold">₹</span>{formatRupees(insights.netSavings)} this month
                  </span>
                </>
              ) : (
                <>
                  <span className="text-amber-500">☕</span>
                  <span>
                    Spent <span className="font-sans font-bold">₹</span>{formatRupees(Math.abs(insights.netSavings))} over income. Stay mindful!
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Controls: Month Selector + Search + Add Entry Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Month selector */}
          <div className="relative inline-block">
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="appearance-none bg-sunken hover:bg-surface border border-subtle text-main font-bold text-xs pl-3 pr-7 py-2 rounded-2xl shadow-2xs cursor-pointer focus:outline-hidden"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
          </div>

          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => {
              playPopSound();
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery('');
            }}
            className={`p-2 rounded-2xl border border-subtle transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
              isSearchOpen || searchQuery
                ? 'bg-accent text-on-accent border-accent'
                : 'bg-surface hover:bg-sunken text-muted hover:text-main shadow-2xs'
            }`}
            title="Search payments"
          >
            <Search size={14} />
          </button>

          {/* Add Entry Modal Button */}
          <button
            type="button"
            onClick={() => {
              playPopSound();
              onOpenAddModal();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-accent text-on-accent font-bold text-xs shadow-soft hover:bg-accent-hover transition active:scale-95 cursor-pointer min-h-[38px]"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR (Collapsible) */}
      {isSearchOpen && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments by category, merchant, note, or amount..."
            autoFocus
            className="w-full bg-surface border border-subtle rounded-2xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-main placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-ring/40 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main p-1 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* 2. TOTAL LIFETIME BALANCE HERO CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-subtle shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-muted">
              <CreditCard size={14} />
              <span>Lifetime Net Balance</span>
              <button
                type="button"
                onClick={() => {
                  playPopSound();
                  setShowBalance(!showBalance);
                }}
                className="p-1 rounded-lg hover:bg-sunken text-muted hover:text-main transition cursor-pointer"
                title={showBalance ? 'Hide Balance' : 'Show Balance'}
              >
                {showBalance ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-main">
              {showBalance ? (
                <>
                  {overallBalance < 0 && '-'}
                  <span className="font-sans font-bold">₹</span>
                  {formatRupees(Math.abs(overallBalance))}
                </>
              ) : (
                <><span className="font-sans font-bold">₹</span>••••••••</>
              )}
            </h1>
            <p className="text-[11px] text-muted">
              {insights.savingsRate}% retained out of this month's earnings
            </p>
          </div>

          {/* Categories Shortcut */}
          <button
            type="button"
            onClick={() => {
              playPopSound();
              setIsCategoryManagerOpen(true);
            }}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-sunken hover:bg-surface border border-subtle text-xs font-bold text-main shadow-2xs cursor-pointer transition active:scale-95"
          >
            <Tag size={13} className="text-accent" />
            <span>Categories ({categories.length})</span>
          </button>
        </div>

        {/* Lifetime Flow Mini Meters */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-subtle/50 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-sunken/40">
            <span className="text-muted text-[11px] font-semibold">Total Earned</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              +<span className="font-sans font-bold">₹</span>{formatRupees(lifetimeStats.totalIn)}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-sunken/40">
            <span className="text-muted text-[11px] font-semibold">Total Spent</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              -<span className="font-sans font-bold">₹</span>{formatRupees(lifetimeStats.totalOut)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. SOFT CUTE DUO INFORMATION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Soft Matcha Mint Income Card */}
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-main shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft size={16} className="stroke-[2.5]" />
              <span>Income</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
              +{insights.savingsRate}% Saved
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-mono font-black text-emerald-700 dark:text-emerald-300">
            +<span className="font-sans font-bold">₹</span>{formatRupees(insights.totalIncome)}
          </h3>
          <p className="text-[11px] text-muted font-medium">
            Incoming funds for {selectedMonthOption.label}
          </p>
        </div>

        {/* Soft Sakura Rose Expense Card */}
        <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-main shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-200">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight size={16} className="stroke-[2.5]" />
              <span>Expenses</span>
            </span>
            <span className="text-[10px] bg-rose-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Net <span className="font-sans font-bold">₹</span>{formatRupees(Math.abs(insights.netSavings))}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-mono font-black text-rose-700 dark:text-rose-300">
            -<span className="font-sans font-bold">₹</span>{formatRupees(insights.totalExpenses)}
          </h3>
          <p className="text-[11px] text-muted font-medium">
            Outflow records for {selectedMonthOption.label}
          </p>
        </div>
      </div>

      {/* 4. HIGHLY DETAILED INTERACTIVE CHART */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-subtle shadow-soft space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-main flex items-center gap-2">
              <Activity size={16} className="text-accent" />
              <span>Financial Flow & Trajectory</span>
            </h3>
            <p className="text-[11px] text-muted font-medium">
              Detailed cashflow curves, reference levels, and interactive metrics
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Selector: 6M Trend vs 30D Daily */}
            <div className="flex items-center p-0.5 rounded-xl bg-sunken border border-subtle text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setChartTimeframe('6m');
                  playPopSound();
                }}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartTimeframe === '6m'
                    ? 'bg-surface text-main font-black shadow-2xs'
                    : 'text-muted hover:text-main'
                }`}
              >
                6-Month Trend
              </button>
              <button
                type="button"
                onClick={() => {
                  setChartTimeframe('30d');
                  playPopSound();
                }}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartTimeframe === '30d'
                    ? 'bg-surface text-main font-black shadow-2xs'
                    : 'text-muted hover:text-main'
                }`}
              >
                30-Day Activity
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs font-semibold px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Income Flow
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Expense Flow
            </span>
          </div>

          <span className="text-[11px] text-muted font-mono">
            Tap or hover points for details
          </span>
        </div>

        {/* CHART BODY */}
        {chartTimeframe === '6m' && sixMonthTrendData && (
          <div className="relative w-full h-[170px] pt-1 select-none">
            <svg
              viewBox={`0 0 ${sixMonthTrendData.width} ${sixMonthTrendData.height}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="detailedEmeraldWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="detailedRoseWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines with Rupee Reference Labels */}
              {sixMonthTrendData.gridLevels.map((lvlVal, idx) => {
                const norm = lvlVal / sixMonthTrendData.maxVal;
                const y = sixMonthTrendData.padY + sixMonthTrendData.innerH - norm * sixMonthTrendData.innerH;
                return (
                  <g key={idx}>
                    <line
                      x1={sixMonthTrendData.padX}
                      y1={y}
                      x2={sixMonthTrendData.width - sixMonthTrendData.padX}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.09"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={sixMonthTrendData.padX - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[9px] font-mono fill-muted select-none"
                    >
                      ₹{Math.round(lvlVal >= 1000 ? lvlVal / 1000 : lvlVal)}{lvlVal >= 1000 ? 'k' : ''}
                    </text>
                  </g>
                );
              })}

              {/* Income Area & Expense Area */}
              {sixMonthTrendData.incArea && (
                <path d={sixMonthTrendData.incArea} fill="url(#detailedEmeraldWave)" />
              )}
              {sixMonthTrendData.expArea && (
                <path d={sixMonthTrendData.expArea} fill="url(#detailedRoseWave)" />
              )}

              {/* Spline Path for Income */}
              {sixMonthTrendData.incPath && (
                <path
                  d={sixMonthTrendData.incPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Spline Path for Expense */}
              {sixMonthTrendData.expPath && (
                <path
                  d={sixMonthTrendData.expPath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Income Dots */}
              {sixMonthTrendData.incPts.map((pt, idx) => (
                <circle
                  key={`inc-${pt.monthKey}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#10b981"
                  stroke="white"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-transform hover:scale-140 shadow-xs"
                  onMouseEnter={() => setHoveredTrendIndex(idx)}
                  onMouseLeave={() => setHoveredTrendIndex(null)}
                  onClick={() => {
                    playPopSound();
                    setSelectedMonthKey(pt.monthKey);
                  }}
                />
              ))}

              {/* Expense Dots */}
              {sixMonthTrendData.expPts.map((pt, idx) => (
                <circle
                  key={`exp-${pt.monthKey}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  fill="#f43f5e"
                  stroke="white"
                  strokeWidth="2.5"
                  className="cursor-pointer transition-transform hover:scale-140 shadow-xs"
                  onMouseEnter={() => setHoveredTrendIndex(idx)}
                  onMouseLeave={() => setHoveredTrendIndex(null)}
                  onClick={() => {
                    playPopSound();
                    setSelectedMonthKey(pt.monthKey);
                  }}
                />
              ))}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredTrendIndex !== null && sixMonthTrendData.incPts[hoveredTrendIndex] && (
              <div
                className="absolute -top-10 transform -translate-x-1/2 pointer-events-none px-3 py-1.5 rounded-2xl bg-main text-surface text-[11px] font-mono font-bold shadow-raised z-20 whitespace-nowrap space-x-2"
                style={{
                  left: `${(sixMonthTrendData.incPts[hoveredTrendIndex].x / sixMonthTrendData.width) * 100}%`,
                }}
              >
                <span className="capitalize text-accent font-sans">{sixMonthTrendData.incPts[hoveredTrendIndex].monthLabel}:</span>
                <span className="text-emerald-400">+₹{formatRupees(sixMonthTrendData.incPts[hoveredTrendIndex].val)}</span>
                <span>|</span>
                <span className="text-rose-400">-₹{formatRupees(sixMonthTrendData.expPts[hoveredTrendIndex].val)}</span>
              </div>
            )}
          </div>
        )}

        {/* 30-Day Activity Bar Representation */}
        {chartTimeframe === '30d' && (
          <div className="space-y-2">
            <div className="flex items-end gap-1 h-[140px] px-2 pt-2 bg-sunken/30 rounded-2xl border border-subtle/40 overflow-x-auto scrollbar-none">
              {thirtyDayData.days.map((d) => {
                const incHeight = thirtyDayData.maxVal > 0 ? (d.income / thirtyDayData.maxVal) * 110 : 0;
                const expHeight = thirtyDayData.maxVal > 0 ? (d.expense / thirtyDayData.maxVal) * 110 : 0;
                const isToday = d.dateStr === todayKey();
                return (
                  <div
                    key={d.dateStr}
                    className="flex-1 min-w-[16px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    title={`${d.label}: +₹${d.income} | -₹${d.expense}`}
                  >
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      {d.income > 0 && (
                        <div
                          className="w-1.5 bg-emerald-500 rounded-t-sm transition-all"
                          style={{ height: `${Math.max(4, incHeight)}px` }}
                        />
                      )}
                      {d.expense > 0 && (
                        <div
                          className="w-1.5 bg-rose-500 rounded-t-sm transition-all"
                          style={{ height: `${Math.max(4, expHeight)}px` }}
                        />
                      )}
                      {d.income === 0 && d.expense === 0 && (
                        <div className="w-1 h-1 rounded-full bg-subtle mb-1" />
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-mono mt-1 ${
                        isToday ? 'text-accent font-extrabold underline' : 'text-muted'
                      }`}
                    >
                      {d.dayNum}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted px-1 font-mono">
              <span>30 Days Ago</span>
              <span>{thirtyDayData.activeDays} active spending/earning days</span>
              <span>Today</span>
            </div>
          </div>
        )}

        {/* Month Buttons Strip (When in 6M view) */}
        {chartTimeframe === '6m' && sixMonthTrendData && (
          <div className="flex justify-between px-6 text-[11px] font-mono font-semibold text-muted select-none pt-1">
            {insights.monthlyTrend.map((pt) => {
              const isSelected = pt.monthKey === selectedMonthKey;
              return (
                <button
                  key={pt.monthKey}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setSelectedMonthKey(pt.monthKey);
                  }}
                  className={`transition-colors cursor-pointer capitalize ${
                    isSelected
                      ? 'text-accent font-black underline underline-offset-4 decoration-2 decoration-accent'
                      : 'hover:text-main'
                  }`}
                >
                  {pt.monthLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* Detailed Chart Summary Metric Strip */}
        {sixMonthTrendData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-subtle/50 text-xs">
            <div className="p-2.5 rounded-2xl bg-sunken/50 border border-subtle/40">
              <span className="text-[10px] font-bold text-muted uppercase block">Peak Income</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                +<span className="font-sans font-bold">₹</span>{formatRupees(sixMonthTrendData.peakInc?.income || 0)}
              </span>
              <span className="text-[10px] text-muted block capitalize">
                {sixMonthTrendData.peakInc?.monthLabel}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-sunken/50 border border-subtle/40">
              <span className="text-[10px] font-bold text-muted uppercase block">Peak Expense</span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400 capitalize">
                -<span className="font-sans font-bold">₹</span>{formatRupees(sixMonthTrendData.peakExp?.expense || 0)}
              </span>
              <span className="text-[10px] text-muted block capitalize">
                {sixMonthTrendData.peakExp?.monthLabel}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-sunken/50 border border-subtle/40">
              <span className="text-[10px] font-bold text-muted uppercase block">Daily Avg Spend</span>
              <span className="font-mono font-bold text-main">
                <span className="font-sans font-bold">₹</span>{formatRupees(insights.avgDailySpend)}
              </span>
              <span className="text-[10px] text-muted block">This Month</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-sunken/50 border border-subtle/40">
              <span className="text-[10px] font-bold text-muted uppercase block">6-Month Net</span>
              <span
                className={`font-mono font-bold ${
                  sixMonthTrendData.totalTrendNet >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {sixMonthTrendData.totalTrendNet >= 0 ? '+' : '-'}
                <span className="font-sans font-bold">₹</span>
                {formatRupees(Math.abs(sixMonthTrendData.totalTrendNet))}
              </span>
              <span className="text-[10px] text-muted block">Cumulative</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. CATEGORY SPENDING BREAKDOWN METERS (DETAILED) */}
      {categoryBreakdown.length > 0 && (
        <div className="p-5 rounded-3xl bg-surface border border-subtle shadow-soft space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-main uppercase tracking-wider flex items-center gap-1.5">
              <span>Category Spending Breakdown</span>
            </h4>
            <span className="text-[11px] font-mono text-muted">
              {categoryBreakdown.length} active spending channels
            </span>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.map((cat, idx) => (
              <div key={cat.name} className="space-y-1.5 p-2 rounded-2xl hover:bg-sunken/40 transition">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sunken font-mono font-bold text-muted">
                      #{idx + 1}
                    </span>
                    <span className="text-base select-none">{cat.icon}</span>
                    <span className="font-bold text-main truncate">{cat.name}</span>
                    <span className="text-[10px] text-muted">({cat.count} payments)</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-main">
                      <span className="font-sans font-bold">₹</span>{formatRupees(cat.amount)}
                    </span>
                    <span className="text-[10px] text-muted ml-1.5">({cat.pct}%)</span>
                  </div>
                </div>

                <div className="w-full bg-sunken rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. COMPREHENSIVE PERIOD FINANCIAL LEDGER SUMMARY CARD ("MAKE THE TOTAL EVEN MORE") */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-subtle shadow-soft space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-main flex items-center gap-2">
            <span>📊 Period Ledger Totals & Summary</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sunken text-muted font-mono font-bold">
              {periodTotals.count} Transactions
            </span>
          </h4>
          <span className="text-xs font-mono font-bold text-main">
            Net:{' '}
            <span
              className={
                periodTotals.net >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }
            >
              {periodTotals.net >= 0 ? '+' : '-'}
              <span className="font-sans font-bold">₹</span>
              {formatRupees(Math.abs(periodTotals.net))}
            </span>
          </span>
        </div>

        {/* 4-Box Comprehensive Total Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-200">
              Total Inflow ({periodTotals.incCount})
            </p>
            <p className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              +<span className="font-sans font-bold">₹</span>{formatRupees(periodTotals.income)}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-200">
              Total Outflow ({periodTotals.expCount})
            </p>
            <p className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              -<span className="font-sans font-bold">₹</span>{formatRupees(periodTotals.expense)}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-sunken/70 border border-subtle/50">
            <p className="text-[10px] uppercase font-bold text-muted">Avg Transaction</p>
            <p className="text-sm sm:text-base font-black font-mono text-main mt-0.5">
              <span className="font-sans font-bold">₹</span>{formatRupees(periodTotals.avg)}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-sunken/70 border border-subtle/50">
            <p className="text-[10px] uppercase font-bold text-muted">Largest Spend</p>
            <p className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              -<span className="font-sans font-bold">₹</span>{formatRupees(periodTotals.maxExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* 7. RECENT PAYMENTS FEED WITH SPLIT SUB-TOTALS */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-2 px-1">
          <h3 className="font-extrabold text-xs sm:text-sm text-main uppercase tracking-wider">
            Payment History
          </h3>

          {/* Type Filter Pills: All | Expenses | Income */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-sunken border border-subtle text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setTypeFilter('all');
              }}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-surface text-main font-bold shadow-2xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              All ({filteredTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setTypeFilter('expense');
              }}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                typeFilter === 'expense'
                  ? 'bg-surface text-main font-bold shadow-2xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setTypeFilter('income');
              }}
              className={`px-3 py-1 rounded-xl transition cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-surface text-main font-bold shadow-2xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {groupedTransactions.length === 0 ? (
          <div className="bg-surface rounded-3xl p-8 border border-subtle text-center space-y-3 shadow-soft">
            <div className="w-12 h-12 rounded-2xl bg-sunken flex items-center justify-center mx-auto text-xl">
              💸
            </div>
            <h4 className="text-sm font-bold text-main">No payment records found</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {searchQuery
                ? 'Try another search query.'
                : 'Tap Add Entry above to record your first transaction in Indian Rupees.'}
            </p>
            <button
              type="button"
              onClick={() => onOpenAddModal()}
              className="px-4 py-2 rounded-2xl bg-accent text-on-accent font-bold text-xs shadow-soft hover:bg-accent-hover transition cursor-pointer"
            >
              + Record in Rupees
            </button>
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.dateStr} className="space-y-2">
              {/* Detailed Date Header with Inflow & Outflow Split Badges */}
              <div className="flex items-center justify-between px-2 text-xs font-mono">
                <span className="font-bold text-muted capitalize tracking-tight flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>{group.label}</span>
                </span>
                
                <div className="flex items-center gap-2 font-semibold">
                  {group.income > 0 && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      +<span className="font-sans font-bold">₹</span>{formatRupees(group.income)}
                    </span>
                  )}
                  {group.expense > 0 && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400">
                      -<span className="font-sans font-bold">₹</span>{formatRupees(group.expense)}
                    </span>
                  )}
                  <span className="text-[11px] text-muted">
                    Net: {group.net >= 0 ? '+' : '-'}
                    <span className="font-sans font-bold">₹</span>{formatRupees(Math.abs(group.net))}
                  </span>
                </div>
              </div>

              <div className="bg-surface rounded-3xl border border-subtle divide-y divide-subtle/50 shadow-soft overflow-hidden">
                {group.items.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 hover:bg-sunken/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-2xl bg-sunken border border-subtle flex items-center justify-center text-lg shrink-0 shadow-2xs">
                        {tx.categoryIcon || '💸'}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs sm:text-sm font-bold text-main truncate flex items-center gap-1">
                          <span>{tx.category}</span>
                          <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                        </p>
                        {(tx.merchant || tx.note) && (
                          <p className="text-[11px] text-muted truncate">
                            {tx.merchant || tx.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-extrabold font-mono ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        <span className="font-sans font-bold">₹</span>
                        {formatRupees(Number(tx.amount))}
                      </span>

                      <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            playPopSound();
                            onEditTransaction(tx);
                          }}
                          className="p-1.5 rounded-lg hover:bg-sunken text-muted hover:text-main cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            playPopSound();
                            if (window.confirm(`Delete ${tx.category} payment of ₹${tx.amount}?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-600 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Grand Total Ledger Footer */}
        {groupedTransactions.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-sunken/60 border border-subtle/50 text-center flex flex-col sm:flex-row items-center justify-between text-xs text-muted font-mono gap-1">
            <span>Grand Total for Filtered Records:</span>
            <div className="flex items-center gap-3 font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">
                In: +₹{formatRupees(periodTotals.income)}
              </span>
              <span>•</span>
              <span className="text-rose-600 dark:text-rose-400">
                Out: -₹{formatRupees(periodTotals.expense)}
              </span>
              <span>•</span>
              <span className="text-main">
                Net: {periodTotals.net >= 0 ? '+' : '-'}₹{formatRupees(Math.abs(periodTotals.net))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 8. CATEGORY MANAGER MODAL */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-main/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface text-main rounded-3xl border border-subtle shadow-raised p-5 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-accent" />
                <h3 className="font-extrabold text-sm sm:text-base text-main">
                  Manage Categories
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-sunken text-muted hover:text-main cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Category Form */}
            <div className="p-3.5 bg-sunken rounded-2xl border border-subtle space-y-3">
              <p className="text-xs font-bold text-main">
                {editingCategory ? `Edit "${editingCategory.name}"` : 'Create New Category'}
              </p>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-surface border border-subtle flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  {catIconInput}
                </div>
                <input
                  type="text"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="Category Name (e.g. Swiggy, Gym, Fuel)..."
                  className="flex-1 bg-surface border border-subtle rounded-xl px-3 py-2 text-xs font-semibold text-main focus:outline-hidden focus:ring-2 focus:ring-ring/40"
                />
                <button
                  type="button"
                  onClick={() => setCatTypeInput(catTypeInput === 'expense' ? 'income' : 'expense')}
                  className="px-2.5 py-2 rounded-xl bg-surface border border-subtle text-[11px] font-bold text-muted hover:text-main uppercase cursor-pointer"
                >
                  {catTypeInput}
                </button>
              </div>

              {/* Emoji Grid */}
              <div className="grid grid-cols-8 gap-1 max-h-24 overflow-y-auto p-1 bg-surface rounded-xl border border-subtle/50">
                {CUTE_CATEGORY_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      playPopSound();
                      setCatIconInput(emoji);
                    }}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-sm transition-transform cursor-pointer ${
                      catIconInput === emoji ? 'bg-accent text-on-accent scale-110 shadow-2xs' : 'hover:bg-sunken'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCatNameInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-surface hover:bg-sunken text-xs font-semibold text-muted cursor-pointer"
                  >
                    Clear Form
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!catNameInput.trim()) return;
                    playPopSound();
                    const updatedCat: FinanceCategory = {
                      id: editingCategory ? editingCategory.id : `fcat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                      name: catNameInput.trim(),
                      icon: catIconInput.trim() || '🏷️',
                      type: catTypeInput,
                    };
                    onSaveCategory(updatedCat);
                    setEditingCategory(null);
                    setCatNameInput('');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-accent text-on-accent text-xs font-bold shadow-soft hover:bg-accent-hover transition cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : '+ Add Category'}
                </button>
              </div>
            </div>

            {/* List of Existing Categories */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-60">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block px-1">
                Your Categories ({categories.length})
              </span>
              {categories.length === 0 ? (
                <p className="text-xs text-muted px-1 py-2">
                  No custom categories yet. Use the form above to add your own!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-surface border border-subtle text-xs font-semibold group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{cat.icon}</span>
                        <div className="min-w-0">
                          <p className="truncate text-main font-bold">{cat.name}</p>
                          <p className="text-[10px] text-muted capitalize">{cat.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatNameInput(cat.name);
                            setCatIconInput(cat.icon);
                            setCatTypeInput(cat.type);
                          }}
                          className="p-1 rounded-lg hover:bg-sunken text-muted hover:text-main cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${cat.name}" category?`)) {
                              playPopSound();
                              onDeleteCategory(cat.id);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-600 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-subtle flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="px-4 py-2 rounded-2xl bg-sunken hover:bg-surface border border-subtle text-xs font-bold text-main cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
