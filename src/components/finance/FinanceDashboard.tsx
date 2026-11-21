import React, { useState, useMemo, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { 
  FinanceTransaction, 
  FinanceCategory, 
  TransactionType 
} from '../../types/finance';
import type { WorkspaceView } from '../../types';
import { playPopSound } from '../../utils/delight';
import { useScrollVisibility } from '../../utils/useScrollVisibility';
import avatarImg from '../../assets/avatar.jpg';

export interface FinanceDashboardProps {
  transactions: FinanceTransaction[];
  categories?: FinanceCategory[];
  currency?: string;
  onChangeCurrency?: (symbol: string) => void;
  onOpenAddModal?: (type?: TransactionType, category?: FinanceCategory) => void;
  onEditTransaction?: (tx: FinanceTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onSaveCategory?: (cat: FinanceCategory) => void;
  onDeleteCategory?: (id: string) => void;
  onQuickAdd?: (tx: Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onNavigate?: (view: WorkspaceView) => void;
  onLock?: () => void;
}

const FINANCE_TX_KEY = 'orbit_finance_transactions_v1';
const CATEGORIES_KEY = 'sreesh-finance-categories-v2';
const GOALS_KEY = 'sreesh-goals-list-v2';

interface FinancialGoalDef {
  id: string;
  title: string;
  emoji: string;
  targetDate?: string;
  tag?: string;
  tagColor?: string;
  subtitle: string;
  current: number;
  target: number;
  gradient: string;
}

interface ExpenseCategoryDef {
  id: string;
  key: string;
  name: string;
  emoji: string;
  icon: string;
  cap?: number;
  bg: string;
  iconColor: string;
  barColor: string;
}

const DEFAULT_CATEGORIES: ExpenseCategoryDef[] = [];

const DEFAULT_INITIAL_TRANSACTIONS: FinanceTransaction[] = [];

export function matchesCategory(tx: FinanceTransaction, cat: { name: string; key?: string }): boolean {
  if (!tx.category) return false;
  const tCat = tx.category.toLowerCase().trim();
  const cName = cat.name.toLowerCase().trim();
  const cKey = (cat.key || '').toLowerCase().trim();
  if (tCat === cName || tCat === cKey) return true;
  if (cKey && tCat.includes(cKey)) return true;
  if (cName.includes(tCat) || tCat.includes(cName)) return true;
  if (cName.includes('food') && (tCat.includes('food') || tCat.includes('cafe') || tCat.includes('coffee') || tCat.includes('dining') || tCat.includes('grocer'))) return true;
  if (cName.includes('tech') && (tCat.includes('tech') || tCat.includes('sub') || tCat.includes('software') || tCat.includes('cloud'))) return true;
  if (cName.includes('shop') && (tCat.includes('shop') || tCat.includes('cloth') || tCat.includes('retail'))) return true;
  if (cName.includes('know') && (tCat.includes('know') || tCat.includes('book') || tCat.includes('course') || tCat.includes('learn'))) return true;
  return false;
}

/**
 * Calculates remaining days from today until target date.
 */
export function calculateDaysRemaining(targetDateStr?: string): { days: number; label: string; isPast: boolean } {
  if (!targetDateStr) {
    return { days: 0, label: 'No deadline', isPast: false };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  if (isNaN(target.getTime())) {
    return { days: 0, label: targetDateStr, isPast: false };
  }

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { days: 0, label: 'Due today! 🎯', isPast: false };
  } else if (diffDays === 1) {
    return { days: 1, label: '1 day left', isPast: false };
  } else if (diffDays > 1) {
    return { days: diffDays, label: `${diffDays} days left`, isPast: false };
  } else {
    return { days: diffDays, label: `Expired ${Math.abs(diffDays)}d ago`, isPast: true };
  }
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  transactions = [],
  currency = '₹',
  onQuickAdd,
  onDeleteTransaction,
  onLock,
}) => {
  const TODAY = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const isHeaderVisible = useScrollVisibility();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Sound & celebration
  const triggerCelebration = () => {
    try {
      playPopSound();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6B38D4', '#006C49', '#DE3B78', '#F59E0B', '#0284C7']
      });
    } catch {}
  };

  // 1. DYNAMIC TRANSACTIONS STATE (Synchronized with localStorage & props)
  const [localTransactions, setLocalTransactions] = useState<FinanceTransaction[]>(() => {
    if (transactions && transactions.length > 0) return transactions;
    try {
      const saved = localStorage.getItem(FINANCE_TX_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      setLocalTransactions(transactions);
    }
  }, [transactions]);

  const saveTransactionsState = (next: FinanceTransaction[]) => {
    setLocalTransactions(next);
    try {
      localStorage.setItem(FINANCE_TX_KEY, JSON.stringify(next));
    } catch {}
  };

  // 2. DYNAMIC EXPENSE CATEGORIES LIST (WITH CAP SYSTEM)
  const [categoriesList, setCategoriesList] = useState<ExpenseCategoryDef[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_KEY) || localStorage.getItem('sreesh-allowances-list-v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => ({
            id: c.id || 'cat-' + Math.random(),
            key: c.key || c.name.toLowerCase().replace(/\s+/g, '-'),
            name: c.name,
            emoji: c.emoji || '✨',
            icon: c.icon || 'category',
            cap: Number(c.cap) > 0 ? Number(c.cap) : 500,
            bg: c.bg || 'bg-lavender-subtle/80',
            iconColor: c.iconColor || 'text-primary/15',
            barColor: c.barColor || 'bg-primary',
          }));
        }
      }
    } catch {}
    return DEFAULT_CATEGORIES;
  });

  const saveCategoriesList = (next: ExpenseCategoryDef[]) => {
    setCategoriesList(next);
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(next));
    } catch {}
  };

  // 3. FINANCIAL GOALS STATE WITH ACTUAL DATE AND REMAINING CALCULATION
  const [goalsList, setGoalsList] = useState<FinancialGoalDef[]>(() => {
    try {
      const saved = localStorage.getItem(GOALS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const saveGoalsList = (next: FinancialGoalDef[]) => {
    setGoalsList(next);
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(next));
    } catch {}
  };

  // UI / Filter States
  const [showBalance, setShowBalance] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'ytd'>('week');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [hoveredBar, setHoveredBar] = useState<{ day: string; spent: string; inflow: string } | null>(null);

  // Modals state
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [activeGoalForDeposit, setActiveGoalForDeposit] = useState<FinancialGoalDef | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState('50');

  // Deletion Confirmation State (REQUIRED FOR LOG DELETION)
  const [transactionToDelete, setTransactionToDelete] = useState<FinanceTransaction | null>(null);

  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [selectedCategoryForSpendView, setSelectedCategoryForSpendView] = useState<ExpenseCategoryDef | null>(null);
  const [isFullStatementOpen, setIsFullStatementOpen] = useState(false);
  const [statementFilter, setStatementFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [statementSearch, setStatementSearch] = useState('');

  // Quick Log form state (ONLY user created categories)
  const [logType, setLogType] = useState<'expense' | 'income' | 'goal'>('expense');
  const [logCategory, setLogCategory] = useState<string>(() => {
    return categoriesList[0]?.name || '';
  });
  const [rawDigits, setRawDigits] = useState('0');
  const [logNote, setLogNote] = useState('');

  // Keep logCategory synchronized to available categories
  useEffect(() => {
    if (categoriesList.length > 0) {
      if (!logCategory || !categoriesList.some((c) => c.name === logCategory)) {
        setLogCategory(categoriesList[0].name);
      }
    } else {
      setLogCategory('');
    }
  }, [categoriesList, logCategory]);

  // Add Category form state (WITH CAP)
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');
  const [newCatCap, setNewCatCap] = useState('500');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [editingCapId, setEditingCapId] = useState<string | null>(null);
  const [editingCapValue, setEditingCapValue] = useState('');

  // New goal form state (Actual date input)
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalEmoji, setNewGoalEmoji] = useState('🎯');
  const [newGoalTarget, setNewGoalTarget] = useState('1000');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('2026-12-31');

  // Recent logs tab filter
  const [recentLogsFilter, setRecentLogsFilter] = useState<'all' | 'expense' | 'income'>('all');

  // ========================================================
  // CORE DYNAMIC TOTALS & BALANCES (NO MONTHLY CAP)
  // ========================================================
  const { totalInflow, totalSpent, netBalance, netCashFlow } = useMemo(() => {
    let inflow = 0;
    let spent = 0;

    localTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        inflow += amt;
      } else {
        spent += amt;
      }
    });

    const startingReserve = 0;
    const net = startingReserve + inflow - spent;
    const cashFlow = inflow - spent;

    return {
      totalInflow: Math.round(inflow),
      totalSpent: Math.round(spent),
      netBalance: Math.round(net),
      netCashFlow: Math.round(cashFlow),
    };
  }, [localTransactions]);

  // Keypad formatted amount
  const displayAmount = useMemo(() => {
    if (!rawDigits || rawDigits === '0') return '0';
    return parseInt(rawDigits, 10).toLocaleString('en-IN');
  }, [rawDigits]);

  const handleKeypadPress = (key: string) => {
    playPopSound();
    if (key === 'backspace') {
      setRawDigits((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (key === '00') {
      if (rawDigits !== '0' && rawDigits.length < 7) {
        setRawDigits((prev) => prev + '00');
      }
    } else if (key >= '0' && key <= '9') {
      if (rawDigits.length < 8) {
        setRawDigits((prev) => (prev === '0' ? key : prev + key));
      }
    }
  };

  const handlePresetAdd = (amountRupees: number) => {
    playPopSound();
    const current = parseInt(rawDigits || '0', 10);
    setRawDigits(String(current + amountRupees));
  };

  // Submit Quick Log
  const handleSubmitTransaction = () => {
    const intAmt = parseInt(rawDigits || '0', 10);
    if (intAmt <= 0) return;

    if (categoriesList.length === 0) {
      alert('Please create a category first before adding an expense or income!');
      setIsManageCategoriesModalOpen(true);
      setIsAddingNewCat(true);
      return;
    }

    const chosenCat = categoriesList.find((c) => c.name === logCategory) || categoriesList[0];
    const catName = chosenCat?.name || logCategory || 'General';
    const catIcon = chosenCat?.emoji || '✨';

    const newTx: FinanceTransaction = {
      id: 'tx-' + Date.now(),
      type: logType === 'income' ? 'income' : 'expense',
      amount: intAmt,
      category: catName,
      categoryIcon: catIcon,
      note: logNote.trim() || catName,
      merchant: catName,
      date: TODAY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextTxs = [newTx, ...localTransactions];
    saveTransactionsState(nextTxs);

    if (onQuickAdd) {
      onQuickAdd({
        type: newTx.type,
        amount: newTx.amount,
        category: newTx.category,
        categoryIcon: newTx.categoryIcon,
        note: newTx.note,
        date: newTx.date,
        merchant: newTx.merchant,
      });
    }

    triggerCelebration();
    setRawDigits('0');
    setLogNote('');
    setIsQuickLogOpen(false);
  };

  // Confirmed Delete a transaction
  const handleConfirmDeleteTransaction = () => {
    if (!transactionToDelete) return;
    playPopSound();
    const id = transactionToDelete.id;
    const next = localTransactions.filter((tx) => tx.id !== id);
    saveTransactionsState(next);
    if (onDeleteTransaction) {
      onDeleteTransaction(id);
    }
    setTransactionToDelete(null);
  };

  // Handle Goal Deposit
  const handleOpenDepositModal = (goal: FinancialGoalDef) => {
    playPopSound();
    setActiveGoalForDeposit(goal);
    setDepositAmountInput('50');
    setIsDepositModalOpen(true);
  };

  const handleConfirmDeposit = () => {
    if (!activeGoalForDeposit) return;
    const amt = parseFloat(depositAmountInput);
    if (amt > 0) {
      const next = goalsList.map((g) => {
        if (g.id === activeGoalForDeposit.id) {
          return { ...g, current: Math.min(g.target, g.current + amt) };
        }
        return g;
      });
      saveGoalsList(next);
      triggerCelebration();
    }
    setIsDepositModalOpen(false);
    setActiveGoalForDeposit(null);
  };

  // Handle Add New Goal (Calculates remaining days from targetDate)
  const handleCreateNewGoal = () => {
    const title = newGoalTitle.trim();
    const target = parseFloat(newGoalTarget);
    if (!title || !(target > 0)) return;

    const formattedTarget = newGoalTargetDate || '2026-12-31';

    const next = [
      ...goalsList,
      {
        id: 'goal-' + Date.now(),
        title,
        emoji: newGoalEmoji || '🎯',
        targetDate: formattedTarget,
        subtitle: `₹0 of ₹${target.toLocaleString('en-IN')} saved · Target: ${formattedTarget}`,
        current: 0,
        target,
        gradient: 'from-primary to-primary-container',
      },
    ];

    saveGoalsList(next);
    triggerCelebration();
    setNewGoalTitle('');
    setIsAddGoalModalOpen(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    playPopSound();
    const next = goalsList.filter((g) => g.id !== goalId);
    saveGoalsList(next);
  };

  // Handle Category Management (WITH CAP)
  const handleDeleteCategory = (id: string) => {
    playPopSound();
    const next = categoriesList.filter((a) => a.id !== id);
    saveCategoriesList(next);
    if (selectedCategoryForSpendView?.id === id) {
      setSelectedCategoryForSpendView(null);
    }
  };

  const handleUpdateCap = (id: string, newCap: number) => {
    if (newCap <= 0) return;
    const next = categoriesList.map((c) => (c.id === id ? { ...c, cap: newCap } : c));
    saveCategoriesList(next);
    if (selectedCategoryForSpendView && selectedCategoryForSpendView.id === id) {
      setSelectedCategoryForSpendView({ ...selectedCategoryForSpendView, cap: newCap });
    }
    setEditingCapId(null);
    triggerCelebration();
  };

  const handleAddNewCategory = () => {
    if (!newCatName.trim()) return;
    const capNum = parseInt(newCatCap.replace(/[^0-9]/g, ''), 10) || 500;
    const colorThemes = [
      { bg: 'bg-sunshine-subtle/80', iconColor: 'text-sunshine-accent/15', barColor: 'bg-sunshine-accent', icon: 'local_cafe' },
      { bg: 'bg-sky-subtle/80', iconColor: 'text-sky-accent/15', barColor: 'bg-sky-accent', icon: 'laptop_mac' },
      { bg: 'bg-peach-subtle/80', iconColor: 'text-tertiary-container/15', barColor: 'bg-tertiary-container', icon: 'shopping_bag' },
      { bg: 'bg-lavender-subtle/80', iconColor: 'text-primary/15', barColor: 'bg-primary', icon: 'menu_book' },
      { bg: 'bg-mint-subtle/80', iconColor: 'text-secondary/15', barColor: 'bg-secondary', icon: 'eco' },
    ];
    const theme = colorThemes[categoriesList.length % colorThemes.length];

    const newCat: ExpenseCategoryDef = {
      id: 'cat-' + Date.now(),
      key: newCatName.toLowerCase().replace(/\s+/g, '-'),
      name: newCatName.trim(),
      emoji: newCatEmoji.trim() || '✨',
      icon: theme.icon,
      cap: capNum,
      bg: theme.bg,
      iconColor: theme.iconColor,
      barColor: theme.barColor,
    };
    const next = [...categoriesList, newCat];
    saveCategoriesList(next);
    setLogCategory(newCat.name);
    setNewCatName('');
    setNewCatCap('500');
    setIsAddingNewCat(false);
    triggerCelebration();
  };

  // ========================================================
  // ANALYTICS & INSIGHTS: DYNAMIC PACE & CATEGORY BREAKDOWN
  // ========================================================
  const analyticsData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    const filtered = localTransactions.filter((tx) => {
      if (!tx.date) return true;
      if (timeframe === 'month') {
        return tx.date.startsWith(`${currentYear}-${currentMonth}`);
      }
      if (timeframe === 'ytd') {
        return tx.date.startsWith(`${currentYear}`);
      }
      // 'week'
      const txTime = new Date(tx.date).getTime();
      const weekAgo = now.getTime() - 7 * 86400000;
      return txTime >= weekAgo;
    });

    const expensesOnly = filtered.filter((tx) => (tx.type as string) !== 'income');
    const totalExpPeriod = expensesOnly.reduce((s, tx) => s + (Number(tx.amount) || 0), 0);

    // Days of the week: Mon - Sun
    const daysLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDayIdx = (now.getDay() + 6) % 7;

    const weeklyData = daysLabel.map((day, idx) => {
      const dayTxs = filtered.filter((tx) => {
        if (!tx.date) return false;
        const d = new Date(tx.date);
        const dow = (d.getDay() + 6) % 7;
        return dow === idx;
      });

      const daySpent = dayTxs
        .filter((tx) => (tx.type as string) !== 'income')
        .reduce((s, tx) => s + (Number(tx.amount) || 0), 0);

      const dayInflow = dayTxs
        .filter((tx) => tx.type === 'income')
        .reduce((s, tx) => s + (Number(tx.amount) || 0), 0);

      return {
        day,
        isToday: idx === currentDayIdx,
        spent: Math.round(daySpent),
        inflow: Math.round(dayInflow),
      };
    });

    const maxPaceVal = Math.max(10, ...weeklyData.map((d) => Math.max(d.spent, d.inflow)));

    // Category Breakdown (Donut & Legends)
    const categoryTotals: Record<string, { name: string; emoji: string; amount: number; color: string }> = {};

    categoriesList.forEach((cat) => {
      categoryTotals[cat.name] = {
        name: cat.name,
        emoji: cat.emoji,
        amount: 0,
        color: cat.barColor.replace('bg-', '') || '#6b38d4',
      };
    });

    expensesOnly.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      let matched = false;
      for (const cat of categoriesList) {
        if (matchesCategory(tx, cat)) {
          categoryTotals[cat.name].amount += amt;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const otherKey = tx.category || 'Other';
        if (!categoryTotals[otherKey]) {
          categoryTotals[otherKey] = {
            name: otherKey,
            emoji: '✨',
            amount: 0,
            color: '#8b5cf6',
          };
        }
        categoryTotals[otherKey].amount += amt;
      }
    });

    const categoriesArray = Object.values(categoryTotals).map((cat) => {
      const pct = totalExpPeriod > 0 ? Math.round((cat.amount / totalExpPeriod) * 100) : 0;
      return {
        ...cat,
        pct,
      };
    }).sort((a, b) => b.amount - a.amount);

    // Compute SVG donut strokes
    let cumulativePct = 0;
    const donutSlices = categoriesArray.filter((c) => c.pct > 0).map((c) => {
      const strokeDasharray = `${c.pct} ${100 - c.pct}`;
      const strokeDashoffset = -cumulativePct;
      cumulativePct += c.pct;

      let hexColor = '#8b5cf6';
      if (c.name.toLowerCase().includes('food')) hexColor = '#F59E0B';
      else if (c.name.toLowerCase().includes('tech')) hexColor = '#0284C7';
      else if (c.name.toLowerCase().includes('shop')) hexColor = '#dc2c4f';
      else if (c.name.toLowerCase().includes('know')) hexColor = '#6b38d4';

      return {
        ...c,
        strokeDasharray,
        strokeDashoffset,
        hexColor,
      };
    });

    const topCategory = categoriesArray[0];
    const avgDaily = Math.round(totalExpPeriod / 7);

    return {
      totalExpPeriod: Math.round(totalExpPeriod),
      weeklyData,
      maxPaceVal,
      categoriesArray,
      donutSlices,
      topCategory,
      avgDaily,
    };
  }, [localTransactions, categoriesList, timeframe]);

  // Selected Category's expenses for Full Breakdown Modal
  const categoryExpensesForModal = useMemo(() => {
    if (!selectedCategoryForSpendView) return [];
    return localTransactions.filter(
      (tx) => (tx.type as string) !== 'income' && matchesCategory(tx, selectedCategoryForSpendView)
    );
  }, [localTransactions, selectedCategoryForSpendView]);

  const selectedCategorySpentTotal = useMemo(() => {
    return categoryExpensesForModal.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [categoryExpensesForModal]);

  return (
    <div className="bg-canvas-bg font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen">
      
      {/* ======================================================== */}
      {/* 1. FIXED TOP HEADER                                      */}
      {/* ======================================================== */}
      <header className={`fixed top-0 w-full z-40 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
      }`}>
        <div className="h-20 px-space-lg flex items-center justify-between gap-space-sm max-w-lg mx-auto">
          <div className="flex items-center gap-space-md">
            <div className="relative flex items-center justify-center">
              <img 
                src={avatarImg} 
                alt="Profile avatar" 
                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-primary-fixed"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary-container rounded-full flex items-center justify-center shadow-sm text-[9px]">
                ✨
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none font-fraunces">
                  Finances &amp; Analytics
                </span>
              </div>
              <div className="flex items-center gap-space-xs mt-space-xs">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-peach-subtle/80 text-on-tertiary-fixed-variant font-label-sm text-label-sm shadow-[0_1px_4px_rgba(220,44,79,0.08)]">
                  <span>✨ Live Finance Flow</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-space-xs">
            <button 
              onClick={() => {
                playPopSound();
                setShowAnalytics(true);
                setTimeout(() => analyticsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle hover:text-primary transition-colors shadow-[0_2px_6px_rgba(21,19,17,0.04)] active:scale-95 cursor-pointer"
              title="Search and Analytics"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
            <button 
              onClick={() => {
                playPopSound();
                setIsNotificationOpen(true);
              }}
              className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center text-on-surface-variant hover:bg-lavender-subtle hover:text-primary transition-colors shadow-[0_2px_6px_rgba(21,19,17,0.04)] active:scale-95 cursor-pointer"
              title="Sanctuary Updates"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN FINANCE CANVAS                                   */}
      {/* ======================================================== */}
      <main className="flex flex-col relative w-full pt-20 pb-36 bg-canvas-bg min-h-screen">
        <div className="flex flex-col w-full px-margin-mobile space-y-space-lg max-w-lg mx-auto">
          
          {/* Primary Balance & Cash Flow Card (NO MONTHLY CAP) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lavender-subtle via-surface-card to-sky-subtle p-space-xl shadow-[0_8px_24px_-4px_rgba(139,92,246,0.12)] border border-border-subtle mt-2">
            <span 
              className="material-symbols-outlined absolute -bottom-6 -right-4 text-[130px] text-primary/10 select-none pointer-events-none" 
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              savings
            </span>

            <div className="relative z-10 flex flex-col space-y-space-md">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-card/90 shadow-sm backdrop-blur-sm">
                  <span className="text-[14px]">👛</span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-semibold">Personal Net Balance</span>
                </div>
                <button 
                  onClick={() => {
                    playPopSound();
                    setShowBalance(!showBalance);
                  }}
                  className="w-8 h-8 rounded-full bg-surface-card/80 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-95 cursor-pointer shadow-xs" 
                  id="toggleBalanceBtn"
                  title={showBalance ? 'Hide balance' : 'Show balance'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showBalance ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>

              <div>
                <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface tracking-tight font-fraunces" id="netBalanceValue">
                  {showBalance ? `${currency}${netBalance.toLocaleString('en-IN')}` : '••••••••'}
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Live synchronized · Direct transaction ledger
                </p>
              </div>

              {/* Income & Outflow Badges */}
              <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
                <div className="flex items-center gap-space-sm p-space-sm rounded-2xl bg-surface-card/95 shadow-sm border border-border-subtle">
                  <div className="w-8 h-8 rounded-full bg-mint-subtle flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[16px] font-bold">arrow_downward</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Inflow</span>
                    <span className="font-label-lg text-label-lg text-secondary truncate font-bold">
                      +{currency}{totalInflow.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-space-sm p-space-sm rounded-2xl bg-surface-card/95 shadow-sm border border-border-subtle">
                  <div className="w-8 h-8 rounded-full bg-peach-subtle flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[16px] font-bold">arrow_upward</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">Spent</span>
                    <span className="font-label-lg text-label-lg text-tertiary truncate font-bold">
                      -{currency}{totalSpent.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cash Flow Balance Row (NO CAP) */}
              <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border-t border-border-subtle/50 mt-1">
                <span className="flex items-center gap-1 font-semibold text-xs">
                  <span>✨</span> Net Cash Flow
                </span>
                <span className={`font-bold font-mono text-xs ${netCashFlow >= 0 ? 'text-secondary' : 'text-primary'}`}>
                  {netCashFlow >= 0 ? '+' : '-'}{currency}{Math.abs(netCashFlow).toLocaleString('en-IN')} this period
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Controls */}
          <div className="grid grid-cols-2 gap-space-sm">
            <button 
              onClick={() => {
                playPopSound();
                setIsQuickLogOpen(true);
              }}
              className="flex items-center justify-center gap-2 p-space-md rounded-2xl bg-primary text-on-primary shadow-[0_4px_16px_rgba(107,56,212,0.25)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer font-semibold" 
              id="quickLogBtn"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span className="font-label-md text-label-md tracking-tight">Log Expense</span>
            </button>

            <button 
              onClick={() => {
                playPopSound();
                setShowAnalytics(!showAnalytics);
              }}
              className={`flex items-center justify-center gap-2 p-space-md rounded-2xl shadow-[0_4px_12px_rgba(21,19,17,0.04)] active:scale-95 transition-all cursor-pointer border font-semibold ${
                showAnalytics 
                  ? 'bg-primary text-on-primary border-primary shadow-[0_4px_16px_rgba(107,56,212,0.25)]' 
                  : 'bg-surface-card text-on-surface border-border-subtle hover:bg-lavender-subtle hover:text-primary'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${showAnalytics ? 'text-on-primary' : 'text-primary'}`}>
                {showAnalytics ? 'visibility_off' : 'pie_chart'}
              </span>
              <span className="font-label-md text-label-md tracking-tight">
                {showAnalytics ? 'Hide Analytics' : 'Analytics View'}
              </span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* 3. DYNAMIC ANALYTICS & INSIGHTS (Always synced with data) */}
          {/* ======================================================== */}
          {showAnalytics && (
            <div ref={analyticsRef} className="flex flex-col space-y-space-sm pt-space-xs animate-in fade-in slide-in-from-top-3 duration-300" id="analyticsSection">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[18px]">📊</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-fraunces">Analytics &amp; Insights</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-lavender-subtle text-primary font-label-sm text-label-sm font-semibold">
                  Live Sparkle
                </span>
              </div>

              <div className="rounded-3xl bg-surface-card p-space-lg shadow-[0_8px_24px_-4px_rgba(139,92,246,0.08),0_2px_6px_-1px_rgba(21,19,17,0.04)] space-y-space-md border border-border-subtle">
                {/* Timeframe Tabs */}
                <div className="flex p-1 rounded-2xl bg-canvas-bg border border-border-subtle" role="tablist">
                  <button 
                    onClick={() => { playPopSound(); setTimeframe('week'); }}
                    className={`analytics-tab flex-1 py-1.5 text-center font-label-sm text-label-sm rounded-xl transition-all cursor-pointer ${
                      timeframe === 'week' ? 'bg-surface-card text-primary shadow-xs font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    This Week
                  </button>
                  <button 
                    onClick={() => { playPopSound(); setTimeframe('month'); }}
                    className={`analytics-tab flex-1 py-1.5 text-center font-label-sm text-label-sm rounded-xl transition-all cursor-pointer ${
                      timeframe === 'month' ? 'bg-surface-card text-primary shadow-xs font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    This Month
                  </button>
                  <button 
                    onClick={() => { playPopSound(); setTimeframe('ytd'); }}
                    className={`analytics-tab flex-1 py-1.5 text-center font-label-sm text-label-sm rounded-xl transition-all cursor-pointer ${
                      timeframe === 'ytd' ? 'bg-surface-card text-primary shadow-xs font-bold' : 'text-on-surface-variant'
                    }`}
                  >
                    Year-to-Date
                  </button>
                </div>

                {/* Dynamic Delightful Insights Banner */}
                <div className="p-space-sm rounded-2xl bg-gradient-to-r from-sunshine-subtle/80 via-peach-subtle/60 to-lavender-subtle/70 border border-sunshine-accent/20 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-surface-card flex items-center justify-center flex-shrink-0 shadow-xs">
                    <span className="text-[16px]">{analyticsData.topCategory?.emoji || '☕'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                      {analyticsData.topCategory 
                        ? `${analyticsData.topCategory.name} is your top expense (${analyticsData.topCategory.pct}% of period)`
                        : 'Spending is calm and balanced'}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Period Total: <span className="font-bold text-primary">{currency}{analyticsData.totalExpPeriod.toLocaleString('en-IN')}</span> · Daily average: {currency}{analyticsData.avgDaily.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Spending vs Inflow Trend Chart */}
                <div className="space-y-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Spending &amp; Inflow Pace</span>
                    <div className="flex items-center gap-3 text-label-sm font-label-sm text-on-surface-variant">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>Spent
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary-container inline-block"></span>Inflow
                      </span>
                    </div>
                  </div>

                  {/* Interactive Chart Graphic */}
                  <div className="relative w-full h-40 bg-canvas-bg/60 rounded-2xl p-2.5 border border-border-subtle flex flex-col justify-end">
                    {/* Tooltip */}
                    {hoveredBar && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-inverse-surface text-inverse-on-surface font-label-sm text-[11px] shadow-md pointer-events-none transition-opacity z-10 animate-in fade-in flex items-center gap-2">
                        <span className="font-bold">{hoveredBar.day}:</span>
                        <span>Spent {hoveredBar.spent}</span>
                        <span>· Inflow {hoveredBar.inflow}</span>
                      </div>
                    )}

                    {/* SVG Trend Chart with Bars and Spline */}
                    <svg className="w-full h-28 overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 100">
                      <defs>
                        <linearGradient id="primaryBarGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#8455ef" stopOpacity="0.95"></stop>
                          <stop offset="100%" stopColor="#d0bcff" stopOpacity="0.6"></stop>
                        </linearGradient>
                        <linearGradient id="inflowGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#4edea3" stopOpacity="0.45"></stop>
                          <stop offset="100%" stopColor="#4edea3" stopOpacity="0.05"></stop>
                        </linearGradient>
                      </defs>
                      
                      {/* Grid guide lines */}
                      <line stroke="#1d1b19" strokeDasharray="3 3" strokeOpacity="0.06" x1="0" x2="320" y1="20" y2="20"></line>
                      <line stroke="#1d1b19" strokeDasharray="3 3" strokeOpacity="0.06" x1="0" x2="320" y1="50" y2="50"></line>
                      <line stroke="#1d1b19" strokeDasharray="3 3" strokeOpacity="0.06" x1="0" x2="320" y1="80" y2="80"></line>
                      
                      {/* Dynamic Inflow Smooth Wave Path */}
                      {(() => {
                        const xs = [26, 70, 114, 158, 202, 246, 290];
                        const pts = analyticsData.weeklyData.map((d, i) => {
                          const y = Math.max(15, Math.min(88, 90 - (d.inflow / analyticsData.maxPaceVal) * 70));
                          return { x: xs[i], y };
                        });
                        let pathD = `M ${pts[0].x} ${pts[0].y}`;
                        for (let i = 1; i < pts.length; i++) {
                          const prev = pts[i - 1];
                          const curr = pts[i];
                          const cx = (prev.x + curr.x) / 2;
                          pathD += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
                        }
                        const areaD = `${pathD} L ${pts[pts.length - 1].x} 95 L ${pts[0].x} 95 Z`;
                        return (
                          <>
                            <path d={areaD} fill="url(#inflowGrad)" />
                            <path d={pathD} fill="none" stroke="#00714d" strokeLinecap="round" strokeWidth="2" />
                          </>
                        );
                      })()}
                      
                      {/* Dynamic Weekly Bars (Mon - Sun) */}
                      {analyticsData.weeklyData.map((d, idx) => {
                        const xs = [18, 62, 106, 150, 194, 238, 282];
                        const x = xs[idx];
                        const barHeight = Math.max(8, Math.round((d.spent / analyticsData.maxPaceVal) * 75));
                        const y = 92 - barHeight;

                        return (
                          <rect 
                            key={d.day}
                            onMouseEnter={() => setHoveredBar({ day: d.day, spent: `${currency}${d.spent}`, inflow: `${currency}${d.inflow}` })}
                            onMouseLeave={() => setHoveredBar(null)}
                            onClick={() => setHoveredBar({ day: d.day, spent: `${currency}${d.spent}`, inflow: `${currency}${d.inflow}` })}
                            className={`cursor-pointer hover:opacity-80 transition-all ${
                              d.isToday ? 'ring-2 ring-primary ring-offset-1' : ''
                            }`} 
                            fill={d.isToday ? '#6b38d4' : 'url(#primaryBarGrad)'} 
                            height={barHeight} 
                            rx="5" 
                            width="16" 
                            x={x} 
                            y={y}
                          />
                        );
                      })}
                    </svg>
                    
                    <div className="flex justify-between items-center px-1 pt-1 font-label-sm text-[11px] text-on-surface-variant font-medium">
                      {analyticsData.weeklyData.map((d) => (
                        <span 
                          key={d.day} 
                          className={`w-6 text-center ${d.isToday ? 'font-bold text-primary underline' : ''}`}
                        >
                          {d.day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dynamic Category Breakdown Donut / Pie & Legends */}
                <div className="pt-space-xs border-t border-border-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">Category Breakdown</span>
                    <div className="relative">
                      <select 
                        value={categoryFilter}
                        onChange={(e) => {
                          playPopSound();
                          setCategoryFilter(e.target.value);
                        }}
                        className="appearance-none pl-2.5 pr-7 py-1 text-label-sm font-semibold rounded-xl bg-canvas-bg border border-border-subtle text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-xs cursor-pointer" 
                        id="analyticsCategoryFilter"
                      >
                        <option value="all">🌈 All Categories</option>
                        {analyticsData.categoriesArray.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.emoji} {c.name} ({c.pct}%)
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-md pt-1">
                    {/* SVG Donut Chart with Dynamic Percentages */}
                    <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 42 42">
                        <circle cx="21" cy="21" fill="transparent" r="15.91549430918954" stroke="#F1EBFB" strokeWidth="5.5"></circle>
                        {analyticsData.donutSlices.map((slice) => (
                          <circle 
                            key={slice.name}
                            cx="21" 
                            cy="21" 
                            fill="transparent" 
                            r="15.91549430918954" 
                            stroke={slice.hexColor} 
                            strokeDasharray={slice.strokeDasharray} 
                            strokeDashoffset={slice.strokeDashoffset} 
                            strokeWidth="5.5"
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="font-headline-sm text-[15px] font-bold text-on-surface leading-none font-fraunces">
                          {currency}{analyticsData.totalExpPeriod.toLocaleString('en-IN')}
                        </span>
                        <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">Total</span>
                      </div>
                    </div>

                    {/* Dynamic Legends Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-1">
                      {analyticsData.categoriesArray.slice(0, 4).map((c) => (
                        <div key={c.name} className="flex items-center gap-1.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: c.name.toLowerCase().includes('food') 
                                ? '#F59E0B' 
                                : c.name.toLowerCase().includes('tech') 
                                ? '#0284C7' 
                                : c.name.toLowerCase().includes('shop') 
                                ? '#dc2c4f' 
                                : '#6b38d4'
                            }}
                          ></span>
                          <div className="min-w-0">
                            <p className="font-label-sm text-label-sm text-on-surface font-semibold leading-tight truncate">{c.name}</p>
                            <p className="font-body-sm text-[11px] text-on-surface-variant">{c.pct}% · {currency}{c.amount.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. FINANCIAL GOALS & TARGETS (WITH DYNAMIC DAYS REMAINING)*/}
          {/* ======================================================== */}
          <div className="flex flex-col space-y-space-sm pt-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[18px]">🌱</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-fraunces">Financial Goals</h2>
              </div>
              <button 
                onClick={() => {
                  playPopSound();
                  setIsAddGoalModalOpen(true);
                }}
                className="font-label-sm text-label-sm text-primary flex items-center gap-0.5 hover:underline font-semibold cursor-pointer" 
                id="addGoalBtn"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>New Target</span>
              </button>
            </div>

            {/* Goals List */}
            <div className="space-y-space-sm">
              {goalsList.length === 0 && (
                <div className="p-6 rounded-3xl bg-surface-card border border-dashed border-border-subtle text-center text-xs text-on-surface-variant space-y-1">
                  <p className="font-semibold text-on-surface">No financial targets yet</p>
                  <p>Tap + New Target to set up savings funds and goals!</p>
                </div>
              )}
              {goalsList.map((goal) => {
                const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                const { label: daysLeftLabel, isPast } = calculateDaysRemaining(goal.targetDate);
                const formattedTargetDate = goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                return (
                  <div 
                    key={goal.id}
                    className="p-space-md rounded-3xl bg-surface-card border border-border-subtle shadow-[0_4px_16px_rgba(21,19,17,0.03)] space-y-space-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-11 h-11 rounded-2xl bg-sky-subtle flex items-center justify-center text-[22px] flex-shrink-0 shadow-xs">
                          {goal.emoji}
                        </div>
                        <div className="ml-2.5">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-label-lg text-label-lg text-on-surface font-bold">{goal.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold ${
                              isPast ? 'bg-peach-subtle text-tertiary' : 'bg-sky-subtle text-sky-accent'
                            }`}>
                              ⏳ {daysLeftLabel}
                            </span>
                          </div>
                          <p className="font-body-sm text-[12px] text-on-surface-variant">
                            {goal.subtitle || (formattedTargetDate ? `Target: ${formattedTargetDate}` : '')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => handleOpenDepositModal(goal)}
                          className="goal-deposit-btn px-3 py-1.5 rounded-xl bg-lavender-subtle text-primary font-label-sm text-label-sm font-bold hover:bg-primary hover:text-white transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">add</span>Deposit
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="w-8 h-8 rounded-xl bg-canvas-bg hover:bg-peach-subtle hover:text-tertiary flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer border border-border-subtle active:scale-95"
                          title="Delete goal"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline font-label-sm text-label-sm">
                        <span className="text-on-surface font-bold text-[14px]">
                          {currency}{Math.round(goal.current).toLocaleString('en-IN')} <span className="font-normal text-on-surface-variant text-[12px]">/ {currency}{Math.round(goal.target).toLocaleString('en-IN')}</span>
                        </span>
                        <span className="text-sky-accent font-bold">{pct}% achieved</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-canvas-bg overflow-hidden border border-border-subtle">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${goal.gradient} transition-all duration-500`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 5. CATEGORY-WISE EXPENSE BREAKDOWN (NO CAP SYSTEM)       */}
          {/* ======================================================== */}
          <div className="flex flex-col space-y-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[16px]">🌿</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-fraunces">Category-wise Expense Breakdown</h2>
              </div>
              <button 
                onClick={() => {
                  playPopSound();
                  setIsManageCategoriesModalOpen(true);
                }}
                className="font-label-sm text-label-sm text-primary flex items-center gap-0.5 hover:underline cursor-pointer font-bold"
              >
                <span>Manage Categories</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>

            {/* Dynamic Category Cards Grid (WITH CAP SYSTEM) */}
            <div className="grid grid-cols-2 gap-space-sm">
              {categoriesList.length === 0 && (
                <div className="col-span-2 p-6 rounded-3xl bg-surface-card border border-dashed border-border-subtle text-center space-y-2">
                  <div className="text-2xl">🌱</div>
                  <p className="font-semibold text-xs text-on-surface">No expense categories yet</p>
                  <p className="text-[11px] text-on-surface-variant">Create your first custom category with monthly cap!</p>
                  <button
                    onClick={() => {
                      playPopSound();
                      setIsManageCategoriesModalOpen(true);
                      setIsAddingNewCat(true);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <span>+ Add Category</span>
                  </button>
                </div>
              )}
              {categoriesList.map((c) => {
                const catSpent = localTransactions
                  .filter((tx) => (tx.type as string) !== 'income' && matchesCategory(tx, c))
                  .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

                const capVal = c.cap || 500;
                const pct = capVal > 0 ? Math.min(100, Math.round((catSpent / capVal) * 100)) : 0;
                const isOverCap = capVal > 0 && catSpent > capVal;

                return (
                  <div 
                    key={c.id || c.name}
                    onClick={() => {
                      playPopSound();
                      setSelectedCategoryForSpendView(c);
                    }}
                    className={`relative overflow-hidden p-space-md rounded-3xl ${c.bg || 'bg-lavender-subtle/80'} flex flex-col justify-between shadow-sm space-y-space-md border border-border-subtle hover:shadow-md hover:border-primary/40 transition-all cursor-pointer active:scale-98`}
                    title="Click to view full expenses of this category"
                  >
                    <span 
                      className={`material-symbols-outlined absolute -bottom-3 -right-2 text-[64px] ${c.iconColor || 'text-primary/15'} select-none pointer-events-none`} 
                      style={{ fontVariationSettings: '"FILL" 1' }}
                    >
                      {c.icon || 'category'}
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-2xl bg-surface-card flex items-center justify-center shadow-xs">
                        <span className="text-[18px]">{c.emoji}</span>
                      </div>
                      <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${
                        isOverCap
                          ? 'bg-peach-subtle text-tertiary'
                          : 'bg-surface-card/80 text-on-surface'
                      }`}>
                        {pct}%
                      </span>
                    </div>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface block font-bold">{c.name}</span>
                      <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-fraunces">
                          {currency}{Math.round(catSpent).toLocaleString('en-IN')}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                          / {currency}{Math.round(capVal).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-surface-card/60 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isOverCap ? 'bg-tertiary' : c.barColor || 'bg-primary'}`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 6. RECENT LOGS WITH DELETE CONFIRMATION & TOTALS        */}
          {/* ======================================================== */}
          <div className="flex flex-col space-y-space-sm pt-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[16px]">🧾</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-fraunces">Recent Logs</h2>
              </div>
              <button 
                onClick={() => {
                  playPopSound();
                  setIsFullStatementOpen(true);
                }}
                className="font-label-sm text-label-sm text-primary flex items-center gap-0.5 hover:underline cursor-pointer font-bold"
              >
                <span>View Full Statement</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Filter Tabs: Both (All) vs Spent vs Income */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container border border-border-subtle text-xs">
              {[
                { key: 'all', label: 'Both' },
                { key: 'expense', label: 'Spent' },
                { key: 'income', label: 'Income' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setRecentLogsFilter(tab.key as any);
                  }}
                  className={`flex-1 py-1.5 text-center rounded-xl font-bold transition-all cursor-pointer ${
                    recentLogsFilter === tab.key
                      ? 'bg-surface-card text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filtered Logs List */}
            {(() => {
              const filteredLogs = localTransactions.filter((tx) => {
                if (recentLogsFilter === 'expense') return (tx.type as string) !== 'income';
                if (recentLogsFilter === 'income') return tx.type === 'income';
                return true;
              });

              const periodSpent = filteredLogs
                .filter((tx) => (tx.type as string) !== 'income')
                .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

              const periodIncome = filteredLogs
                .filter((tx) => tx.type === 'income')
                .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

              const periodNet = periodIncome - periodSpent;

              return (
                <div className="rounded-3xl bg-surface-card p-space-md shadow-[0_8px_24px_-4px_rgba(139,92,246,0.08),0_2px_6px_-1px_rgba(21,19,17,0.04)] space-y-space-sm border border-border-subtle">
                  {filteredLogs.length === 0 ? (
                    <div className="py-6 text-center text-xs text-on-surface-variant">
                      No logs found for this filter. Tap "+ Log Expense" to record one!
                    </div>
                  ) : (
                    filteredLogs.map((tx) => {
                      const isInc = tx.type === 'income';
                      return (
                        <div 
                          key={tx.id}
                          className="flex items-center justify-between p-space-sm rounded-2xl hover:bg-canvas-bg transition-colors cursor-pointer border border-transparent hover:border-border-subtle"
                        >
                          <div className="flex items-center gap-space-sm min-w-0">
                            <div className={`w-11 h-11 rounded-2xl ${isInc ? 'bg-mint-subtle text-secondary' : 'bg-lavender-subtle text-primary'} flex items-center justify-center flex-shrink-0 shadow-xs text-lg`}>
                              {tx.categoryIcon || (isInc ? '💰' : '💸')}
                            </div>
                            <div className="min-w-0 ml-1">
                              <h3 className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                                {tx.note || tx.category}
                              </h3>
                              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                                {tx.category} · {tx.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-right flex-shrink-0 pl-2">
                            <div>
                              <span className={`font-label-lg text-label-lg block font-bold ${
                                isInc ? 'text-secondary' : 'text-on-surface'
                              }`}>
                                {isInc ? '+' : '-'}{currency}{Math.round(tx.amount).toLocaleString('en-IN')}
                              </span>
                              <span className={`font-label-sm text-[10px] px-1.5 py-0.5 rounded-full inline-block font-medium ${
                                isInc ? 'bg-mint-subtle text-on-secondary-fixed-variant' : 'bg-canvas-bg text-on-surface-variant'
                              }`}>
                                {tx.merchant || 'Record'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTransactionToDelete(tx);
                              }}
                              className="w-7 h-7 rounded-lg hover:bg-peach-subtle hover:text-tertiary flex items-center justify-center text-on-surface-variant transition-colors active:scale-95 cursor-pointer ml-1"
                              title="Delete transaction"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Calculated Total Bar Below the List */}
                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs px-1">
                    <span className="font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                      {recentLogsFilter === 'expense'
                        ? 'Total Spent'
                        : recentLogsFilter === 'income'
                        ? 'Total Income'
                        : 'Net Summary'}
                    </span>
                    <span className={`font-headline-sm text-sm font-bold font-mono ${
                      recentLogsFilter === 'income' || (recentLogsFilter === 'all' && periodNet >= 0)
                        ? 'text-secondary'
                        : 'text-primary'
                    }`}>
                      {recentLogsFilter === 'expense' && `-${currency}${Math.round(periodSpent).toLocaleString('en-IN')}`}
                      {recentLogsFilter === 'income' && `+${currency}${Math.round(periodIncome).toLocaleString('en-IN')}`}
                      {recentLogsFilter === 'all' && `${periodNet >= 0 ? '+' : '-'}${currency}${Math.round(Math.abs(periodNet)).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </main>

      {/* ======================================================== */}
      {/* 7. FLOATING QUICK ADD BUTTON (FAB)                       */}
      {/* ======================================================== */}
      <div className="fixed bottom-24 right-5 z-40">
        <button 
          aria-label="Quick Add Transaction" 
          onClick={() => {
            playPopSound();
            setIsQuickLogOpen(true);
          }}
          className="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-primary-container text-white flex items-center justify-center shadow-[0_8px_24px_rgba(107,56,212,0.42)] hover:scale-105 active:scale-95 transition-all duration-200 animate-soft-float cursor-pointer" 
          id="fabQuickAdd"
        >
          <span className="material-symbols-outlined text-[28px] transition-transform duration-300 group-hover:rotate-90">
            add
          </span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary-container rounded-full ring-2 ring-white"></span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 8. FULL EXPENSE BREAKDOWN MODAL (WITH CAP)               */}
      {/* ======================================================== */}
      {selectedCategoryForSpendView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-lavender-subtle flex items-center justify-center text-xl shadow-xs">
                  {selectedCategoryForSpendView.emoji}
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-on-surface font-bold font-fraunces">
                    {selectedCategoryForSpendView.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant">Category Expense Breakdown</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCategoryForSpendView(null)}
                className="w-8 h-8 rounded-full bg-canvas-bg flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Metrics Row (WITH CAP) */}
            {(() => {
              const capVal = selectedCategoryForSpendView.cap || 500;
              const capPct = Math.round((selectedCategorySpentTotal / capVal) * 100);
              const isOver = selectedCategorySpentTotal > capVal;
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-canvas-bg border border-border-subtle text-center">
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-semibold">Total Spent</span>
                      <span className="text-sm font-bold text-tertiary">
                        {currency}{Math.round(selectedCategorySpentTotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-semibold">Monthly Cap</span>
                      <span className="text-sm font-bold text-on-surface">
                        {currency}{Math.round(capVal).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-semibold">Cap Used</span>
                      <span className={`text-sm font-bold ${isOver ? 'text-tertiary' : 'text-primary'}`}>
                        {capPct}%
                      </span>
                    </div>
                  </div>

                  {/* Cap Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                      <span>Monthly Budget Status</span>
                      <span className={isOver ? 'text-tertiary font-bold' : 'text-secondary font-bold'}>
                        {isOver 
                          ? `Over Cap by ${currency}${Math.round(selectedCategorySpentTotal - capVal).toLocaleString('en-IN')}!`
                          : `${currency}${Math.round(capVal - selectedCategorySpentTotal).toLocaleString('en-IN')} remaining`
                        }
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-tertiary' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, capPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions Row */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLogCategory(selectedCategoryForSpendView.name);
                  setLogType('expense');
                  setIsQuickLogOpen(true);
                }}
                className="flex-1 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Log Expense Here</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${selectedCategoryForSpendView.name}" category?`)) {
                    handleDeleteCategory(selectedCategoryForSpendView.id);
                  }
                }}
                className="py-2 px-3.5 rounded-xl bg-peach-subtle text-tertiary font-bold text-xs hover:bg-tertiary hover:text-white transition-all cursor-pointer"
              >
                Delete Category
              </button>
            </div>

            {/* Transaction List in this Category */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 min-h-[160px] max-h-[300px]">
              <span className="font-bold text-xs text-on-surface-variant uppercase tracking-wider">
                All Transactions ({categoryExpensesForModal.length})
              </span>

              {categoryExpensesForModal.length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant bg-canvas-bg rounded-2xl border border-border-subtle p-4">
                  No expenses recorded in {selectedCategoryForSpendView.name} yet. Tap "+ Log Expense Here" to add one!
                </div>
              ) : (
                categoryExpensesForModal.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-canvas-bg border border-border-subtle hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-xs text-on-surface truncate">{tx.note || tx.category}</h4>
                      <p className="text-[11px] text-on-surface-variant">{tx.date} · {tx.merchant || 'Expense'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-xs text-tertiary">
                        -{currency}{Math.round(tx.amount).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => setTransactionToDelete(tx)}
                        className="w-6 h-6 rounded hover:bg-peach-subtle hover:text-tertiary flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                        title="Delete this expense"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setSelectedCategoryForSpendView(null)}
              className="w-full py-2.5 rounded-full bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high transition-all cursor-pointer mt-1"
            >
              Done Viewing
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. MANAGE CATEGORIES MODAL (WITH CAP)                    */}
      {/* ======================================================== */}
      {isManageCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <h3 className="font-headline-sm text-base text-on-surface font-bold font-fraunces">
                  Manage Categories & Caps
                </h3>
              </div>
              <button 
                onClick={() => setIsManageCategoriesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Existing Categories List */}
            <div className="space-y-2">
              {categoriesList.length === 0 ? (
                <div className="p-4 rounded-2xl bg-canvas-bg border border-dashed border-border-subtle text-center text-xs text-on-surface-variant">
                  No categories created yet. Click "+ Add New Category" below to create one!
                </div>
              ) : (
                categoriesList.map((c) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-canvas-bg border border-border-subtle space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{c.emoji}</span>
                        <div>
                          <h4 className="font-bold text-xs text-on-surface">{c.name}</h4>
                          <span className="text-[11px] text-on-surface-variant">
                            Cap: <strong className="text-on-surface">{currency}{c.cap || 500}</strong> / mo
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (editingCapId === c.id) {
                              setEditingCapId(null);
                            } else {
                              setEditingCapId(c.id);
                              setEditingCapValue(String(c.cap || 500));
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-surface-card hover:bg-lavender-subtle text-primary text-[11px] font-bold border border-border-subtle transition-colors cursor-pointer"
                          title="Edit category monthly cap"
                        >
                          {editingCapId === c.id ? 'Close' : 'Edit Cap'}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="w-8 h-8 rounded-lg hover:bg-peach-subtle hover:text-tertiary flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                          title="Delete category"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Cap Editor */}
                    {editingCapId === c.id && (
                      <div className="pt-2 border-t border-border-subtle flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-on-surface-variant">Monthly Cap: {currency}</span>
                        <input
                          type="number"
                          value={editingCapValue}
                          onChange={(e) => setEditingCapValue(e.target.value)}
                          className="w-24 px-2 py-1 rounded-xl bg-surface-card border border-primary text-xs font-bold text-on-surface"
                          autoFocus
                          placeholder="500"
                        />
                        <button
                          onClick={() => handleUpdateCap(c.id, Number(editingCapValue) || 500)}
                          className="px-3 py-1 rounded-xl bg-primary text-on-primary font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add New Category Section */}
            {isAddingNewCat ? (
              <div className="p-3.5 rounded-2xl bg-canvas-bg border border-primary/40 space-y-2.5">
                <span className="font-bold text-xs text-primary block">+ New Category with Cap</span>
                <input 
                  type="text"
                  placeholder="Category Name (e.g. Travel, Gym, Dining)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-card border border-border-subtle text-xs"
                  autoFocus
                />
                <input 
                  type="text"
                  placeholder="Emoji Icon (e.g. ✈️, 🏋️, 🍔)"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-card border border-border-subtle text-xs"
                />
                <div>
                  <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-1">
                    Monthly Cap ({currency})
                  </label>
                  <input 
                    type="number"
                    placeholder="Monthly Cap (e.g. 500)"
                    value={newCatCap}
                    onChange={(e) => setNewCatCap(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-card border border-border-subtle text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddNewCategory}
                    className="flex-1 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs active:scale-95 cursor-pointer"
                  >
                    Add Category
                  </button>
                  <button
                    onClick={() => setIsAddingNewCat(false)}
                    className="px-3 py-1.5 rounded-xl bg-surface-container text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingNewCat(true)}
                className="w-full py-2.5 rounded-2xl border border-dashed border-primary text-primary font-bold text-xs hover:bg-lavender-subtle transition-all cursor-pointer"
              >
                + Add New Category
              </button>
            )}

            <button 
              onClick={() => setIsManageCategoriesModalOpen(false)}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. QUICK LOG MODAL / BOTTOM SHEET (WITH KEYPAD)         */}
      {/* ======================================================== */}
      {isQuickLogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn">
          <div className="w-full max-w-lg bg-surface-card rounded-t-3xl p-space-lg shadow-2xl space-y-space-md border-t border-lavender-subtle animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto -mt-1 mb-1"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[20px]">✨</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-fraunces">Quick Log</h3>
              </div>
              <button 
                onClick={() => setIsQuickLogOpen(false)}
                className="w-9 h-9 rounded-full bg-canvas-bg flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-90 transition-transform cursor-pointer" 
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Log Type Toggle */}
            <div className="flex p-1 rounded-2xl bg-canvas-bg border border-border-subtle">
              <button 
                type="button"
                onClick={() => { playPopSound(); setLogType('expense'); }}
                className={`transaction-type-btn flex-1 py-1 text-center font-label-sm text-label-sm rounded-xl font-bold transition-all active:scale-95 cursor-pointer ${
                  logType === 'expense' ? 'bg-surface-card text-tertiary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                💸 Expense
              </button>
              <button 
                type="button"
                onClick={() => { playPopSound(); setLogType('income'); }}
                className={`transaction-type-btn flex-1 py-1 text-center font-label-sm text-label-sm rounded-xl font-bold transition-all active:scale-95 cursor-pointer ${
                  logType === 'income' ? 'bg-surface-card text-secondary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                🌱 Income
              </button>
              <button 
                type="button"
                onClick={() => { playPopSound(); setLogType('goal'); }}
                className={`transaction-type-btn flex-1 py-1 text-center font-label-sm text-label-sm rounded-xl font-bold transition-all active:scale-95 cursor-pointer ${
                  logType === 'goal' ? 'bg-surface-card text-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                🎯 Goal Save
              </button>
            </div>

            {/* Category Selector Dropdown (ONLY USER CREATED CATEGORIES) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-label-sm text-label-sm text-on-surface-variant font-semibold">
                  Select Category
                </label>
                <button
                  type="button"
                  onClick={() => {
                    playPopSound();
                    setIsManageCategoriesModalOpen(true);
                    setIsAddingNewCat(true);
                  }}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[13px]">add</span>
                  <span>New Category</span>
                </button>
              </div>

              {categoriesList.length === 0 ? (
                <div className="p-3 rounded-2xl bg-canvas-bg border border-dashed border-border-subtle flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-medium">No categories created yet</span>
                  <button
                    type="button"
                    onClick={() => {
                      playPopSound();
                      setIsManageCategoriesModalOpen(true);
                      setIsAddingNewCat(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-primary text-on-primary font-bold text-xs"
                  >
                    + Create One
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value)}
                    className="w-full appearance-none pl-3.5 pr-10 py-2.5 rounded-2xl bg-canvas-bg border border-border-subtle font-label-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all cursor-pointer" 
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.emoji} {cat.name} (Cap: {currency}{cat.cap || 500})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              )}
            </div>

            {/* Display & Presets Area */}
            <div className="p-space-sm rounded-2xl bg-canvas-bg border border-border-subtle space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Amount ({currency})</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handlePresetAdd(100)}
                    className="preset-chip px-2 py-0.5 rounded-lg bg-surface-card text-on-surface hover:text-primary font-label-sm text-[11px] border border-border-subtle active:scale-95 transition-all cursor-pointer font-bold" 
                    type="button"
                  >
                    +{currency}100
                  </button>
                  <button 
                    onClick={() => handlePresetAdd(500)}
                    className="preset-chip px-2 py-0.5 rounded-lg bg-surface-card text-on-surface hover:text-primary font-label-sm text-[11px] border border-border-subtle active:scale-95 transition-all cursor-pointer font-bold" 
                    type="button"
                  >
                    +{currency}500
                  </button>
                  <button 
                    onClick={() => handlePresetAdd(1000)}
                    className="preset-chip px-2 py-0.5 rounded-lg bg-surface-card text-on-surface hover:text-primary font-label-sm text-[11px] border border-border-subtle active:scale-95 transition-all cursor-pointer font-bold" 
                    type="button"
                  >
                    +{currency}1,000
                  </button>
                </div>
              </div>

              <div className="flex items-baseline justify-center py-1">
                <span className="font-headline-md text-primary font-bold text-[24px] mr-1">{currency}</span>
                <span className="font-display-lg text-[32px] tracking-tight font-bold text-on-surface leading-none select-none font-fraunces">
                  {displayAmount}
                </span>
              </div>

              {/* Note / Title Input */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-card border border-border-subtle">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit_note</span>
                <input 
                  className="w-full bg-transparent border-0 font-body-sm text-body-sm text-on-surface focus:ring-0 p-0 focus:outline-none" 
                  placeholder="What was this for? (e.g. Iced Matcha)" 
                  type="text"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitTransaction();
                  }}
                />
              </div>
            </div>

            {/* Numeric Keypad (3x4 Grid) */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button 
                  key={digit}
                  onClick={() => handleKeypadPress(digit)}
                  className="numpad-btn h-11 rounded-xl bg-surface-card hover:bg-canvas-bg active:scale-95 font-headline-sm text-headline-sm text-on-surface shadow-xs flex items-center justify-center transition-all cursor-pointer font-bold" 
                  type="button"
                >
                  {digit}
                </button>
              ))}
              <button 
                onClick={() => handleKeypadPress('00')}
                className="numpad-btn h-11 rounded-xl bg-canvas-bg hover:bg-surface-card active:scale-95 font-headline-sm text-headline-sm text-on-surface flex items-center justify-center transition-all cursor-pointer font-bold" 
                type="button"
              >
                00
              </button>
              <button 
                onClick={() => handleKeypadPress('0')}
                className="numpad-btn h-11 rounded-xl bg-surface-card hover:bg-canvas-bg active:scale-95 font-headline-sm text-headline-sm text-on-surface shadow-xs flex items-center justify-center transition-all cursor-pointer font-bold" 
                type="button"
              >
                0
              </button>
              <button 
                onClick={() => handleKeypadPress('backspace')}
                className="numpad-btn h-11 rounded-xl bg-peach-subtle/80 hover:bg-peach-subtle active:scale-95 text-tertiary flex items-center justify-center transition-all cursor-pointer" 
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">backspace</span>
              </button>
            </div>

            {/* Bottom Confirmation Action */}
            <button 
              onClick={handleSubmitTransaction}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white font-label-lg text-label-lg font-bold shadow-[0_4px_16px_rgba(107,56,212,0.25)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer" 
              type="button"
            >
              <span>{logType === 'income' ? 'Save Income' : logType === 'goal' ? 'Save to Goal' : 'Save Expense'}</span>
              <span>✨</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. DEPOSIT MODAL                                        */}
      {/* ======================================================== */}
      {isDepositModalOpen && activeGoalForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeGoalForDeposit.emoji}</span>
                <h3 className="font-headline-sm text-base text-on-surface font-bold font-fraunces">
                  Deposit to {activeGoalForDeposit.title}
                </h3>
              </div>
              <button 
                onClick={() => setIsDepositModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-canvas-bg border border-border-subtle">
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                Deposit Amount ({currency})
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">{currency}</span>
                <input 
                  type="number"
                  step="1"
                  min="1"
                  value={depositAmountInput}
                  onChange={(e) => setDepositAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-transparent text-xl font-bold text-on-surface focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2">
              {[100, 500, 1000].map((quick) => (
                <button
                  key={quick}
                  onClick={() => setDepositAmountInput(String(quick))}
                  className="flex-1 py-1.5 rounded-xl bg-lavender-subtle text-primary font-bold text-xs hover:bg-primary hover:text-white transition-colors cursor-pointer"
                >
                  +{currency}{quick}
                </button>
              ))}
            </div>

            <button 
              onClick={handleConfirmDeposit}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              Confirm Deposit ✨
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 12. NEW GOAL TARGET MODAL (DATE PICKER & TIME REMAINING) */}
      {/* ======================================================== */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌱</span>
                <h3 className="font-headline-sm text-base text-on-surface font-bold font-fraunces">
                  New Financial Goal
                </h3>
              </div>
              <button 
                onClick={() => setIsAddGoalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Goal Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Emergency Fund, Camera Lens"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-canvas-bg border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Target Amount ({currency})</label>
                <input 
                  type="number"
                  placeholder="1000"
                  step="1"
                  min="1"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3.5 py-2 rounded-2xl bg-canvas-bg border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Target Date</label>
                <input 
                  type="date"
                  min={TODAY}
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-canvas-bg border border-border-subtle text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                />
                {newGoalTargetDate && (
                  <p className="text-[11px] text-primary font-bold mt-1">
                    ⏳ {calculateDaysRemaining(newGoalTargetDate).label}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">Emoji Icon</label>
                <div className="flex gap-2">
                  {['🎯', '💻', '🍁', '🏖️', '🚗', '🏠'].map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setNewGoalEmoji(emo)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer ${
                        newGoalEmoji === emo ? 'bg-lavender-subtle border-primary scale-105' : 'bg-canvas-bg border-border-subtle'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleCreateNewGoal}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer mt-1"
            >
              Create Savings Target ✨
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 13. DELETE LOG CONFIRMATION MODAL                        */}
      {/* ======================================================== */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-peach-subtle text-tertiary flex items-center justify-center text-2xl flex-shrink-0">
                🗑️
              </div>
              <div>
                <h3 className="font-headline-sm text-base text-on-surface font-bold font-fraunces">
                  Delete Transaction Log?
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Are you sure you want to remove this record?
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-canvas-bg border border-border-subtle text-xs flex justify-between items-center">
              <div className="min-w-0 pr-2">
                <span className="font-bold text-on-surface block truncate">{transactionToDelete.note || transactionToDelete.category}</span>
                <span className="text-on-surface-variant">{transactionToDelete.category} · {transactionToDelete.date}</span>
              </div>
              <span className={`font-bold font-mono text-sm shrink-0 ${transactionToDelete.type === 'income' ? 'text-secondary' : 'text-primary'}`}>
                {transactionToDelete.type === 'income' ? '+' : '-'}{currency}{Math.round(transactionToDelete.amount).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setTransactionToDelete(null)}
                className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteTransaction}
                className="flex-1 py-2.5 rounded-full bg-tertiary text-white font-bold text-xs shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                Delete Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 14. FULL STATEMENT MODAL                                 */}
      {/* ======================================================== */}
      {isFullStatementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-surface-card p-6 shadow-2xl border border-border-subtle flex flex-col gap-4 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <h3 className="font-headline-sm text-base text-on-surface font-bold font-fraunces">
                  Full Financial Statement
                </h3>
              </div>
              <button 
                onClick={() => setIsFullStatementOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Search description, category, or note..."
                value={statementSearch}
                onChange={(e) => setStatementSearch(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-canvas-bg border border-border-subtle text-xs"
              />
              <div className="flex rounded-xl bg-canvas-bg border border-border-subtle p-0.5 text-xs">
                {(['all', 'expense', 'income'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatementFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                      statementFilter === filter ? 'bg-surface-card text-primary shadow-xs' : 'text-on-surface-variant'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1 min-h-[200px]">
              {localTransactions
                .filter((tx) => {
                  if (statementFilter === 'expense' && (tx.type as string) === 'income') return false;
                  if (statementFilter === 'income' && tx.type !== 'income') return false;
                  if (statementSearch.trim()) {
                    const q = statementSearch.toLowerCase();
                    return (
                      (tx.note || '').toLowerCase().includes(q) ||
                      (tx.category || '').toLowerCase().includes(q) ||
                      (tx.merchant || '').toLowerCase().includes(q)
                    );
                  }
                  return true;
                })
                .map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-xl bg-canvas-bg border border-border-subtle">
                      <div>
                        <h4 className="font-bold text-xs text-on-surface">{tx.note || tx.category}</h4>
                        <p className="text-[11px] text-on-surface-variant">{tx.category} · {tx.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${isInc ? 'text-secondary' : 'text-on-surface'}`}>
                          {isInc ? '+' : '-'}{currency}{Math.round(tx.amount).toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => setTransactionToDelete(tx)}
                          className="w-6 h-6 rounded hover:bg-peach-subtle hover:text-tertiary flex items-center justify-center text-on-surface-variant cursor-pointer"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <button 
              onClick={() => setIsFullStatementOpen(false)}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              Close Statement
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 15. NOTIFICATIONS MODAL                                  */}
      {/* ======================================================== */}
      {isNotificationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-xl border border-border-subtle flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="font-headline-sm text-base text-on-surface font-bold font-fraunces">
                  Financial Sanctuary Updates
                </h3>
              </div>
              <button 
                onClick={() => setIsNotificationOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-mint-subtle/70 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-secondary">✨ Cash Flow Positive</span>
                  <span className="text-[10px] text-on-surface-variant">Live</span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  Your inflow and spending are dynamically tracked without restrictive caps.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-sunshine-subtle/70 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-sunshine-accent">☕ Dynamic Spending</span>
                  <span className="text-[10px] text-on-surface-variant">Live</span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {analyticsData.topCategory 
                    ? `Top spending area: ${analyticsData.topCategory.name} (${analyticsData.topCategory.pct}%).`
                    : 'All spending categories are balanced.'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsNotificationOpen(false)}
              className="w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              All Caught Up!
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
