import React, { useState, useMemo } from 'react';
import type { FinanceTransaction, FinanceCategory, TransactionType } from '../../types/finance';
import { triggerPartyPop, playPopSound } from '../../utils/delight';
import './finance.css';

interface FinanceDashboardProps {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  currency?: string;
  onChangeCurrency?: (symbol: string) => void;
  onOpenAddModal?: (type?: TransactionType, category?: FinanceCategory) => void;
  onEditTransaction?: (tx: FinanceTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onSaveCategory?: (cat: FinanceCategory) => void;
  onDeleteCategory?: (id: string) => void;
  onQuickAdd?: (tx: Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  transactions = [],
  currency = '$',
  onEditTransaction,
  onDeleteTransaction,
  onQuickAdd,
}) => {
  const TODAY = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Balance visibility toggle
  const [showBalance, setShowBalance] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'ytd'>('month');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  
  // Quick Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logType, setLogType] = useState<'expense' | 'income'>('expense');
  const [logAmount, setLogAmount] = useState('');
  const [logCategory, setLogCategory] = useState('Food & Cafe');
  const [logNote, setLogNote] = useState('');

  // Calculations
  const { totalInflow, totalSpent, netBalance, safePercent } = useMemo(() => {
    let inflow = 3200;
    let spent = 1420;

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        inflow += tx.amount;
      } else {
        spent += tx.amount;
      }
    });

    const net = inflow - spent;
    const safe = Math.max(0, Math.min(100, Math.round((1 - spent / 2100) * 100)));

