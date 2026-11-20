import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { FinanceTransaction, FinanceCategory, TransactionType } from '../../types/finance';
import { todayKey, diffInDays } from '../../utils/dates';
import { triggerPartyPop, playPopSound } from '../../utils/delight';
import avatarImg from '../../assets/avatar.png';
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

const DEFAULT_EMOJIS: Record<string, string> = {
  General: '💰',
  Food: '🍔',
  Chaya: '🧋',
  Travel: '🚌',
  Shopping: '🛍️'
};

const PALETTE = ['#F6A25B', '#E85D8A', '#7CC6A4', '#8FA8F0', '#F2C94C'];
const D0 = '2026-11-17';

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  transactions = [],
  categories = [],
  onEditTransaction,
  onDeleteTransaction,
  onQuickAdd,
}) => {
  const TODAY = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // Category emoji map
  const [emojis, setEmojis] = useState<Record<string, string>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('orbit-cats') || '{}');
      if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
        return stored;
      }
    } catch {}
    return { ...DEFAULT_EMOJIS };
  });

  const saveCats = (newEmojis: Record<string, string>) => {
    setEmojis(newEmojis);
    try {
      localStorage.setItem('orbit-cats', JSON.stringify(newEmojis));
    } catch {}
  };

  // Month navigation (YYYY-MM)
  const [ym, setYm] = useState<string>(() => TODAY.slice(0, 7));
  const [range, setRange] = useState<7 | 30 | 6>(30);
  const [filterType, setFilterType] = useState<'all' | 'exp' | 'inc'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Budget & Goal
  const [goal, setGoal] = useState<number>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('orbit-set') || '{}');
      if (s.goal > 0) return s.goal;
    } catch {}
    return 500;
  });

  const [budget, setBudget] = useState<number>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('orbit-set') || '{}');
      if (s.budget > 0) return s.budget;
    } catch {}
    return 1000;
  });

  const saveSettings = (newGoal: number, newBudget: number) => {
    try {
      localStorage.setItem('orbit-set', JSON.stringify({ goal: newGoal, budget: newBudget }));
    } catch {}
  };

  // Toast & undo state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [deletingRow, setDeletingRow] = useState<typeof allRows[0] | null>(null);

  const showToast = (msg: string, label?: string, onClick?: () => void) => {
    setToastMessage(msg);
    setToastAction(label && onClick ? { label, onClick } : null);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      setToastAction(null);
    }, 4000);
  };

  // Entry modal sheet state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryKind, setEntryKind] = useState<'exp' | 'inc'>('exp');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(TODAY);
  const [entryCategory, setEntryCategory] = useState<string>('General');
  const [entryNote, setEntryNote] = useState<string>('');

  // Category manager modal sheet state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍩');

  // Format currency in Indian Rupees
  const inr = (v: number | string) => {
    const num = typeof v === 'number' ? v : parseFloat(v) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fmtD = (d: string) => {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Harmonized transactions mapped to standard internal rows
  const allRows = useMemo(() => {
    return transactions.map((t) => ({
      id: t.id,
      t: t.type === 'income' ? ('inc' as const) : ('exp' as const),
      c: t.category,
      n: t.note || '',
      a: Number(t.amount) || 0,
      d: t.date || D0,
    }));
  }, [transactions]);

  // Current month's rows
  const monthRows = useMemo(() => {
    return allRows.filter((r) => (r.d || D0).slice(0, 7) === ym);
  }, [allRows, ym]);

  // Totals for current month
  const { inc, exp, net, pct } = useMemo(() => {
    const i = monthRows.filter((r) => r.t === 'inc').reduce((acc, r) => acc + r.a, 0);
    const e = monthRows.filter((r) => r.t === 'exp').reduce((acc, r) => acc + r.a, 0);
    const n = i - e;
    const p = i > 0 ? Math.max(0, Math.round((n / i) * 100)) : 0;
    return { inc: i, exp: e, net: n, pct: p };
  }, [monthRows]);

  // Month navigation
  const shiftM = (delta: number) => {
    const [y, m] = ym.split('-').map(Number);
    const next = new Date(y, m - 1 + delta, 1);
    setYm(next.toLocaleDateString('en-CA').slice(0, 7));
    playPopSound();
  };

  const monthLabel = useMemo(() => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, [ym]);

  // Greeting subtitle
  const greetingSubtitle = useMemo(() => {
    const hr = new Date().getHours();
    const gr = hr < 12 ? 'Good morning ☀️' : hr < 17 ? 'Good afternoon 🌼' : 'Good evening 🌙';
    return `${gr}, Sreeshnav. ${
      net >= 0 ? `You’ve kept ${inr(net)} this month.` : 'Spending is ahead of earnings this month.'
    }`;
  }, [net]);

  // Category breakdown for current month expenses
  const categoryStats = useMemo(() => {
    const by: Record<string, { a: number; n: number }> = {};
    monthRows
      .filter((r) => r.t === 'exp')
      .forEach((r) => {
        if (!by[r.c]) by[r.c] = { a: 0, n: 0 };
        by[r.c].a += r.a;
        by[r.c].n += 1;
      });

    const ks = Object.keys(by).sort((x, y) => by[y].a - by[x].a);
    let acc = 0;
    const segments = ks.map((k, i) => {
      const s = acc;
      const fraction = exp > 0 ? (by[k].a / exp) * 100 : 0;
      const e = s + fraction;
      acc = e;
      return `${PALETTE[i % PALETTE.length]} ${s}% ${e}%`;
    });

    const donutGradient = ks.length > 0 ? `conic-gradient(${segments.join(',')})` : 'var(--bg2)';

    return { by, ks, donutGradient };
  }, [monthRows, exp]);

  // Insights generation
  const insightsList = useMemo(() => {
    const [y, m] = ym.split('-').map(Number);
    const dim = new Date(y, m, 0).getDate();
    const isCur = ym === TODAY.slice(0, 7);
    const el = isCur ? +TODAY.slice(8, 10) : dim;
    const it: Array<[string, React.ReactNode]> = [];

    const ex = monthRows.filter((r) => r.t === 'exp');
    const { by, ks } = categoryStats;
    const topCat = ks[0];

    if (topCat && exp > 0) {
      it.push([
        emojis[topCat] || '✨',
        <span><b>{topCat}</b> is your top spend, {Math.round((by[topCat].a / exp) * 100)}% of expenses.</span>
      ]);
    }

    if (exp > 0 && el > 0) {
      it.push(['📅', <span>You spend about <b>{inr(exp / el)}</b> a day.</span>]);
    }

    if (isCur && exp > 0 && el > 0) {
      it.push(['🔮', <span>At this pace you’ll spend <b>{inr((exp / el) * dim)}</b> by month end.</span>]);
    }

    if (inc > 0) {
      it.push(['🐷', <span>Your savings rate is <b>{Math.round(((inc - exp) / inc) * 100)}%</b>.</span>]);
    }

    // Comparison vs previous month
    const prevMonthDate = new Date(y, m - 2, 1);
    const prevKey = prevMonthDate.toLocaleDateString('en-CA').slice(0, 7);
    const prevExp = allRows
      .filter((r) => (r.d || D0).slice(0, 7) === prevKey && r.t === 'exp')
      .reduce((a, r) => a + r.a, 0);

    if (prevExp > 0 && exp > 0) {
      const diff = exp - prevExp;
      it.push([
        diff > 0 ? '📈' : '📉',
        <span>Spending is <b>{inr(Math.abs(diff))}</b> {diff > 0 ? 'higher' : 'lower'} than last month.</span>
      ]);
    }

    if (ex.length > 0) {
      const biggest = ex.reduce((a, r) => (r.a > a.a ? r : a));
      it.push(['🎈', <span>Biggest expense: <b>{inr(biggest.a)}</b> on {biggest.c}.</span>]);
    }

    return it;
  }, [ym, TODAY, monthRows, exp, inc, categoryStats, emojis, allRows]);

  // Budget calculations
  const budgetProgress = useMemo(() => {
    const pc = budget > 0 ? Math.round((exp / budget) * 100) : 0;
    const left = budget - exp;
    const [y, m] = ym.split('-').map(Number);
    const dim = new Date(y, m, 0).getDate();
    const isCur = ym === TODAY.slice(0, 7);
    const el = isCur ? +TODAY.slice(8, 10) : dim;

    let bmsg = '';
    if (left < 0) {
      bmsg = `Over by ${inr(-left)} ⚠️`;
    } else if (isCur) {
      const daysLeft = Math.max(1, dim - el + 1);
      bmsg = `${inr(left / daysLeft)} a day left 🌿`;
    } else {
      bmsg = `${inr(left)} left`;
    }

    const fillClass = pc >= 100 ? 'bad' : pc >= 80 ? 'warn' : 'ok';
    return { pc: Math.min(100, pc), left, bmsg, fillClass };
  }, [exp, budget, ym, TODAY]);

  // Goal calculations
  const goalProgress = useMemo(() => {
    const gp = goal > 0 ? Math.min(100, Math.round((Math.max(net, 0) / goal) * 100)) : 0;
    let gmsg = 'Small steps add up 🌱';
    if (gp >= 100) gmsg = 'Goal reached! 🎉';
    else if (gp >= 50) gmsg = 'More than halfway, keep going 🌱';

    return { gp, gmsg };
  }, [net, goal]);

  // 4 Stat Cards
  const statNumbers = useMemo(() => {
    const incCount = monthRows.filter((r) => r.t === 'inc').length;
    const expCount = monthRows.filter((r) => r.t === 'exp').length;
    const totalCount = monthRows.length;
    const avg = totalCount > 0 ? (inc + exp) / totalCount : 0;
    const largestSpend = Math.max(0, ...monthRows.filter((r) => r.t === 'exp').map((r) => r.a));
    return { incCount, expCount, avg, largestSpend };
  }, [monthRows, inc, exp]);

  // Income vs Expense Chart (7D, 30D, 6M)
  const chartData = useMemo(() => {
    const n = range === 6 ? 6 : range;
    const pts: Array<{ lab: string; i: number; a: number; b: number }> = [];
    let ti = 0;
    let te = 0;

    for (let i = n - 1; i >= 0; i--) {
      let lab = '';
      let matchFn: (r: { d: string }) => boolean;

      if (range === 6) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const k = d.toLocaleDateString('en-CA').slice(0, 7);
        lab = d.toLocaleDateString('en-IN', { month: 'short' });
        matchFn = (r) => (r.d || D0).slice(0, 7) === k;
      } else {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = d.toLocaleDateString('en-CA');
        lab = range === 7 ? d.toLocaleDateString('en-IN', { weekday: 'short' }) : String(d.getDate());
        matchFn = (r) => (r.d || D0) === k;
      }

      const matching = allRows.filter(matchFn);
      const incTotal = matching.filter((r) => r.t === 'inc').reduce((acc, r) => acc + r.a, 0);
      const expTotal = matching.filter((r) => r.t === 'exp').reduce((acc, r) => acc + r.a, 0);
      ti += incTotal;
      te += expTotal;
      pts.push({ lab, i, a: incTotal, b: expTotal });
    }

    const mx = Math.max(1, ...pts.flatMap((p) => [p.a, p.b]));
    const H = 150;

    return { pts, mx, H, netTotal: ti - te };
  }, [range, allRows]);

  // Filtered payment history list
  const filteredList = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return monthRows.filter((r) => {
      if (filterType !== 'all' && r.t !== filterType) return false;
      if (filterCategory && r.c !== filterCategory) return false;
      if (t) {
        const hay = `${r.c} ${r.n}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [monthRows, filterType, filterCategory, searchTerm]);

  // Grouped by day
  const groupedDays = useMemo(() => {
    const days = [...new Set(filteredList.map((r) => r.d || D0))].sort().reverse();
    return days.map((d) => {
      const items = filteredList.filter((r) => (r.d || D0) === d);
      const dayNet = items.reduce((acc, r) => acc + (r.t === 'inc' ? r.a : -r.a), 0);
      return { dateStr: d, dayNet, items };
    });
  }, [filteredList]);

  // Foot sums
  const { totalInFilter, totalOutFilter } = useMemo(() => {
    const vi = filteredList.filter((r) => r.t === 'inc').reduce((acc, r) => acc + r.a, 0);
    const ve = filteredList.filter((r) => r.t === 'exp').reduce((acc, r) => acc + r.a, 0);
    return { totalInFilter: vi, totalOutFilter: ve };
  }, [filteredList]);

  // Open Add Entry Modal
  const openAdd = () => {
    setEditingId(null);
    setEntryKind('exp');
    setEntryAmount('');
    setEntryDate(TODAY);
    setEntryCategory(Object.keys(emojis)[0] || 'General');
    setEntryNote('');
    setIsEntryModalOpen(true);
    playPopSound();
  };

  // Open Edit Entry Modal
  const openEdit = (row: typeof allRows[0]) => {
    setEditingId(row.id);
    setEntryKind(row.t);
    setEntryAmount(String(row.a));
    setEntryDate(row.d || TODAY);
    setEntryCategory(row.c || 'General');
    setEntryNote(row.n || '');
    setIsEntryModalOpen(true);
    playPopSound();
  };

  // Save entry handler
  const handleSaveEntry = () => {
    const amt = parseFloat(entryAmount);
    if (!(amt > 0)) return;

    const icon = emojis[entryCategory] || '✨';

    if (editingId && onEditTransaction) {
      const existing = transactions.find((t) => t.id === editingId);
      if (existing) {
        onEditTransaction({
          ...existing,
          type: entryKind === 'inc' ? 'income' : 'expense',
          amount: amt,
          category: entryCategory,
          categoryIcon: icon,
          note: entryNote.trim(),
          date: entryDate || TODAY,
          updatedAt: new Date().toISOString()
        });
      }
      showToast(entryKind === 'inc' ? 'Income updated 🌿' : 'Expense updated 🌸');
    } else if (onQuickAdd) {
      onQuickAdd({
        type: entryKind === 'inc' ? 'income' : 'expense',
        amount: amt,
        category: entryCategory,
        categoryIcon: icon,
        note: entryNote.trim(),
        date: entryDate || TODAY
      });
      showToast(entryKind === 'inc' ? 'Income added 🌿' : 'Expense added 🌸');
    }

    setYm((entryDate || TODAY).slice(0, 7));
    setIsEntryModalOpen(false);
    playPopSound();
    triggerPartyPop('stars');
  };

  // Delete prompt & confirmation
  const promptDeleteRow = (e: React.MouseEvent, row: typeof allRows[0]) => {
    e.stopPropagation();
    setDeletingRow(row);
  };

  const confirmDeleteRow = () => {
    if (!deletingRow) return;
    const rowToDelete = deletingRow;
    const originalTx = transactions.find((t) => t.id === rowToDelete.id);
    setDeletingRow(null);

    if (onDeleteTransaction) {
      onDeleteTransaction(rowToDelete.id);
    }

    showToast('Entry deleted', 'Undo', () => {
      if (onQuickAdd && originalTx) {
        onQuickAdd({
          type: originalTx.type,
          amount: originalTx.amount,
          category: originalTx.category,
          categoryIcon: originalTx.categoryIcon,
          note: originalTx.note,
          date: originalTx.date
        });
      }
    });
    playPopSound();
  };

  return (
    <div className="finance-container">
      <div className="wrap">
        
        {/* Header */}
        <header className="head">
          <div className="logo">
            <img src={avatarImg} alt="Sreeshnav" />
          </div>
          <div>
            <h1>Personal Finance</h1>
            <p id="sub">{greetingSubtitle}</p>
          </div>
          <div className="sp" />

          {/* Search Toggle Icon */}
          <button
            className="icon"
            onClick={() => {
              setIsSearchOpen((prev) => !prev);
              playPopSound();
            }}
            aria-label="Search entries"
            title="Search entries"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>

          {/* Desktop Add Entry Button */}
          <button className="btn header-add-btn" onClick={openAdd} aria-label="Add entry">
            ＋ Add entry
          </button>
        </header>

        {/* Month Selector Row */}
        <div className="mrow">
          <button className="icon" onClick={() => shiftM(-1)} aria-label="Previous month">
            ‹
          </button>
          <span className="chip" id="mon">
            {monthLabel}
          </span>
          <button className="icon" onClick={() => shiftM(1)} aria-label="Next month">
            ›
          </button>
        </div>

        {/* Search Input Bar */}
        {isSearchOpen && (
          <input
            className="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by category or note"
            aria-label="Search entries"
            autoFocus
          />
        )}

        {/* Main 2-Column Responsive Grid (5fr / 7fr) */}
        <main className="grid">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: HERO BALANCE, WHERE IT WENT, BUDGET, INSIGHTS */}
          {/* ========================================================= */}
          <section style={{ display: 'grid', gap: '18px' }}>
            
            {/* 1. HERO NET BALANCE CARD */}
            <div className="card hero" id="heroCard">
              <div className="hrow">
                <div>
                  <small>🐷 Net balance</small>
                  <div className="big num">{inr(net)}</div>
                  <small>{pct}% of this month’s earnings kept</small>
                </div>
                <div
                  className="ring"
                  style={{
                    background: `conic-gradient(#FFD27A ${pct * 3.6}deg, rgba(255,255,255,.18) 0)`
                  }}
                >
                  <b className="num">{pct}%</b>
                </div>
              </div>

              <div className="pair">
                <div className="pill">
                  <span>Earned</span>
                  <b className="num">+{inr(inc)}</b>
                </div>
                <div className="pill">
                  <span>Spent</span>
                  <b className="num">−{inr(exp)}</b>
                </div>
              </div>
            </div>

            {/* 2. WHERE IT WENT (DONUT & CATEGORIES) */}
            <div className="card">
              <div className="hrow">
                <h2>Where it went 🍰</h2>
                <button
                  className="icon"
                  onClick={() => {
                    setIsCatModalOpen(true);
                    playPopSound();
                  }}
                  aria-label="Manage categories"
                  title="Manage categories"
                >
                  🏷️
                </button>
              </div>

              <div className="dwrap">
                <div className="donut" style={{ background: categoryStats.donutGradient }}>
                  <b className="num">{inr(exp)}</b>
                </div>
                <div id="legend">
                  {categoryStats.ks.map((k, i) => (
                    <div key={k} className="lg">
                      <i style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span>{k}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category bars */}
              <div id="cats">
                {categoryStats.ks.length === 0 ? (
                  <div className="empty">No spending yet.</div>
                ) : (
                  categoryStats.ks.map((k) => {
                    const p = exp > 0 ? Math.round((categoryStats.by[k].a / exp) * 100) : 0;
                    return (
                      <div key={k} className="cat">
                        <div className="r">
                          <span className="em">{emojis[k] || '✨'}</span>
                          <span>
                            {k} <small>{categoryStats.by[k].n} payment{categoryStats.by[k].n > 1 ? 's' : ''}</small>
                          </span>
                          <span className="sp" />
                          <span className="num">{inr(categoryStats.by[k].a)}</span>
                          <small>{p}%</small>
                        </div>
                        <div className="bar">
                          <i style={{ width: `${p}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. MONTHLY BUDGET */}
            <div className="card">
              <div className="hrow">
                <h2>Monthly budget 👛</h2>
                <label className="gl">
                  ₹
                  <input
                    type="number"
                    value={budget}
                    min="1"
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > 0) {
                        setBudget(v);
                        saveSettings(goal, v);
                      }
                    }}
                    aria-label="Monthly spending budget"
                  />
                </label>
              </div>

              <div className="gbar">
                <i className={budgetProgress.fillClass} style={{ width: `${budgetProgress.pc}%` }} />
              </div>

              <div className="hrow">
                <span className="num">{inr(exp)} of {inr(budget)}</span>
                <small style={{ color: 'var(--mute)', fontWeight: 600 }}>{budgetProgress.bmsg}</small>
              </div>
            </div>

            {/* 4. INSIGHTS */}
            <div className="card">
              <h2>Insights 💡</h2>
              <div id="ins" style={{ marginTop: '8px' }}>
                {insightsList.length === 0 ? (
                  <div className="empty">Add a few entries and tips will show up here ✨</div>
                ) : (
                  insightsList.map(([icon, textNode], idx) => (
                    <div key={idx} className="it">
                      <span className="it-icon">{icon}</span>
                      <p className="it-text">{textNode}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </section>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: MONTHLY GOAL, STATS, CHART, PAYMENT HISTORY  */}
          {/* ========================================================= */}
          <section style={{ display: 'grid', gap: '18px' }}>
            
            {/* 1. MONTHLY SAVINGS GOAL */}
            <div className="card goalc">
              <div className="hrow">
                <h2>Monthly goal 🎯</h2>
                <label className="gl">
                  ₹
                  <input
                    type="number"
                    value={goal}
                    min="1"
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (v > 0) {
                        setGoal(v);
                        saveSettings(v, budget);
                      }
                    }}
                    aria-label="Monthly savings goal"
                  />
                </label>
              </div>

              <div className="gbar">
                <i style={{ width: `${goalProgress.gp}%` }} />
              </div>

              <div className="hrow">
                <span className="num">{inr(Math.max(net, 0))} of {inr(goal)}</span>
                <small style={{ color: 'var(--mute)', fontWeight: 600 }}>{goalProgress.gmsg}</small>
              </div>
            </div>

            {/* 2. 4 STAT CARDS */}
            <div className="stats">
              <div className="stat in">
                <span>🌿 Inflow ({statNumbers.incCount})</span>
                <b className="num">+{inr(inc)}</b>
              </div>
              <div className="stat out">
                <span>🌸 Outflow ({statNumbers.expCount})</span>
                <b className="num">−{inr(exp)}</b>
              </div>
              <div className="stat">
                <span>🧮 Average entry</span>
                <b className="num">{inr(statNumbers.avg)}</b>
              </div>
              <div className="stat">
                <span>🎈 Largest spend</span>
                <b className="num">{inr(statNumbers.largestSpend)}</b>
              </div>
            </div>

            {/* 3. INCOME VS EXPENSE BAR CHART */}
            <div className="card">
              <div className="hrow">
                <h2>Income vs expense 📊</h2>
                <div className="tabs">
                  <button
                    aria-pressed={range === 7}
                    className={range === 7 ? 'active' : ''}
                    onClick={() => {
                      setRange(7);
                      playPopSound();
                    }}
                  >
                    7D
                  </button>
                  <button
                    aria-pressed={range === 30}
                    className={range === 30 ? 'active' : ''}
                    onClick={() => {
                      setRange(30);
                      playPopSound();
                    }}
                  >
                    30D
                  </button>
                  <button
                    aria-pressed={range === 6}
                    className={range === 6 ? 'active' : ''}
                    onClick={() => {
                      setRange(6);
                      playPopSound();
                    }}
                  >
                    6M
                  </button>
                </div>
              </div>

              <div className="lgd">
                <span><i style={{ background: 'var(--inc)' }} />Income</span>
                <span><i style={{ background: 'var(--rose)' }} />Expense</span>
                <span className="num">Net {inr(chartData.netTotal)}</span>
              </div>

              <div className="cw">
                <div className="plot">
                  <span className="ymax num">₹{Math.round(chartData.mx).toLocaleString('en-IN')}</span>
                  {chartData.pts.map((p) => {
                    const incH = p.a > 0 ? Math.max(3, Math.round((p.a / chartData.mx) * chartData.H)) : 0;
                    const expH = p.b > 0 ? Math.max(3, Math.round((p.b / chartData.mx) * chartData.H)) : 0;
                    const showLabel = !(range === 30 && (chartData.pts.length - 1 - p.i) % 5 !== 0 && p.i !== 0);

                    return (
                      <div
                        key={p.i}
                        className={`g ${p.i === 0 ? 'now' : ''}`}
                        title={`${p.lab}: In ${inr(p.a)}, Out ${inr(p.b)}`}
                      >
                        <div className="bars">
                          <i className="bi" style={{ height: `${incH}px` }} />
                          <i className="be" style={{ height: `${expH}px` }} />
                        </div>
                        <small>{showLabel ? p.lab : ''}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. PAYMENT HISTORY */}
            <div className="card">
              <div className="hh">
                <h2>Payment history</h2>
                <div className="tabs">
                  <button
                    aria-pressed={filterType === 'all'}
                    className={filterType === 'all' ? 'active' : ''}
                    onClick={() => {
                      setFilterType('all');
                      playPopSound();
                    }}
                  >
                    All
                  </button>
                  <button
                    aria-pressed={filterType === 'exp'}
                    className={filterType === 'exp' ? 'active' : ''}
                    onClick={() => {
                      setFilterType('exp');
                      playPopSound();
                    }}
                  >
                    Expenses
                  </button>
                  <button
                    aria-pressed={filterType === 'inc'}
                    className={filterType === 'inc' ? 'active' : ''}
                    onClick={() => {
                      setFilterType('inc');
                      playPopSound();
                    }}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Category Filter dropdown */}
              <select
                id="cfil"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {Object.keys(emojis).map((k) => (
                  <option key={k} value={k}>
                    {(emojis[k] || '✨') + ' ' + k}
                  </option>
                ))}
              </select>

              {/* Transaction list grouped by day */}
              <div id="list">
                {groupedDays.length === 0 ? (
                  <div className="empty">
                    Nothing here yet 🌱
                    <br />
                    Tap “Add entry” to log your first one.
                  </div>
                ) : (
                  groupedDays.map(({ dateStr, dayNet, items }) => (
                    <React.Fragment key={dateStr}>
                      <div className="day">
                        <span>{dateStr === TODAY ? 'Today' : fmtD(dateStr)}</span>
                        <span className="num">Net {inr(dayNet)}</span>
                      </div>
                      {items.map((row) => (
                        <div
                          key={row.id}
                          className="tx"
                          tabIndex={0}
                          role="button"
                          onClick={() => openEdit(row)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') openEdit(row);
                          }}
                        >
                          <div className="em">{emojis[row.c] || '✨'}</div>
                          <div className="t">
                            <b>{row.c}</b>
                            {row.n && <small>{row.n}</small>}
                          </div>
                          <div
                            className="a num"
                            style={{ color: row.t === 'inc' ? 'var(--inc)' : 'var(--rose)' }}
                          >
                            {row.t === 'inc' ? '+' : '−'}
                            {inr(row.a)}
                          </div>
                          <button
                            className="del"
                            onClick={(e) => promptDeleteRow(e, row)}
                            aria-label="Delete entry"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </div>

              {/* List Footer with In / Out / Net totals */}
              <div className="foot">
                <span style={{ color: 'var(--inc)' }}>In +{inr(totalInFilter)}</span>
                <span style={{ color: 'var(--rose)' }}>Out −{inr(totalOutFilter)}</span>
                <span>Net {inr(totalInFilter - totalOutFilter)}</span>
              </div>
            </div>

          </section>

        </main>
      </div>

      {/* Floating Action Button for Mobile */}
      <button className="btn fab" onClick={openAdd} aria-label="Add entry">
        ＋ Add entry
      </button>

      {/* Toast Notification with Undo */}
      {toastMessage && (
        <div className="toast on" role="status">
          <span>{toastMessage}</span>
          {toastAction && (
            <button
              onClick={() => {
                toastAction.onClick();
                setToastMessage(null);
                setToastAction(null);
              }}
            >
              {toastAction.label}
            </button>
          )}
        </div>
      )}

      {/* Sheet Modal 1: Add / Edit Entry */}
      {isEntryModalOpen && (
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEntryModalOpen(false);
          }}
        >
          <div className="panel animate-in slide-in-from-bottom duration-200">
            <h2>{editingId ? 'Edit entry' : 'Add entry'}</h2>

            {/* Income / Expense Seg switcher */}
            <div className="seg">
              <button
                className={`transition-all ${entryKind === 'exp' ? 'on e' : ''}`}
                onClick={() => setEntryKind('exp')}
              >
                Expense
              </button>
              <button
                className={`transition-all ${entryKind === 'inc' ? 'on i' : ''}`}
                onClick={() => setEntryKind('inc')}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <label>
              Amount (₹)
              <input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="0"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                autoFocus
              />
            </label>

            {/* Quick buttons */}
            <div className="quick">
              <button type="button" onClick={() => setEntryAmount('10')}>₹10</button>
              <button type="button" onClick={() => setEntryAmount('20')}>₹20</button>
              <button type="button" onClick={() => setEntryAmount('50')}>₹50</button>
              <button type="button" onClick={() => setEntryAmount('100')}>₹100</button>
            </div>

            {/* Date */}
            <label>
              Date
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </label>

            {/* Category Select */}
            <label>
              Category
              <select
                value={entryCategory}
                onChange={(e) => setEntryCategory(e.target.value)}
              >
                {Object.keys(emojis).map((k) => (
                  <option key={k} value={k}>
                    {(emojis[k] || '✨') + ' ' + k}
                  </option>
                ))}
              </select>
            </label>

            {/* Note */}
            <label>
              Note (optional)
              <input
                placeholder="e.g. Dairy milk"
                value={entryNote}
                onChange={(e) => setEntryNote(e.target.value)}
              />
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="icon"
                style={{ width: 'auto', padding: '0 18px', borderRadius: '999px', font: 'inherit', fontWeight: 600 }}
                onClick={() => setIsEntryModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleSaveEntry}
              >
                {editingId ? 'Save changes' : 'Save entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheet Modal 2: Manage Categories */}
      {isCatModalOpen && (
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCatModalOpen(false);
          }}
        >
          <div className="panel" style={{ maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="hrow">
              <h2>My categories 🏷️</h2>
              <button className="icon" onClick={() => setIsCatModalOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {Object.entries(emojis).map(([name, emoji]) => (
                <div key={name} className="crow">
                  <input
                    className="ce"
                    value={emoji}
                    maxLength={4}
                    onChange={(e) => {
                      const val = e.target.value.trim() || '✨';
                      const updated = { ...emojis, [name]: val };
                      saveCats(updated);
                    }}
                    aria-label={`Emoji for ${name}`}
                  />
                  <input
                    className="cn"
                    value={name}
                    onChange={(e) => {
                      const newN = e.target.value.trim();
                      if (!newN || newN === name) return;
                      if (emojis[newN]) {
                        showToast('That name already exists');
                        return;
                      }
                      const updated: Record<string, string> = {};
                      Object.entries(emojis).forEach(([k, v]) => {
                        updated[k === name ? newN : k] = v;
                      });
                      saveCats(updated);
                    }}
                    aria-label={`Name for ${name}`}
                  />
                  <button
                    type="button"
                    className="del"
                    onClick={() => {
                      if (Object.keys(emojis).length <= 1) {
                        showToast('Keep at least one category');
                        return;
                      }
                      const hasEntries = allRows.some((r) => r.c === name);
                      if (hasEntries) {
                        showToast('Entries use it. Rename it instead');
                        return;
                      }
                      const updated = { ...emojis };
                      delete updated[name];
                      saveCats(updated);
                    }}
                    aria-label={`Delete ${name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Category Row */}
            <div className="crow add">
              <input
                className="ce"
                value={newCatEmoji}
                maxLength={4}
                onChange={(e) => setNewCatEmoji(e.target.value)}
                placeholder="🍩"
                aria-label="New category emoji"
              />
              <input
                className="cn"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category name"
                aria-label="New category name"
              />
              <button
                type="button"
                className="btn"
                style={{ padding: '10px 16px' }}
                onClick={() => {
                  const n = newCatName.trim();
                  if (!n) return;
                  if (emojis[n]) {
                    showToast('That name already exists');
                    return;
                  }
                  const updated = { ...emojis, [n]: newCatEmoji.trim() || '✨' };
                  saveCats(updated);
                  setNewCatName('');
                  setNewCatEmoji('🍩');
                  showToast('Category added 🌟');
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Sheet */}
      {deletingRow && (
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingRow(null);
          }}
        >
          <div className="panel animate-in slide-in-from-bottom duration-200" style={{ maxWidth: '400px' }}>
            <div className="hrow">
              <h2>Delete transaction? 🗑️</h2>
              <button className="icon" onClick={() => setDeletingRow(null)} aria-label="Cancel">✕</button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '16px',
              background: 'var(--sun)',
              border: '1px solid var(--line)',
              margin: '4px 0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--card)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '20px',
                flex: 'none',
                boxShadow: 'var(--shadow)'
              }}>
                {emojis[deletingRow.c] || '🏷️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>{deletingRow.c}</div>
                <div style={{ fontSize: '12px', color: 'var(--mute)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deletingRow.n ? `${deletingRow.n} • ${deletingRow.d}` : deletingRow.d}
                </div>
              </div>
              <div style={{
                fontWeight: 700,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                color: deletingRow.t === 'inc' ? 'var(--inc)' : 'var(--rose)'
              }}>
                {deletingRow.t === 'inc' ? '+' : '−'}{inr(deletingRow.a)}
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--mute)', margin: '2px 0 6px', lineHeight: 1.45 }}>
              Are you sure you want to delete this {deletingRow.t === 'inc' ? 'income' : 'expense'}?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setDeletingRow(null)}
                style={{
                  font: 'inherit',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteRow}
                style={{
                  font: 'inherit',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #F59AB1, #D6456B)',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(214, 69, 107, 0.35)'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
