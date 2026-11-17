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
  CreditCard,
  Tag,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  PieChart,
  BarChart2,
  Sliders,
  DollarSign
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
  onOpenAddModal: (type?: TransactionType, category?: FinanceCategory) => void;
  onEditTransaction: (tx: FinanceTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSaveCategory: (cat: FinanceCategory) => void;
  onDeleteCategory: (id: string) => void;
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
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // Category Manager Modal state
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinanceCategory | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catIconInput, setCatIconInput] = useState('🏷️');
  const [catTypeInput, setCatTypeInput] = useState<TransactionType>('expense');

  // Month selector options
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

  // Category breakdown for statistics
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

  // Dual Wave Spline Curves Generator for Overview Chart
  const dualTrendData = useMemo(() => {
    const data = insights.monthlyTrend;
    if (!data || data.length === 0) return { incomePoints: [], expensePoints: [], incomePath: '', expensePath: '', incomeArea: '', expenseArea: '' };

    const width = 500;
    const height = 135;
    const padX = 35;
    const padY = 20;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const allValues = data.flatMap((d) => [d.income, d.expense]);
    const maxVal = Math.max(...allValues, 100);

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

    const incArea = incPts.length > 0 ? `${incPath} L ${incPts[incPts.length - 1].x} 135 L ${incPts[0].x} 135 Z` : '';
    const expArea = expPts.length > 0 ? `${expPath} L ${expPts[expPts.length - 1].x} 135 L ${expPts[0].x} 135 Z` : '';

    return {
      incomePoints: incPts,
      expensePoints: expPts,
      incomePath: incPath,
      expensePath: expPath,
      incomeArea: incArea,
      expenseArea: expArea,
    };
  }, [insights.monthlyTrend]);

  // Format Indian Rupee currency with commas: ₹489,300.60
  const formatRupees = (val: number) => {
    return val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const selectedMonthOption = monthOptions.find((m) => m.key === selectedMonthKey) || monthOptions[0];

  return (
    <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto pb-16">
      
      {/* 1. TOP HEADER BAR */}
      <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
        <div>
          <h2 className="font-extrabold text-base sm:text-lg text-main leading-tight flex items-center gap-1.5">
            <span>Finance & Expense Tracker</span>
          </h2>
          <p className="text-[11px] text-muted font-medium">
            Personal income & spend flow in Indian Rupees ({currency})
          </p>
        </div>

        {/* Right Action Controls: Month Dropdown + Search + Record */}
        <div className="flex items-center gap-2">
          {/* Month selector */}
          <div className="relative inline-block">
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="appearance-none bg-surface hover:bg-sunken border border-subtle text-main font-semibold text-xs pl-3 pr-7 py-1.5 rounded-full shadow-2xs cursor-pointer focus:outline-none"
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
            onClick={() => {
              playPopSound();
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery('');
            }}
            className={`p-2 rounded-full border border-subtle transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
              isSearchOpen || searchQuery
                ? 'bg-[#6E3BFF] text-white border-[#6E3BFF]'
                : 'bg-surface hover:bg-sunken text-muted hover:text-main shadow-2xs'
            }`}
            title="Search"
          >
            <Search size={14} />
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={() => {
              playPopSound();
              onOpenAddModal();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#6E3BFF] to-[#8C52FF] hover:opacity-95 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer min-h-[36px]"
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
            className="w-full bg-surface border border-subtle rounded-2xl pl-9 pr-9 py-2 text-xs sm:text-sm text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#6E3BFF]/30 shadow-2xs"
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

      {/* 2. TOTAL BALANCE HERO HEADER (Matching Screen 3 of mockup) */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <CreditCard size={14} />
            <span>Total Balance</span>
            <button
              onClick={() => {
                playPopSound();
                setShowBalance(!showBalance);
              }}
              className="p-1 rounded-full hover:bg-sunken text-muted hover:text-main transition-colors cursor-pointer"
              title={showBalance ? 'Hide Balance' : 'Show Balance'}
            >
              {showBalance ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-[#6E3BFF] dark:text-[#9955FF]">
            {showBalance ? (
              `${overallBalance >= 0 ? '' : '-'}${currency}${formatRupees(Math.abs(overallBalance))}`
            ) : (
              `${currency}••••••••`
            )}
          </h1>
        </div>

        {/* Categories Manager shortcut */}
        <button
          onClick={() => {
            playPopSound();
            setIsCategoryManagerOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-sunken border border-subtle text-xs font-bold text-main shadow-2xs cursor-pointer transition-all active:scale-95"
        >
          <Tag size={13} className="text-[#6E3BFF]" />
          <span>Categories ({categories.length})</span>
        </button>
      </div>

      {/* 3. "OVERVIEW" DUAL WAVE CHART (Exact Replica of Screen 3 in Reference Image) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-subtle shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-main">
              Overview
            </h3>
            <p className="text-[11px] text-muted font-medium">Monthly Income & Expense Waves</p>
          </div>

          {/* Legend: 🟣 Income  🔵 Expense */}
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-[#6E3BFF] dark:text-[#9955FF]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6E3BFF]" />
              Income
            </span>
            <span className="flex items-center gap-1.5 text-[#06B6D4]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
              Expense
            </span>
          </div>
        </div>

        {/* Dual Spline SVG Curves */}
        <div className="relative w-full h-[135px] pt-1">
          <svg viewBox="0 0 500 135" className="w-full h-full overflow-visible select-none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="purpleGradientWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6E3BFF" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#6E3BFF" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="cyanGradientWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Income Gradient Area */}
            {dualTrendData.incomeArea && (
              <path d={dualTrendData.incomeArea} fill="url(#purpleGradientWave)" />
            )}
            {/* Expense Gradient Area */}
            {dualTrendData.expenseArea && (
              <path d={dualTrendData.expenseArea} fill="url(#cyanGradientWave)" />
            )}

            {/* Purple Spline Curve for Income */}
            {dualTrendData.incomePath && (
              <path
                d={dualTrendData.incomePath}
                fill="none"
                stroke="#6E3BFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Cyan Spline Curve for Expense */}
            {dualTrendData.expensePath && (
              <path
                d={dualTrendData.expensePath}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Income Dots */}
            {dualTrendData.incomePoints.map((pt, idx) => (
              <circle
                key={`inc-${pt.monthKey}`}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#6E3BFF"
                stroke="var(--surface)"
                strokeWidth="2"
                className="cursor-pointer transition-transform hover:scale-125"
                onMouseEnter={() => setHoveredTrendIndex(idx)}
                onMouseLeave={() => setHoveredTrendIndex(null)}
              />
            ))}

            {/* Expense Dots */}
            {dualTrendData.expensePoints.map((pt, idx) => (
              <circle
                key={`exp-${pt.monthKey}`}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#06B6D4"
                stroke="var(--surface)"
                strokeWidth="2"
                className="cursor-pointer transition-transform hover:scale-125"
                onMouseEnter={() => setHoveredTrendIndex(idx)}
                onMouseLeave={() => setHoveredTrendIndex(null)}
              />
            ))}
          </svg>

          {/* Interactive Tooltip on hover */}
          {hoveredTrendIndex !== null && dualTrendData.incomePoints[hoveredTrendIndex] && (
            <div
              className="absolute -top-7 transform -translate-x-1/2 pointer-events-none px-2.5 py-1 rounded-lg bg-main text-surface text-[10px] font-mono font-bold shadow-md z-10 whitespace-nowrap"
              style={{ left: `${(dualTrendData.incomePoints[hoveredTrendIndex].x / 500) * 100}%` }}
            >
              +{currency}{formatRupees(dualTrendData.incomePoints[hoveredTrendIndex].val)} | -{currency}{formatRupees(dualTrendData.expensePoints[hoveredTrendIndex].val)}
            </div>
          )}
        </div>

        {/* Month Labels along bottom: Jan Feb Mar Apr Mei Jun Jul */}
        <div className="flex justify-between px-3 text-[11px] font-mono font-semibold text-muted select-none">
          {insights.monthlyTrend.map((pt) => {
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
                    ? 'text-[#6E3BFF] font-extrabold underline underline-offset-4 decoration-2 decoration-[#6E3BFF]'
                    : 'hover:text-main'
                }`}
              >
                {pt.monthLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. "INFORMATION" GLOWING DUO CARDS (Exact Replica of Screen 3 in Reference Image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Purple Glowing Income Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#6E3BFF] via-[#7B46FF] to-[#8C52FF] text-white shadow-md shadow-purple-500/20 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold text-white/90">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft size={16} className="stroke-[2.5]" />
              <span>Income</span>
            </span>
            <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-mono">
              {insights.savingsRate}% Saved
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-mono font-extrabold text-white">
            +{currency}{formatRupees(insights.totalIncome)}
          </h3>
          <p className="text-[11px] text-white/80 font-medium">
            Incoming funds for {selectedMonthOption.label}
          </p>
        </div>

        {/* Cyan Glowing Expense Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#06B6D4] to-[#0284C7] text-white shadow-md shadow-cyan-500/20 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-semibold text-white/90">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight size={16} className="stroke-[2.5]" />
              <span>Expense</span>
            </span>
            <span className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-mono">
              Net {currency}{formatRupees(Math.abs(insights.netSavings))}
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-mono font-extrabold text-white">
            -{currency}{formatRupees(insights.totalExpenses)}
          </h3>
          <p className="text-[11px] text-white/80 font-medium">
            Outflow records for {selectedMonthOption.label}
          </p>
        </div>
      </div>

      {/* 5. FREQUENT CATEGORIES CIRCULAR STRIP (Screen 2 Replica) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#6E3BFF] to-[#8C52FF] text-white shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-white/90">
          <span className="flex items-center gap-1.5">
            <Tag size={13} />
            <span>Categories</span>
          </span>
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="text-[11px] text-white/85 hover:text-white underline cursor-pointer"
          >
            Customize
          </button>
        </div>

        {/* Circular Avatar Badges */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => {
              playPopSound();
              setCategoryFilter('all');
            }}
            className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-transform group-hover:scale-110 shadow-sm ${
              categoryFilter === 'all' ? 'bg-white text-[#6E3BFF] ring-2 ring-white' : 'bg-white/20 text-white'
            }`}>
              All
            </div>
            <span className="text-[10px] font-bold text-white/90">All</span>
          </button>

          {categories.map((cat) => {
            const isSelected = categoryFilter === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  playPopSound();
                  setCategoryFilter(isSelected ? 'all' : cat.name);
                }}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-sm ${
                  isSelected ? 'bg-white text-main ring-2 ring-white scale-105' : 'bg-white/20 text-white'
                }`}>
                  {cat.icon}
                </div>
                <span className="text-[10px] font-bold text-white/90 truncate max-w-[55px]">
                  {cat.name.split(' ')[0]}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => {
              playPopSound();
              setIsCategoryManagerOpen(true);
            }}
            className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full border border-dashed border-white/50 flex items-center justify-center text-white/80 transition-transform group-hover:scale-110">
              <Plus size={18} />
            </div>
            <span className="text-[10px] font-bold text-white/80">Add</span>
          </button>
        </div>
      </div>

      {/* 6. TOP SPENDING BREAKDOWN METERS (If expenses exist) */}
      {categoryBreakdown.length > 0 && (
        <div className="p-5 rounded-3xl bg-surface border border-subtle shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-main uppercase tracking-wider">
              Spending Breakdown
            </h4>
            <span className="text-[11px] font-mono text-muted">
              {categoryBreakdown.length} active categories
            </span>
          </div>

          <div className="space-y-2.5">
            {categoryBreakdown.slice(0, 5).map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 truncate">
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className="font-mono text-muted">
                    {currency}{formatRupees(cat.amount)} ({cat.pct}%)
                  </span>
                </div>
                <div className="w-full bg-sunken rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#6E3BFF] to-[#06B6D4] h-full rounded-full transition-all duration-500"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. RECENT PAYMENTS FEED (Matching Screen 2 of Mockup) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <h3 className="font-extrabold text-xs sm:text-sm text-main uppercase tracking-wider">
            Recent Payments
          </h3>

          {/* Type Filter Pills: All | Expenses | Income */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-sunken border border-subtle text-xs font-semibold">
            <button
              onClick={() => {
                playPopSound();
                setTypeFilter('all');
              }}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
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
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
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
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
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
          <div className="bg-surface rounded-3xl p-8 border border-subtle text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sunken flex items-center justify-center mx-auto text-xl">
              💸
            </div>
            <h4 className="text-sm font-bold text-main">No payment records found</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {searchQuery ? 'Try another search query.' : 'Tap Add Entry to log your first income or expense.'}
            </p>
            <button
              onClick={() => onOpenAddModal()}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#6E3BFF] to-[#8C52FF] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              + Record in Rupees
            </button>
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.dateStr} className="space-y-2">
              <div className="flex items-center justify-between px-2 text-xs font-mono">
                <span className="font-bold text-muted capitalize tracking-tight">
                  {group.label}
                </span>
                <span className="font-semibold text-muted/80">
                  {group.subtotal >= 0 ? '+' : '-'}{currency}{formatRupees(Math.abs(group.subtotal))}
                </span>
              </div>

              <div className="bg-surface rounded-2xl border border-subtle divide-y divide-subtle/50 shadow-2xs overflow-hidden">
                {group.items.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-sunken/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-2xl bg-sunken/80 border border-subtle/60 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                        {tx.categoryIcon || '💸'}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs sm:text-sm font-bold text-main truncate flex items-center gap-1">
                          <span>{tx.category}</span>
                          <CheckCircle2 size={11} className="text-[#6E3BFF] shrink-0" />
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
                        {tx.type === 'income' ? '+' : '-'}{currency}{formatRupees(Number(tx.amount))}
                      </span>

                      <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
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
                          onClick={() => {
                            playPopSound();
                            if (window.confirm(`Delete ${tx.category} payment of ${currency}${tx.amount}?`)) {
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
      </div>

      {/* 8. CATEGORY MANAGER MODAL */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface text-main rounded-3xl border border-subtle shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-[#6E3BFF]" />
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

            {/* Category Form */}
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
                  placeholder="Category Name (e.g. Swiggy, Gym, SIP)..."
                  className="flex-1 bg-surface border border-subtle rounded-xl px-3 py-2 text-xs font-semibold text-main focus:outline-none focus:ring-1 focus:ring-[#6E3BFF]"
                />
                <button
                  type="button"
                  onClick={() => setCatTypeInput(catTypeInput === 'expense' ? 'income' : 'expense')}
                  className="px-2.5 py-2 rounded-xl bg-surface border border-subtle text-[11px] font-bold text-muted hover:text-main uppercase"
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
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-sm transition-transform ${
                      catIconInput === emoji ? 'bg-[#6E3BFF] text-white scale-110' : 'hover:bg-sunken'
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
                    className="px-3 py-1.5 rounded-xl bg-surface hover:bg-subtle text-xs font-semibold text-muted cursor-pointer"
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
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#6E3BFF] to-[#8C52FF] text-white text-xs font-bold shadow-xs cursor-pointer"
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
                        onClick={() => {
                          setEditingCategory(cat);
                          setCatNameInput(cat.name);
                          setCatIconInput(cat.icon);
                          setCatTypeInput(cat.type);
                        }}
                        className="p-1 rounded-md hover:bg-sunken text-muted hover:text-main cursor-pointer"
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
                        className="p-1 rounded-md hover:bg-rose-500/10 text-muted hover:text-rose-600 cursor-pointer"
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