    return {
      totalInflow: inflow,
      totalSpent: spent,
      netBalance: net,
      safePercent: safe
    };
  }, [transactions]);

  // Handle Log Save
  const handleSaveExpense = () => {
    const amt = parseFloat(logAmount);
    if (!(amt > 0) || !onQuickAdd) return;

    onQuickAdd({
      type: logType,
      amount: amt,
      category: logCategory,
      categoryIcon: logCategory.includes('Food') ? '☕' : logCategory.includes('Tech') ? '💻' : '🛍️',
      note: logNote.trim() || logCategory,
      date: TODAY
    });

    playPopSound();
    triggerPartyPop('stars');
    setLogAmount('');
    setLogNote('');
    setIsLogModalOpen(false);
  };

  return (
    <div className="bg-[#FAF8F4] font-['Plus_Jakarta_Sans',sans-serif] text-[#1D1B19] antialiased min-h-screen pb-36">
      <div className="max-w-lg mx-auto px-4 sm:px-6 space-y-5 pt-3">

        {/* ======================================================== */}
        {/* 1. PRIMARY BALANCE & MONTHLY HEALTH CARD                 */}
        {/* ======================================================== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#EDE9FE] via-white to-[#E0F2FE] p-6 shadow-[0_8px_24px_-4px_rgba(139,92,246,0.12)] border border-stone-200/60">
          
          {/* Watermark Motif */}
          <span className="material-symbols-outlined absolute -bottom-6 -right-4 text-[130px] text-[#6B38D4]/10 select-none pointer-events-none">
            savings
          </span>

          <div className="relative z-10 flex flex-col space-y-4">
            {/* Top row: Label + Eye toggle */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 shadow-xs backdrop-blur-xs">
                <span className="text-[14px]">👛</span>
                <span className="text-xs font-semibold text-stone-600">Personal Net Balance</span>
              </div>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-stone-600 hover:text-[#6B38D4] transition-colors active:scale-95 shadow-2xs"
                title={showBalance ? 'Hide balance' : 'Show balance'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showBalance ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>

            {/* Big Net Balance Value */}
            <div>
              <h1 className="font-['Fraunces',serif] font-bold text-3xl sm:text-4xl text-[#1D1B19] tracking-tight">
                {showBalance ? `${currency}${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••••'}
              </h1>
              <p className="text-xs text-stone-500 mt-1 font-medium">
                Updated just now · 3 linked accounts
              </p>
            </div>

            {/* Income & Outflow Badges */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/95 shadow-xs border border-stone-100">
                <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#006C49] shrink-0 font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-stone-500 font-semibold truncate">Inflow</span>
                  <span className="text-sm font-bold text-[#006C49] truncate">
                    +{currency}{totalInflow.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/95 shadow-xs border border-stone-100">
                <div className="w-8 h-8 rounded-full bg-[#FFE4E6] flex items-center justify-center text-[#B90538] shrink-0 font-bold">
                  <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-stone-500 font-semibold truncate">Spent</span>
                  <span className="text-sm font-bold text-[#B90538] truncate">
                    -{currency}{totalSpent.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Limit Sparkle Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs font-semibold text-stone-600">
                <span className="flex items-center gap-1">
                  <span>✨</span> Monthly Safety Guard
                </span>
                <span className="text-[#6B38D4] font-bold">{safePercent}% safe</span>
              </div>
              
              <div className="h-3 w-full rounded-full bg-white/80 p-0.5 overflow-hidden shadow-inner border border-stone-200/50">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#6B38D4] via-[#8455EF] to-[#4EDEA3] transition-all duration-700 ease-out" 
                  style={{ width: `${safePercent}%` }} 
                />
              </div>

              <div className="flex justify-between text-[11px] text-stone-500 font-medium">
                <span>Spent {currency}{totalSpent.toLocaleString()}</span>
                <span>Cap: {currency}2,100</span>
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. PRIMARY ACTION CONTROLS                               */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#6B38D4] text-white shadow-md shadow-purple-500/25 hover:scale-[1.02] active:scale-95 transition-all font-bold text-xs"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Log Expense</span>
          </button>
          
          <a 
            href="#analyticsSection"
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white text-[#1D1B19] shadow-xs border border-stone-200/70 hover:bg-[#EDE9FE]/50 hover:text-[#6B38D4] active:scale-95 transition-all font-bold text-xs"
          >
            <span className="material-symbols-outlined text-[20px] text-[#6B38D4]">pie_chart</span>
            <span>Analytics View</span>
          </a>
        </div>

        {/* ======================================================== */}
        {/* 3. RICH ANALYTICS & INSIGHTS                             */}
        {/* ======================================================== */}
        <div className="space-y-2.5 pt-1" id="analyticsSection">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[18px]">📊</span>
              <h2 className="font-['Fraunces',serif] font-bold text-lg text-[#1D1B19]">Analytics &amp; Insights</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#6B38D4] text-[11px] font-bold">
              Live Sparkle
            </span>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm border border-stone-200/70 space-y-4">
            
            {/* Timeframe Tabs */}
            <div className="flex p-1 rounded-2xl bg-stone-100 border border-stone-200/60 text-xs font-semibold">
              <button 
                onClick={() => setTimeframe('week')}
                className={`flex-1 py-1.5 text-center rounded-xl transition-all ${
                  timeframe === 'week' ? 'bg-white text-[#6B38D4] shadow-xs font-bold' : 'text-stone-600'
                }`}
              >
                This Week
              </button>
              <button 
                onClick={() => setTimeframe('month')}
                className={`flex-1 py-1.5 text-center rounded-xl transition-all ${
                  timeframe === 'month' ? 'bg-white text-[#6B38D4] shadow-xs font-bold' : 'text-stone-600'
                }`}
              >
                This Month
              </button>
              <button 
                onClick={() => setTimeframe('ytd')}
                className={`flex-1 py-1.5 text-center rounded-xl transition-all ${
                  timeframe === 'ytd' ? 'bg-white text-[#6B38D4] shadow-xs font-bold' : 'text-stone-600'
                }`}
              >
                Year-to-Date
              </button>
            </div>

            {/* Delightful Insights Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#FEF3C7]/80 via-[#FFE4E6]/60 to-[#EDE9FE]/70 border border-amber-200/60 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
                <span className="text-[16px]">☕</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#1D1B19] leading-tight">Coffee is down 18% this week</p>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  You saved $24! · Average daily spend: <span className="font-bold text-[#6B38D4]">$47.30</span>
                </p>
              </div>
            </div>

            {/* Spending vs Inflow Trend Chart */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D1B19]">Spending &amp; Inflow Pace</span>
                <div className="flex items-center gap-3 text-[11px] text-stone-500 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6B38D4] inline-block" />Spent
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4EDEA3] inline-block" />Inflow
                  </span>
                </div>
              </div>

              {/* Interactive SVG Chart Graphic */}
              <div className="relative w-full h-40 bg-[#FAF8F4]/80 rounded-2xl p-2.5 border border-stone-200/60 flex flex-col justify-end">
                <svg className="w-full h-28 overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 100">
                  <defs>
                    <linearGradient id="primaryBarGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#8455EF" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#D0BCFF" stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="inflowGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4EDEA3" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#4EDEA3" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Guide lines */}
                  <line stroke="#1D1B19" strokeDasharray="3 3" strokeOpacity="0.06" x1="0" x2="320" y1="20" y2="20" />
                  <line stroke="#1D1B19" strokeDasharray="3 3" strokeOpacity="0.06" x1="0" x2="320" y1="50" y2="50" />
                  <line stroke="#1D1B19" strokeDasharray="3 3" strokeOpacity="0.06" x1="0" x2="320" y1="80" y2="80" />

                  {/* Inflow Spline Area */}
                  <path d="M 10 75 Q 55 60, 100 68 T 190 35 T 280 45 L 310 60 L 310 95 L 10 95 Z" fill="url(#inflowGrad)" />
                  <path d="M 10 75 Q 55 60, 100 68 T 190 35 T 280 45 L 310 60" fill="none" stroke="#00714D" strokeLinecap="round" strokeWidth="2" />

                  {/* Bars Mon-Sun */}
                  <rect className="cursor-pointer hover:opacity-80 transition-opacity" fill="url(#primaryBarGrad)" height="47" rx="6" width="16" x="18" y="48" />
                  <rect className="cursor-pointer hover:opacity-80 transition-opacity" fill="url(#primaryBarGrad)" height="63" rx="6" width="16" x="62" y="32" />
                  <rect className="cursor-pointer hover:opacity-80 transition-opacity" fill="url(#primaryBarGrad)" height="30" rx="6" width="16" x="106" y="65" />
                  <rect className="cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-[#6B38D4] ring-offset-1" fill="#6B38D4" height="53" rx="6" width="16" x="150" y="42" />
                  <rect className="cursor-pointer hover:opacity-80 transition-opacity" fill="url(#primaryBarGrad)" height="79" rx="6" width="16" x="194" y="16" />
                  <rect className="cursor-pointer hover:opacity-80 transition-opacity" fill="url(#primaryBarGrad)" height="45" rx="6" width="16" x="238" y="50" />
                  <rect className="cursor-pointer hover:opacity-80 transition-opacity" fill="url(#primaryBarGrad)" height="21" rx="6" width="16" x="282" y="74" />
                </svg>

                <div className="flex justify-between items-center px-1 pt-1 text-[11px] text-stone-500 font-semibold">
                  <span className="w-6 text-center">Mon</span>
                  <span className="w-6 text-center">Tue</span>
                  <span className="w-6 text-center">Wed</span>
                  <span className="w-6 text-center font-bold text-[#6B38D4]">Thu</span>
                  <span className="w-6 text-center">Fri</span>
                  <span className="w-6 text-center">Sat</span>
                  <span className="w-6 text-center">Sun</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown Donut / Pie & Legends */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1D1B19]">Category Breakdown</span>
                <select 
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="pl-2.5 pr-6 py-1 text-[11px] font-semibold rounded-xl bg-stone-100 border border-stone-200 text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#6B38D4] shadow-xs cursor-pointer"
                >
                  <option value="all">🌈 All Categories</option>
                  <option value="food">☕ Food &amp; Cafe (34%)</option>
                  <option value="tech">💻 Tech &amp; Subs (24%)</option>
                  <option value="shopping">🛍️ Shopping (22%)</option>
                  <option value="knowledge">📚 Knowledge (20%)</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-1">
                {/* Donut SVG */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" fill="transparent" r="15.915" stroke="#FEF3C7" strokeWidth="5.5" />
                    <circle cx="21" cy="21" fill="transparent" r="15.915" stroke="#F59E0B" strokeDasharray="34 66" strokeDashoffset="0" strokeWidth="5.5" />
                    <circle cx="21" cy="21" fill="transparent" r="15.915" stroke="#0284C7" strokeDasharray="24 76" strokeDashoffset="-34" strokeWidth="5.5" />
                    <circle cx="21" cy="21" fill="transparent" r="15.915" stroke="#DC2C4F" strokeDasharray="22 78" strokeDashoffset="-58" strokeWidth="5.5" />
                    <circle cx="21" cy="21" fill="transparent" r="15.915" stroke="#6B38D4" strokeDasharray="20 80" strokeDashoffset="-80" strokeWidth="5.5" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="font-['Fraunces',serif] font-bold text-sm text-[#1D1B19] leading-none">$1.4k</span>
                    <span className="text-[10px] text-stone-500 mt-0.5">Total</span>
                  </div>
                </div>

                {/* Legends Grid */}
                <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#1D1B19] leading-tight text-[11px]">Food &amp; Cafe</p>
                      <p className="text-[10px] text-stone-500">34% · $340</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#1D1B19] leading-tight text-[11px]">Tech Subs</p>
                      <p className="text-[10px] text-stone-500">24% · $120</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2C4F] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#1D1B19] leading-tight text-[11px]">Shopping</p>
                      <p className="text-[10px] text-stone-500">22% · $280</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6B38D4] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#1D1B19] leading-tight text-[11px]">Knowledge</p>
                      <p className="text-[10px] text-stone-500">20% · $60</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. FINANCIAL GOALS & SAVINGS TARGETS SYSTEM              */}
        {/* ======================================================== */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[18px]">🌱</span>
              <h2 className="font-['Fraunces',serif] font-bold text-lg text-[#1D1B19]">Financial Goals</h2>
            </div>
            <button 
              onClick={() => setIsLogModalOpen(true)}
              className="text-xs text-[#6B38D4] flex items-center gap-0.5 hover:underline font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Target</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Goal 1: M3 MacBook Air Fund */}
            <div className="p-4 rounded-3xl bg-white border border-stone-200/70 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] flex items-center justify-center text-[22px] shrink-0 shadow-2xs">
                    💻
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-[#1D1B19]">M3 MacBook Air Fund</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] text-[10px] font-bold">
                        Auto-Save
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">+$150 auto-saved every Fri · Midnight starlight</p>
                  </div>
                </div>

                <button 
                  onClick={() => triggerPartyPop('stars')}
                  className="px-3 py-1.5 rounded-xl bg-[#EDE9FE] text-[#6B38D4] text-xs font-bold hover:bg-[#6B38D4] hover:text-white transition-all active:scale-95 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>Deposit
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-[#1D1B19] font-bold text-sm">$1,050 <span className="font-normal text-stone-500 text-xs">/ $1,400</span></span>
                  <span className="text-[#0284C7] font-bold">75% achieved</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden border border-stone-200/60">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#0284C7] to-[#6B38D4] transition-all duration-500" style={{ width: '75%' }} />
                </div>
              </div>
            </div>

            {/* Goal 2: Kyoto Trip */}
            <div className="p-4 rounded-3xl bg-white border border-stone-200/70 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#FFE4E6] flex items-center justify-center text-[22px] shrink-0 shadow-2xs">
                    🍁
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-[#1D1B19]">Kyoto Autumn Trip</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#B90538] text-[10px] font-bold">
                        Target Nov
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">$600 of $1,200 saved</p>
                  </div>
                </div>

                <button 
                  onClick={() => triggerPartyPop('stars')}
                  className="px-3 py-1.5 rounded-xl bg-[#EDE9FE] text-[#6B38D4] text-xs font-bold hover:bg-[#6B38D4] hover:text-white transition-all active:scale-95 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>Deposit
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-xs font-semibold">
                  <span className="text-[#1D1B19] font-bold text-sm">$600 <span className="font-normal text-stone-500 text-xs">/ $1,200</span></span>
                  <span className="text-[#B90538] font-bold">50% achieved</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden border border-stone-200/60">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#FFE4E6] to-[#B90538] transition-all duration-500" style={{ width: '50%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. MONTHLY CATEGORY ALLOWANCES                           */}
        {/* ======================================================== */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px]">🌿</span>
              <h2 className="font-['Fraunces',serif] font-bold text-lg text-[#1D1B19]">Category Allowances</h2>
            </div>
            <button className="text-xs text-[#6B38D4] flex items-center gap-0.5 font-bold hover:underline">
              <span>Edit Caps</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Food & Cafe */}
            <div className="relative overflow-hidden p-4 rounded-3xl bg-[#FEF3C7]/80 flex flex-col justify-between shadow-xs border border-amber-200/50 min-h-[135px]">
              <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[64px] text-[#F59E0B]/15 select-none pointer-events-none">
                local_cafe
              </span>
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-2xs">
                  <span className="text-[18px]">☕</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-stone-800">
                  68%
                </span>
              </div>
              <div className="relative z-10">
                <span className="text-xs font-bold text-[#1D1B19] block">Food &amp; Cafe</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-['Fraunces',serif] font-bold text-sm text-[#1D1B19]">$340</span>
                  <span className="text-[11px] text-stone-500">/ $500</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
                  <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: '68%' }} />
                </div>
              </div>
            </div>

            {/* Tech & Subs */}
            <div className="relative overflow-hidden p-4 rounded-3xl bg-[#E0F2FE]/80 flex flex-col justify-between shadow-xs border border-sky-200/50 min-h-[135px]">
              <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[64px] text-[#0284C7]/15 select-none pointer-events-none">
                laptop_mac
              </span>
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-2xs">
                  <span className="text-[18px]">💻</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-stone-800">
                  80%
                </span>
              </div>
              <div className="relative z-10">
                <span className="text-xs font-bold text-[#1D1B19] block">Tech Subs</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-['Fraunces',serif] font-bold text-sm text-[#1D1B19]">$120</span>
                  <span className="text-[11px] text-stone-500">/ $150</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
                  <div className="h-full rounded-full bg-[#0284C7]" style={{ width: '80%' }} />
                </div>
              </div>
            </div>

            {/* Shopping */}
            <div className="relative overflow-hidden p-4 rounded-3xl bg-[#FFE4E6]/80 flex flex-col justify-between shadow-xs border border-rose-200/50 min-h-[135px]">
              <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[64px] text-[#DC2C4F]/15 select-none pointer-events-none">
                shopping_bag
              </span>
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-2xs">
                  <span className="text-[18px]">🛍️</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-stone-800">
                  70%
                </span>
              </div>
              <div className="relative z-10">
                <span className="text-xs font-bold text-[#1D1B19] block">Shopping</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-['Fraunces',serif] font-bold text-sm text-[#1D1B19]">$280</span>
                  <span className="text-[11px] text-stone-500">/ $400</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
                  <div className="h-full rounded-full bg-[#DC2C4F]" style={{ width: '70%' }} />
                </div>
              </div>
            </div>

            {/* Knowledge */}
            <div className="relative overflow-hidden p-4 rounded-3xl bg-[#EDE9FE]/80 flex flex-col justify-between shadow-xs border border-purple-200/50 min-h-[135px]">
              <span className="material-symbols-outlined absolute -bottom-3 -right-2 text-[64px] text-[#6B38D4]/15 select-none pointer-events-none">
                auto_stories
              </span>
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-2xs">
                  <span className="text-[18px]">📚</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-stone-800">
                  60%
                </span>
              </div>
              <div className="relative z-10">
                <span className="text-xs font-bold text-[#1D1B19] block">Knowledge</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-['Fraunces',serif] font-bold text-sm text-[#1D1B19]">$60</span>
                  <span className="text-[11px] text-stone-500">/ $100</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
                  <div className="h-full rounded-full bg-[#6B38D4]" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. RECENT LEDGER / TRANSACTIONS SECTION                   */}
        {/* ======================================================== */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px]">🧾</span>
              <h2 className="font-['Fraunces',serif] font-bold text-lg text-[#1D1B19]">Recent Logs</h2>
            </div>
            <button className="text-xs text-[#6B38D4] flex items-center gap-0.5 font-bold hover:underline">
              <span>View Full Statement</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm border border-stone-200/70 space-y-2">
            {/* Tx 1: Figma Subscription */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#EDE9FE] flex items-center justify-center text-[#6B38D4] shrink-0 font-bold">
                  <span className="material-symbols-outlined text-[20px]">brush</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-[#1D1B19] truncate">Figma Pro Subscription</h3>
                  <p className="text-[11px] text-stone-500 truncate">Tools &amp; Creative · Today, 11:20 AM</p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-xs font-bold text-[#1D1B19] block">-$15.00</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 inline-block">Card</span>
              </div>
            </div>

            {/* Tx 2: Coffee */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-[#F59E0B] shrink-0 font-bold">
                  <span className="material-symbols-outlined text-[20px]">coffee</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-[#1D1B19] truncate">Coffee with Friends ☕</h3>
                  <p className="text-[11px] text-stone-500 truncate">Cafe Corner · Yesterday</p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-xs font-bold text-[#1D1B19] block">-$8.50</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 inline-block">ApplePay</span>
              </div>
            </div>

            {/* Tx 3: Freelance Payout */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#D1FAE5] flex items-center justify-center text-[#006C49] shrink-0 font-bold">
                  <span className="material-symbols-outlined text-[20px]">paid</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-[#1D1B19] truncate">Freelance Design Payout</h3>
                  <p className="text-[11px] text-stone-500 truncate">Stripe Transfer · 2 days ago</p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-xs font-bold text-[#006C49] block">+$850.00</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#D1FAE5] text-[#005236] inline-block font-semibold">Settled</span>
              </div>
            </div>

            {/* User Added Transactions */}
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                    tx.type === 'income' ? 'bg-[#D1FAE5] text-[#006C49]' : 'bg-[#FFE4E6] text-[#B90538]'
                  }`}>
                    <span>{tx.categoryIcon || '💰'}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-[#1D1B19] truncate">{tx.note || tx.category}</h3>
                    <p className="text-[11px] text-stone-500 truncate">{tx.category} · {tx.date}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2 flex items-center gap-2">
                  <span className={`text-xs font-bold block ${tx.type === 'income' ? 'text-[#006C49]' : 'text-[#1D1B19]'}`}>
                    {tx.type === 'income' ? '+' : '-'}{currency}{tx.amount.toFixed(2)}
                  </span>
                  {onDeleteTransaction && (
                    <button 
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="text-stone-400 hover:text-red-500 p-1 text-xs"
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Add Log Expense Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6B38D4] flex items-center justify-center font-bold">
                  👛
                </div>
                <h3 className="font-['Fraunces',serif] font-bold text-lg text-stone-900">
                  Log Entry
                </h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Inflow vs Outflow toggle */}
            <div className="flex p-1 rounded-2xl bg-stone-100 border border-stone-200/60">
              <button
                type="button"
                onClick={() => setLogType('expense')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
                  logType === 'expense' ? 'bg-white text-[#B90538] shadow-xs' : 'text-stone-600'
                }`}
              >
                Expense (Spent)
              </button>
              <button
                type="button"
                onClick={() => setLogType('income')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all ${
                  logType === 'income' ? 'bg-white text-[#006C49] shadow-xs' : 'text-stone-600'
                }`}
              >
                Income (Inflow)
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Amount ({currency})</label>
              <input
                type="number"
                step="0.01"
                value={logAmount}
                onChange={(e) => setLogAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 text-base font-bold text-[#1D1B19] focus:outline-none focus:ring-2 focus:ring-[#6B38D4]"
                autoFocus
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Category</label>
              <select
                value={logCategory}
                onChange={(e) => setLogCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#6B38D4]"
              >
                <option value="Food & Cafe">☕ Food &amp; Cafe</option>
                <option value="Tech Subs">💻 Tech &amp; Subscriptions</option>
                <option value="Shopping">🛍️ Shopping &amp; Fun</option>
                <option value="Knowledge">📚 Knowledge &amp; Books</option>
                <option value="Travel">🚕 Travel &amp; Transport</option>
                <option value="Income / Salary">💵 Income / Salary</option>
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">Note / Description</label>
              <input
                type="text"
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="e.g. Afternoon latte, Figma plan"
                className="w-full px-3.5 py-2 rounded-2xl border border-stone-200 text-xs text-[#1D1B19] focus:outline-none focus:ring-2 focus:ring-[#6B38D4]"
              />
            </div>

            <button
              onClick={handleSaveExpense}
              className="w-full py-3 rounded-full bg-[#6B38D4] text-white font-bold text-xs shadow-md shadow-purple-500/25 active:scale-95 transition-all mt-2"
            >
              Save Transaction ✨
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
