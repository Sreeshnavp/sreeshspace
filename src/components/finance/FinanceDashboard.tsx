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
  BarChart2,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Info,
  Tag,
  Eye,
  EyeOff,
  Bell,
  ArrowRight,
  Check,
  Send,
  CreditCard,
  Zap,
  Film,
  ShoppingBag,
  Activity,
  History as HistoryIcon,
  Home
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

type FinanceTab = 'wallet' | 'history' | 'statistics';

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
  
  const [activeTab, setActiveTab] = useState<FinanceTab>('wallet');
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

  // 8 Quick Service Tiles for Screen 1 (Wallet)
  const quickServiceTiles = [
    { id: 'srv-bills', name: 'Bill Payment', icon: '🧾', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600', catName: 'Bills & Utilities', type: 'expense' as const },
    { id: 'srv-salary', name: 'Invoice / Work', icon: '💼', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600', catName: 'Salary & Wages', type: 'income' as const },
    { id: 'srv-electricity', name: 'Electricity', icon: '⚡', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600', catName: 'Bills & Utilities', type: 'expense' as const },
    { id: 'srv-health', name: 'Health Care', icon: '💊', bg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600', catName: 'Health & Fitness', type: 'expense' as const },
    { id: 'srv-movies', name: 'Movies & Fun', icon: '🎬', bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600', catName: 'Fun & Leisure', type: 'expense' as const },
    { id: 'srv-shopping', name: 'Shopping', icon: '🛍️', bg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600', catName: 'Shopping', type: 'expense' as const },
    { id: 'srv-travel', name: 'Travel & Cab', icon: '🚕', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600', catName: 'Commute & Travel', type: 'expense' as const },
    { id: 'srv-food', name: 'Food & Dining', icon: '🍔', bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600', catName: 'Food & Dining', type: 'expense' as const },
  ];

  // Frequent Categories for Screen 2 (History)
  const frequentCategories = useMemo(() => {
    return categories.slice(0, 5);
  }, [categories]);

  // Dual Wave Curves Generator for Screen 3 (Statistic Activity)
  const dualTrendData = useMemo(() => {
    const data = insights.monthlyTrend;
    if (!data || data.length === 0) return { incomePoints: [], expensePoints: [], incomePath: '', expensePath: '', incomeArea: '', expenseArea: '' };

    const width = 500;
    const height = 140;
    const padX = 40;
    const padY = 24;
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

    const incArea = incPts.length > 0 ? `${incPath} L ${incPts[incPts.length - 1].x} 140 L ${incPts[0].x} 140 Z` : '';
    const expArea = expPts.length > 0 ? `${expPath} L ${expPts[expPts.length - 1].x} 140 L ${expPts[0].x} 140 Z` : '';

    return {
      incomePoints: incPts,
      expensePoints: expPts,
      incomePath: incPath,
      expensePath: expPath,
      incomeArea: incArea,
      expenseArea: expArea,
    };
  }, [insights.monthlyTrend]);

  // Format Indian Rupee currency with commas
  const formatRupees = (val: number) => {
    return val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const selectedMonthOption = monthOptions.find((m) => m.key === selectedMonthKey) || monthOptions[0];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto pb-16">
      
      {/* 1. TOP HEADER & GREETING */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6228FF] to-[#9955FF] flex items-center justify-center text-white text-base font-extrabold shadow-sm select-none">
            S
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-main leading-tight">
              Hello, Sreeshnav
            </h2>
            <p className="text-[11px] text-muted flex items-center gap-1 font-medium">
              <span>📍 Personal Vault</span>
              <span>•</span>
              <span className="capitalize">{selectedMonthOption.label}</span>
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Month selector dropdown */}
          <div className="relative inline-block">
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="appearance-none bg-surface/90 hover:bg-surface border border-subtle text-main font-semibold text-xs pl-3 pr-7 py-1.5 rounded-full shadow-2xs cursor-pointer focus:outline-none"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
          </div>

          <button
            onClick={() => {
              playPopSound();
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery('');
            }}
            className={`p-2 rounded-full border border-subtle transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
              isSearchOpen || searchQuery
                ? 'bg-[#6228FF] text-white border-[#6228FF]'
                : 'bg-surface hover:bg-sunken text-muted hover:text-main shadow-2xs'
            }`}
            title="Search"
          >
            <Search size={14} />
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
            placeholder="Search payments by category, merchant, note..."
            autoFocus
            className="w-full bg-surface border border-subtle rounded-2xl pl-9 pr-9 py-2 text-xs sm:text-sm text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#6228FF]/30 shadow-2xs"
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

      {/* 2. THREE-TAB FINTECH DOCK (Wallet • History • Statistics) */}
      <div className="flex items-center justify-between p-1 rounded-2xl bg-sunken border border-subtle text-xs font-semibold">
        <button
          onClick={() => {
            playPopSound();
            setActiveTab('wallet');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] ${
            activeTab === 'wallet'
              ? 'bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white shadow-xs font-bold'
              : 'text-muted hover:text-main'
          }`}
        >
          <Wallet size={13} />
          <span>Wallet</span>
        </button>

        <button
          onClick={() => {
            playPopSound();
            setActiveTab('history');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white shadow-xs font-bold'
              : 'text-muted hover:text-main'
          }`}
        >
          <HistoryIcon size={13} />
          <span>History ({filteredTransactions.length})</span>
        </button>

        <button
          onClick={() => {
            playPopSound();
            setActiveTab('statistics');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all cursor-pointer min-h-[40px] ${
            activeTab === 'statistics'
              ? 'bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white shadow-xs font-bold'
              : 'text-muted hover:text-main'
          }`}
        >
          <Activity size={13} />
          <span>Statistics</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SCREEN 1: WALLET / HOME VIEW                             */}
      {/* ======================================================== */}
      {activeTab === 'wallet' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* ROYAL PURPLE GRADIENT HERO CARD (Matching Screen 1 of uploaded mockup) */}
          <div className="bg-gradient-to-br from-[#6228FF] via-[#7839EE] to-[#9955FF] text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-purple-500/20 relative overflow-hidden">
            {/* Glowing decorative circles */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/10 rounded-full blur-xl pointer-events-none -ml-8 -mb-8" />

            {/* Total Balance Header Row with Privacy Eye Toggle */}
            <div className="flex items-center justify-between text-white/80 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <CreditCard size={14} />
                <span>Total Balance</span>
              </div>
              <button
                onClick={() => {
                  playPopSound();
                  setShowBalance(!showBalance);
                }}
                className="p-1 rounded-full hover:bg-white/15 transition-colors cursor-pointer text-white/90"
                title={showBalance ? 'Hide Balance' : 'Show Balance'}
              >
                {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>

            {/* Large Balance Display */}
            <div className="py-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white">
                {showBalance ? (
                  `${overallBalance >= 0 ? '' : '-'}${currency}${formatRupees(Math.abs(overallBalance))}`
                ) : (
                  `${currency}••••••••`
                )}
              </h1>
            </div>

            {/* 4 Action Buttons inside Hero Card */}
            <div className="pt-4 grid grid-cols-4 gap-2 text-center">
              {/* Top Up (Add Income) */}
              <button
                onClick={() => {
                  playPopSound();
                  onOpenAddModal('income');
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-emerald-300 transition-all group-active:scale-95 shadow-2xs">
                  <ArrowDownLeft size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-white/90">Top Up</span>
              </button>

              {/* Pay (Log Expense) */}
              <button
                onClick={() => {
                  playPopSound();
                  onOpenAddModal('expense');
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-pink-200 transition-all group-active:scale-95 shadow-2xs">
                  <ArrowUpRight size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-white/90">Pay</span>
              </button>

              {/* Categories */}
              <button
                onClick={() => {
                  playPopSound();
                  setIsCategoryManagerOpen(true);
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-amber-200 transition-all group-active:scale-95 shadow-2xs">
                  <Tag size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-white/90">Categories</span>
              </button>

              {/* History */}
              <button
                onClick={() => {
                  playPopSound();
                  setActiveTab('history');
                }}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-cyan-200 transition-all group-active:scale-95 shadow-2xs">
                  <HistoryIcon size={18} className="stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-white/90">History</span>
              </button>
            </div>
          </div>

          {/* OTHERS SERVICE (Quick Categories Grid from Screen 1) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-xs sm:text-sm text-main uppercase tracking-wider">
                Services & Categories
              </h3>
              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="text-xs font-bold text-[#6228FF] dark:text-[#9955FF] hover:underline cursor-pointer"
              >
                Edit All
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {quickServiceTiles.map((tile) => (
                <button
                  key={tile.id}
                  onClick={() => {
                    playPopSound();
                    const matchCat = categories.find((c) => c.name.toLowerCase() === tile.catName.toLowerCase());
                    onOpenAddModal(tile.type, matchCat);
                  }}
                  className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl bg-surface hover:bg-sunken border border-subtle text-center transition-all active:scale-95 cursor-pointer shadow-2xs group"
                >
                  <div className={`w-10 h-10 rounded-2xl ${tile.bg} flex items-center justify-center text-xl mb-1.5 transition-transform group-hover:scale-110`}>
                    {tile.icon}
                  </div>
                  <span className="text-[11px] font-bold text-main leading-tight truncate w-full">
                    {tile.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SMART FINANCIAL PROMO BANNERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-3xl bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Insights
                </span>
                <p className="font-extrabold text-sm leading-tight">
                  {insights.savingsRate >= 30 ? 'High Savings Rate!' : 'Daily Spending Pace'}
                </p>
                <p className="text-[11px] text-white/80">
                  {insights.avgDailySpend > 0 ? `Avg ${currency}${formatRupees(insights.avgDailySpend)} per day` : 'Ready to log first expense'}
                </p>
              </div>
              <Sparkles size={24} className="text-yellow-300 opacity-90" />
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Savings Goal
                </span>
                <p className="font-extrabold text-sm leading-tight">
                  Net: {currency}{formatRupees(Math.abs(insights.netSavings))}
                </p>
                <p className="text-[11px] text-white/80">
                  {insights.netSavings >= 0 ? 'Surplus retained this month' : 'Review discretionary spends'}
                </p>
              </div>
              <ArrowDownLeft size={24} className="text-white opacity-90" />
            </div>
          </div>

          {/* RECENT TRANSACTIONS PREVIEW */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-xs sm:text-sm text-main uppercase tracking-wider">
                Recent Transactions
              </h3>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-bold text-[#6228FF] dark:text-[#9955FF] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>See All</span>
                <ArrowRight size={12} />
              </button>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-6 rounded-2xl bg-surface border border-subtle text-center space-y-2">
                <p className="text-xs text-muted">No transactions logged this month yet.</p>
                <button
                  onClick={() => onOpenAddModal('expense')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  + Log First Payment
                </button>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-subtle divide-y divide-subtle/50 shadow-2xs overflow-hidden">
                {filteredTransactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-sunken/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <div className="w-10 h-10 rounded-2xl bg-sunken flex items-center justify-center text-lg shrink-0 shadow-2xs">
                        {tx.categoryIcon || '💸'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-bold text-main truncate flex items-center gap-1">
                          <span>{tx.category}</span>
                          <CheckCircle2 size={11} className="text-[#6228FF] shrink-0" />
                        </p>
                        <p className="text-[11px] text-muted truncate">
                          {tx.merchant || tx.note || tx.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs sm:text-sm font-extrabold font-mono ${
                        tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{currency}{formatRupees(Number(tx.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 2: HISTORY VIEW (Matching Screen 2 of mockup)     */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* PURPLE TOP BANNER: Frequent Categories / Contacts */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white/90">
              <span>Frequent Categories</span>
              <button
                onClick={() => setIsCategoryManagerOpen(true)}
                className="text-[11px] text-white/80 hover:text-white underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            {/* Circular Category Avatars Row */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
              {frequentCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    playPopSound();
                    setCategoryFilter(categoryFilter === cat.name ? 'all' : cat.name);
                  }}
                  className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-sm ${
                    categoryFilter === cat.name ? 'ring-2 ring-white bg-white text-main' : 'bg-white/20 text-white'
                  }`}>
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-bold text-white/90 truncate max-w-[55px]">
                    {cat.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Segmented Filter Pills: All | Expenses | Income */}
          <div className="flex items-center justify-between gap-2 px-1">
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
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus size={13} className="stroke-[2.5]" />
              <span>Record</span>
            </button>
          </div>

          {/* Date-Grouped Transaction Feed */}
          <div className="space-y-4">
            {groupedTransactions.length === 0 ? (
              <div className="bg-surface rounded-3xl p-8 border border-subtle text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sunken flex items-center justify-center mx-auto text-xl">
                  💸
                </div>
                <h4 className="text-sm font-bold text-main">No payment records found</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  {searchQuery ? 'Try another search query.' : 'Tap Record to log your first payment in Rupees.'}
                </p>
                <button
                  onClick={() => onOpenAddModal()}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white font-bold text-xs shadow-xs"
                >
                  + Record Transaction
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
                              <CheckCircle2 size={11} className="text-[#6228FF] shrink-0" />
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

        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 3: STATISTIC ACTIVITY (Matching Screen 3 of mockup) */}
      {/* ======================================================== */}
      {activeTab === 'statistics' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Mini Total Balance Summary */}
          <div className="flex items-center justify-between p-4 rounded-3xl bg-surface border border-subtle">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider flex items-center gap-1">
                <CreditCard size={12} /> Total Balance
              </span>
              <h2 className="text-2xl font-extrabold font-mono text-main">
                {currency}{formatRupees(Math.abs(overallBalance))}
              </h2>
            </div>
            <button
              onClick={() => onOpenAddModal()}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white font-bold text-xs shadow-xs"
            >
              + Record
            </button>
          </div>

          {/* "OVERVIEW" DUAL WAVE CHART CARD (Screen 3 Replica) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-subtle shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-main">
                  Overview
                </h3>
                <p className="text-[11px] text-muted font-medium">Income vs Expense Trend</p>
              </div>

              {/* Legend: Purple Income • Cyan Expense */}
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-[#6228FF] dark:text-[#9955FF]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6228FF]" />
                  Income
                </span>
                <span className="flex items-center gap-1.5 text-[#06B6D4]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                  Expense
                </span>
              </div>
            </div>

            {/* DUAL SPLINE SVG GRAPH */}
            <div className="relative w-full h-[140px] pt-2">
              <svg viewBox="0 0 500 140" className="w-full h-full overflow-visible select-none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6228FF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6228FF" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Income Area Fill */}
                {dualTrendData.incomeArea && (
                  <path d={dualTrendData.incomeArea} fill="url(#purpleGrad)" />
                )}
                {/* Expense Area Fill */}
                {dualTrendData.expenseArea && (
                  <path d={dualTrendData.expenseArea} fill="url(#cyanGrad)" />
                )}

                {/* Purple Income Curve */}
                {dualTrendData.incomePath && (
                  <path
                    d={dualTrendData.incomePath}
                    fill="none"
                    stroke="#6228FF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Cyan Expense Curve */}
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

                {/* Month Points */}
                {dualTrendData.incomePoints.map((pt, idx) => (
                  <circle
                    key={`inc-${pt.monthKey}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#6228FF"
                    stroke="var(--surface)"
                    strokeWidth="2"
                    className="cursor-pointer transition-transform hover:scale-125"
                    onMouseEnter={() => setHoveredTrendIndex(idx)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  />
                ))}

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

              {/* Tooltip on hover */}
              {hoveredTrendIndex !== null && dualTrendData.incomePoints[hoveredTrendIndex] && (
                <div
                  className="absolute -top-7 transform -translate-x-1/2 pointer-events-none px-2.5 py-1 rounded-lg bg-main text-surface text-[10px] font-mono font-bold shadow-md z-10 whitespace-nowrap"
                  style={{ left: `${(dualTrendData.incomePoints[hoveredTrendIndex].x / 500) * 100}%` }}
                >
                  +{currency}{formatRupees(dualTrendData.incomePoints[hoveredTrendIndex].val)} | -{currency}{formatRupees(dualTrendData.expensePoints[hoveredTrendIndex].val)}
                </div>
              )}
            </div>

            {/* Month labels along bottom */}
            <div className="flex justify-between px-3 text-[11px] font-mono font-semibold text-muted select-none">
              {insights.monthlyTrend.map((pt) => (
                <span key={pt.monthKey} className="capitalize">
                  {pt.monthLabel}
                </span>
              ))}
            </div>
          </div>

          {/* "INFORMATION" GLOWING DUO CARDS (Screen 3 Replica) */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-muted uppercase tracking-wider px-1">
              Information Summary
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Income Purple Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#6228FF] to-[#8C52FF] text-white shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownLeft size={16} /> Income
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                    {insights.savingsRate}% Saved
                  </span>
                </div>
                <h3 className="text-2xl font-mono font-extrabold">
                  +{currency}{formatRupees(insights.totalIncome)}
                </h3>
              </div>

              {/* Expense Cyan Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#06B6D4] to-[#0284C7] text-white shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                  <span className="flex items-center gap-1.5">
                    <ArrowUpRight size={16} /> Expense
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                    {selectedMonthOption.label}
                  </span>
                </div>
                <h3 className="text-2xl font-mono font-extrabold">
                  -{currency}{formatRupees(insights.totalExpenses)}
                </h3>
              </div>
            </div>
          </div>

          {/* Category Distribution Meters */}
          {categoryBreakdown.length > 0 && (
            <div className="p-5 rounded-3xl bg-surface border border-subtle space-y-3">
              <h4 className="font-extrabold text-xs text-main uppercase tracking-wider">
                Top Spending Breakdown
              </h4>
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
                        className="bg-gradient-to-r from-[#6228FF] to-[#06B6D4] h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* 4. CATEGORY MANAGER MODAL                                 */}
      {/* ======================================================== */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface text-main rounded-3xl border border-subtle shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-[#6228FF]" />
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
                  className="flex-1 bg-surface border border-subtle rounded-xl px-3 py-2 text-xs font-semibold text-main focus:outline-none focus:ring-1 focus:ring-[#6228FF]"
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
                      catIconInput === emoji ? 'bg-[#6228FF] text-white scale-110' : 'hover:bg-sunken'
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
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#6228FF] to-[#8C52FF] text-white text-xs font-bold shadow-xs cursor-pointer"
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
