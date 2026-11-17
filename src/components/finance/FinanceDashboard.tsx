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
  Calendar,
  Wallet,
  PieChart,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Info,
  Tag,
  DollarSign,
  Layers
} from 'lucide-react';
import type { FinanceTransaction, FinancialInsights, FinanceCategory, TransactionType } from '../../types/finance';
import { CUTE_CATEGORY_ICONS } from '../../types/finance';
import { calculateFinanceInsights } from '../../utils/financeInsights';
import { todayKey, diffInDays } from '../../utils/dates';
import { playPopSound } from '../../utils/delight';

interface FinanceDashboardProps {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  currency?: string;
  onChangeCurrency?: (symbol: string) => void;
  onOpenAddModal: () => void;
  onEditTransaction: (tx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSaveCategory: (cat: FinanceCategory) => void;
  onDeleteCategory: (id: string) => void;
}

const CURRENCY_OPTIONS = ['$', '₹', '€', '£', '¥', '₩'];

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  transactions,
  categories,
  currency = '$',
  onChangeCurrency,
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
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // Category Manager Modal state
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catIconInput, setCatIconInput] = useState('🏷️');
  const [catTypeInput, setCatTypeInput] = useState<TransactionType>('expense');

  // Month selector options (past 12 months)
  const monthOptions = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      let label = d.toLocaleDateString('default', { month: 'long', year: 'numeric' }).toLowerCase();
      if (i === 0) label = 'this month';
      else if (i === 1) label = 'last month';
      list.push({ key, label });
    }
    return list;
  }, []);

  // Compute insights & metrics for the selected month
  const insights: FinancialInsights = useMemo(() => {
    return calculateFinanceInsights(transactions, selectedMonthKey);
  }, [transactions, selectedMonthKey]);

  // Breakdown of expenses by category for the visual category distribution bar
  const categoryBreakdown = useMemo(() => {
    const monthExpenses = transactions.filter(
      (tx) => tx.type === 'expense' && tx.date && tx.date.startsWith(selectedMonthKey)
    );
    const map: Record<string, { name: string; icon: string; amount: number }> = {};
    let totalExp = 0;
    monthExpenses.forEach((tx) => {
      const val = Number(tx.amount) || 0;
      totalExp += val;
      if (!map[tx.category]) {
        map[tx.category] = { name: tx.category, icon: tx.categoryIcon || '💸', amount: 0 };
      }
      map[tx.category].amount += val;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        pct: totalExp > 0 ? Math.round((item.amount / totalExp) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedMonthKey]);

  // Filtered transactions for the list
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Month filter
        if (selectedMonthKey && (!tx.date || !tx.date.startsWith(selectedMonthKey))) {
          return false;
        }
        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) {
          return false;
        }
        // Category filter
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
          return false;
        }
        // Search filter
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

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { dateStr: string; label: string; subtotal: number; items: FinanceTransaction[] }[] = [];
    const dateMap: Record<string, { label: string; subtotal: number; items: FinanceTransaction[] }> = {};

    filteredTransactions.forEach((tx) => {
      const d = tx.date || todayKey();
      if (!dateMap[d]) {
        let label = d;
        const diff = diffInDays(todayKey(), d);
        if (diff === 0) label = 'today';
        else if (diff === 1) label = 'yesterday';
        else {
          const dObj = new Date(d + 'T00:00:00');
          label = dObj.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' }).toLowerCase();
        }

        dateMap[d] = {
          label,
          subtotal: 0,
          items: [],
        };
        groups.push({ dateStr: d, label, subtotal: 0, items: dateMap[d].items });
      }

      const val = Number(tx.amount) || 0;
      if (tx.type === 'expense') {
        dateMap[d].subtotal -= val;
      } else {
        dateMap[d].subtotal += val;
      }
      dateMap[d].items.push(tx);
    });

    groups.forEach((g) => {
      g.subtotal = dateMap[g.dateStr].subtotal;
    });

    return groups;
  }, [filteredTransactions]);

  // Compute SVG Spline Curve for the 6-Month Trend
  const trendPoints = useMemo(() => {
    const data = insights.monthlyTrend;
    if (!data || data.length === 0) return [];

    const width = 500;
    const height = 120;
    const padX = 40;
    const padY = 24;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const values = data.map((d) => d.expense);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 100);
    const range = maxVal - minVal || 1;

    return data.map((item, idx) => {
      const x = padX + (idx / (data.length - 1)) * innerW;
      const normalized = (item.expense - minVal) / range;
      const y = padY + innerH - normalized * innerH;
      return {
        ...item,
        x,
        y: Math.max(padY, Math.min(height - padY, y)),
        index: idx,
      };
    });
  }, [insights.monthlyTrend]);

  // Smooth spline curve path generator using cubic bezier
  const trendPath = useMemo(() => {
    if (trendPoints.length === 0) return '';
    if (trendPoints.length === 1) return `M ${trendPoints[0].x} ${trendPoints[0].y}`;

    let path = `M ${trendPoints[0].x.toFixed(1)} ${trendPoints[0].y.toFixed(1)}`;
    for (let i = 0; i < trendPoints.length - 1; i++) {
      const p0 = trendPoints[i === 0 ? 0 : i - 1];
      const p1 = trendPoints[i];
      const p2 = trendPoints[i + 1];
      const p3 = trendPoints[i + 2 < trendPoints.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  }, [trendPoints]);

  const trendAreaPath = useMemo(() => {
    if (trendPoints.length === 0 || !trendPath) return '';
    const last = trendPoints[trendPoints.length - 1];
    const first = trendPoints[0];
    return `${trendPath} L ${last.x.toFixed(1)} 130 L ${first.x.toFixed(1)} 130 Z`;
  }, [trendPath, trendPoints]);

  const selectedMonthOption = monthOptions.find((m) => m.key === selectedMonthKey) || monthOptions[0];

  // Income vs Expense Percentages for visual comparison bar
  const totalFlow = insights.totalIncome + insights.totalExpenses;
  const incomePct = totalFlow > 0 ? Math.round((insights.totalIncome / totalFlow) * 100) : 50;
  const expensePct = totalFlow > 0 ? 100 - incomePct : 50;

  // Category Manager Handlers
  const handleOpenCategoryManager = () => {
    playPopSound();
    setIsCategoryManagerOpen(true);
    setEditingCategory(null);
  };

  const handleStartCreateCategory = () => {
    playPopSound();
    setEditingCategory(null);
    setCatNameInput('');
    setCatIconInput('🏷️');
    setCatTypeInput('expense');
  };

  const handleStartEditCategory = (cat: FinanceCategory) => {
    playPopSound();
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setCatIconInput(cat.icon);
    setCatTypeInput(cat.type);
  };

  const handleSaveCategorySubmit = () => {
    if (!catNameInput.trim()) {
      alert('Please enter a category name');
      return;
    }
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
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto pb-16">
      
      {/* 1. MIBU MINIMAL HEADER BAR */}
      <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
        {/* Month Dropdown Pill & Currency Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative inline-block">
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="appearance-none bg-surface/90 hover:bg-surface border border-subtle/80 text-main font-semibold text-xs sm:text-sm pl-3.5 pr-8 py-1.5 rounded-full shadow-2xs cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
            />
          </div>

          {/* Quick Currency Selector */}
          {onChangeCurrency && (
            <div className="relative inline-block">
              <select
                value={currency}
                onChange={(e) => {
                  playPopSound();
                  onChangeCurrency(e.target.value);
                }}
                className="appearance-none bg-surface/90 hover:bg-surface border border-subtle/80 text-main font-mono font-bold text-xs pl-2.5 pr-5 py-1.5 rounded-full shadow-2xs cursor-pointer focus:outline-none"
                title="Change Currency"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
              />
            </div>
          )}
        </div>

        {/* Action Controls: Categories Manager, Search, Record */}
        <div className="flex items-center gap-2">
          {/* Categories Manager Button */}
          <button
            onClick={handleOpenCategoryManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/90 hover:bg-sunken border border-subtle/70 text-xs font-bold text-main shadow-2xs transition-all cursor-pointer min-h-[38px]"
            title="Manage Categories"
          >
            <Tag size={13} className="text-accent" />
            <span className="hidden sm:inline">Categories</span>
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => {
              playPopSound();
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery('');
            }}
            className={`p-2 rounded-full border border-subtle/70 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
              isSearchOpen || searchQuery
                ? 'bg-accent text-accent-fg border-accent'
                : 'bg-surface/90 hover:bg-sunken text-muted hover:text-main shadow-2xs'
            }`}
            title="Search transactions"
            aria-label="Search transactions"
          >
            <Search size={14} className="stroke-[2.2]" />
          </button>

          {/* Record Button */}
          <button
            onClick={() => {
              playPopSound();
              onOpenAddModal();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent hover:bg-accent-hover text-accent-fg font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer min-h-[38px]"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Record</span>
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
            placeholder="Search by category, merchant, note, or amount..."
            autoFocus
            className="w-full bg-surface border border-subtle rounded-2xl pl-9 pr-9 py-2 text-xs sm:text-sm text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main p-1 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* 2. MIBU HERO BALANCE CARD & WAVE CHART */}
      <div className="bg-surface/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-subtle/80 shadow-xs relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Cute Financial Health Status Badge */}
        <div className="text-center space-y-1 py-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sunken/80 border border-subtle/80 text-[11px] font-bold text-muted">
            {filteredTransactions.length === 0 ? (
              <span>🌸 Fresh Canvas • Ready for records</span>
            ) : insights.savingsRate >= 30 ? (
              <span className="text-emerald-600 dark:text-emerald-400">🟢 Stellar Savings ({insights.savingsRate}%)</span>
            ) : insights.netSavings >= 0 ? (
              <span className="text-accent">✨ Balanced Cash Flow</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400">⚠️ Spending higher than Income</span>
            )}
          </div>

          <p className="text-[11px] font-bold tracking-wider text-muted uppercase pt-1">
            Net Cash Flow ({selectedMonthOption.label})
          </p>

          {/* Big Balance Amount */}
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-main font-mono">
              {insights.netSavings >= 0 ? '+' : '-'}{currency}{Math.abs(insights.netSavings).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h1>
          </div>

          {/* Visual Income vs Expense Ratio Split Bar */}
          {totalFlow > 0 && (
            <div className="pt-2 max-w-xs mx-auto space-y-1">
              <div className="h-2 w-full bg-sunken rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${incomePct}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${expensePct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono font-bold text-muted px-1">
                <span className="text-emerald-600 dark:text-emerald-400">{incomePct}% in</span>
                <span className="text-rose-600 dark:text-rose-400">{expensePct}% out</span>
              </div>
            </div>
          )}

          {/* Income vs Expenses Mini Pills */}
          <div className="flex items-center justify-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
              <ArrowDownLeft size={12} className="stroke-[2.5]" />
              <span>+{currency}{insights.totalIncome.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/20">
              <ArrowUpRight size={12} className="stroke-[2.5]" />
              <span>-{currency}{insights.totalExpenses.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 3. SMOOTH WAVE TREND CHART */}
        <div className="pt-6 sm:pt-8 pb-1">
          <div className="relative w-full h-[130px] sm:h-[140px]">
            <svg
              viewBox="0 0 500 130"
              className="w-full h-full overflow-visible select-none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {trendAreaPath && (
                <path
                  d={trendAreaPath}
                  fill="url(#waveGradient)"
                  className="transition-all duration-300"
                />
              )}

              {trendPath && (
                <path
                  d={trendPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-main/90 transition-all duration-300"
                />
              )}

              {trendPoints.map((pt, idx) => {
                const isSelected = pt.monthKey === selectedMonthKey;
                const isHovered = hoveredTrendIndex === idx;

                return (
                  <g
                    key={pt.monthKey}
                    className="cursor-pointer transition-transform hover:scale-110"
                    onMouseEnter={() => setHoveredTrendIndex(idx)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                    onClick={() => {
                      playPopSound();
                      setSelectedMonthKey(pt.monthKey);
                    }}
                  >
                    {isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8.5"
                        fill="currentColor"
                        className="text-surface"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? '5.5' : isHovered ? '4.5' : '3.5'}
                      fill="currentColor"
                      className={isSelected ? 'text-main' : isHovered ? 'text-accent' : 'text-main/70'}
                      stroke="var(--surface)"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </svg>

            {hoveredTrendIndex !== null && trendPoints[hoveredTrendIndex] && (
              <div
                className="absolute -top-7 transform -translate-x-1/2 pointer-events-none px-2.5 py-1 rounded-lg bg-main text-surface text-[10px] font-mono font-bold shadow-md z-10 whitespace-nowrap"
                style={{ left: `${(trendPoints[hoveredTrendIndex].x / 500) * 100}%` }}
              >
                {currency}{trendPoints[hoveredTrendIndex].expense.toFixed(0)} spent
              </div>
            )}
          </div>

          <div className="flex justify-between px-3 text-[11px] font-mono font-semibold text-muted select-none">
            {trendPoints.map((pt) => {
              const isSelected = pt.monthKey === selectedMonthKey;
              return (
                <button
                  key={pt.monthKey}
                  onClick={() => {
                    playPopSound();
                    setSelectedMonthKey(pt.monthKey);
                  }}
                  className={`transition-colors cursor-pointer capitalize ${
                    isSelected
                      ? 'text-main font-extrabold underline underline-offset-4 decoration-2 decoration-accent'
                      : 'hover:text-main'
                  }`}
                >
                  {pt.monthLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. CUTE CATEGORY BREAKDOWN METERS (If expenses exist) */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-sunken/60 rounded-3xl p-4 sm:p-5 border border-subtle/80 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs sm:text-sm font-extrabold text-main uppercase tracking-wider flex items-center gap-1.5">
              <span>Spending Breakdown</span>
            </h3>
            <span className="text-[11px] font-mono text-muted">
              {categoryBreakdown.length} categories
            </span>
          </div>

          <div className="space-y-2">
            {categoryBreakdown.slice(0, 4).map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 truncate">
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="font-mono text-muted">
                    {currency}{cat.amount.toFixed(2)} ({cat.pct}%)
                  </span>
                </div>
                <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SMART FINANCIAL INSIGHTS & SUGGESTIONS */}
      <div className="bg-sunken/60 rounded-3xl p-4 sm:p-5 border border-subtle/80 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent stroke-[2.3]" />
            <h3 className="text-xs sm:text-sm font-extrabold text-main uppercase tracking-wider">
              Smart Financial Insights
            </h3>
          </div>
          {insights.savingsRate > 0 && (
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface border border-subtle text-accent-text">
              {insights.savingsRate}% saved
            </span>
          )}
        </div>

        {/* Actionable Suggestion Cards */}
        {insights.suggestions.length > 0 && (
          <div className="space-y-2 pt-1">
            {insights.suggestions.map((sug) => (
              <div
                key={sug.id}
                className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs transition-all ${
                  sug.type === 'positive'
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100'
                    : sug.type === 'warning'
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-100'
                    : 'bg-surface/80 border-subtle text-main'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {sug.type === 'positive' ? (
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                  ) : sug.type === 'warning' ? (
                    <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Lightbulb size={14} className="text-accent" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-[11px]">{sug.title}</p>
                  <p className="text-[11px] opacity-80 leading-relaxed">{sug.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. FILTER CONTROLS (Type + Category Pills) */}
      <div className="space-y-2 px-1 pt-2">
        <div className="flex items-center justify-between gap-2">
          {/* Segmented Type Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-sunken border border-subtle text-xs font-semibold">
            <button
              onClick={() => {
                playPopSound();
                setTypeFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer min-h-[36px] ${
                typeFilter === 'all'
                  ? 'bg-surface text-main font-bold shadow-2xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              All ({filteredTransactions.length})
            </button>
            <button
              onClick={() => {
                playPopSound();
                setTypeFilter('expense');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer min-h-[36px] ${
                typeFilter === 'expense'
                  ? 'bg-surface text-main font-bold shadow-2xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => {
                playPopSound();
                setTypeFilter('income');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer min-h-[36px] ${
                typeFilter === 'income'
                  ? 'bg-surface text-main font-bold shadow-2xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              Income
            </button>
          </div>

          <button
            onClick={() => {
              playPopSound();
              onOpenAddModal();
            }}
            className="flex items-center gap-1 text-xs font-bold text-accent hover:underline cursor-pointer px-2 py-1"
          >
            <Plus size={13} className="stroke-[2.5]" />
            <span>New Entry</span>
          </button>
        </div>

        {/* Scrollable Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => {
              playPopSound();
              setCategoryFilter('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-main text-surface shadow-2xs font-bold'
                : 'bg-surface hover:bg-sunken text-muted border border-subtle'
            }`}
          >
            All Categories
          </button>
          {categories
            .filter((c) => typeFilter === 'all' || c.type === typeFilter)
            .map((cat) => {
              const isSelected = categoryFilter === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playPopSound();
                    setCategoryFilter(isSelected ? 'all' : cat.name);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-main text-surface shadow-2xs font-bold'
                      : 'bg-surface hover:bg-sunken text-muted border border-subtle'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* 7. TRANSACTIONS FEED (Grouped by Date) */}
      <div className="space-y-4">
        {groupedTransactions.length === 0 ? (
          <div className="bg-surface/60 rounded-3xl p-8 border border-subtle/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sunken flex items-center justify-center mx-auto text-xl">
              💸
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-main">
                {searchQuery ? 'No transactions found matching your search' : 'No transactions recorded yet'}
              </h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with a different keyword or amount.'
                  : 'Start logging daily expenses and income in seconds with your cute custom categories.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => {
                  playPopSound();
                  onOpenAddModal();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-accent text-accent-fg font-bold text-xs shadow-xs hover:bg-accent-hover transition-all active:scale-95 cursor-pointer min-h-[42px]"
              >
                <Plus size={14} className="stroke-[2.5]" />
                <span>Log first transaction</span>
              </button>
            )}
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.dateStr} className="space-y-2">
              <div className="flex items-center justify-between px-2 text-xs font-mono">
                <span className="font-bold text-muted capitalize tracking-tight">
                  {group.label}
                </span>
                <span className="font-semibold text-muted/80">
                  {group.subtotal >= 0 ? '+' : '-'}{currency}{Math.abs(group.subtotal).toFixed(2)}
                </span>
              </div>

              <div className="bg-surface/90 rounded-2xl border border-subtle/80 divide-y divide-subtle/50 shadow-2xs overflow-hidden">
                {group.items.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-sunken/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-2xl bg-sunken/80 border border-subtle/60 flex items-center justify-center text-lg shrink-0 select-none shadow-2xs">
                        {tx.categoryIcon || (tx.type === 'income' ? '💰' : '🏷️')}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs sm:text-sm font-bold text-main truncate">
                          {tx.category}
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
                            : 'text-main dark:text-cream/90'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}{currency}{Number(tx.amount).toFixed(2)}
                      </span>

                      <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            playPopSound();
                            onEditTransaction(tx);
                          }}
                          className="p-1.5 rounded-lg hover:bg-sunken text-muted hover:text-main cursor-pointer transition-colors"
                          title="Edit transaction"
                          aria-label="Edit transaction"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            playPopSound();
                            if (window.confirm(`Delete ${tx.category} transaction of ${currency}${tx.amount.toFixed(2)}?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-600 cursor-pointer transition-colors"
                          title="Delete transaction"
                          aria-label="Delete transaction"
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
      </div>

      {/* 8. CATEGORY MANAGER MODAL */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface text-main rounded-3xl border border-subtle shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-accent" />
                <h3 className="font-extrabold text-sm sm:text-base text-main">
                  Customize Categories
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="p-1 rounded-full hover:bg-sunken text-muted hover:text-main"
              >
                <X size={16} />
              </button>
            </div>

            {/* Category Form: Edit or Create */}
            <div className="p-3 bg-sunken rounded-2xl border border-subtle space-y-3">
              <p className="text-xs font-bold text-main">
                {editingCategory ? `Edit "${editingCategory.name}"` : 'Create New Category'}
              </p>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-surface border border-subtle flex items-center justify-center text-xl shrink-0">
                  {catIconInput}
                </div>
                <input
                  type="text"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="Category Name..."
                  className="flex-1 bg-surface border border-subtle rounded-xl px-3 py-2 text-xs font-semibold text-main focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setCatTypeInput(catTypeInput === 'expense' ? 'income' : 'expense')}
                  className="px-2.5 py-2 rounded-xl bg-surface border border-subtle text-[11px] font-bold text-muted hover:text-main uppercase"
                >
                  {catTypeInput}
                </button>
              </div>

              {/* Emoji selector grid */}
              <div className="grid grid-cols-8 gap-1 max-h-24 overflow-y-auto p-1 bg-surface rounded-xl border border-subtle/50">
                {CUTE_CATEGORY_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      playPopSound();
                      setCatIconInput(emoji);
                    }}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-sm transition-transform ${
                      catIconInput === emoji ? 'bg-accent text-accent-fg scale-110' : 'hover:bg-sunken'
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
                    onClick={handleStartCreateCategory}
                    className="px-3 py-1.5 rounded-xl bg-surface hover:bg-subtle text-xs font-semibold text-muted"
                  >
                    Clear Form
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveCategorySubmit}
                  className="px-4 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg text-xs font-bold shadow-xs"
                >
                  {editingCategory ? 'Update Category' : '+ Add Category'}
                </button>
              </div>
            </div>

            {/* List of Existing Categories */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-60">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider block px-1">
                Existing Categories ({categories.length})
              </span>
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
                        onClick={() => handleStartEditCategory(cat)}
                        className="p-1 rounded-md hover:bg-sunken text-muted hover:text-main"
                        title="Edit"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${cat.name}" category?`)) {
                            playPopSound();
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="p-1 rounded-md hover:bg-rose-500/10 text-muted hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-subtle flex justify-end">
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="px-4 py-2 rounded-2xl bg-sunken hover:bg-subtle text-xs font-bold text-main cursor-pointer"
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
