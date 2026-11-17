import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Check, 
  Delete, 
  Tag, 
  ArrowDownLeft, 
  ArrowUpRight,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  RotateCcw,
  Smile
} from 'lucide-react';
import type { FinanceTransaction, TransactionType, FinanceCategory } from '../../types/finance';
import { DEFAULT_FINANCE_CATEGORIES, CUTE_CATEGORY_ICONS, CATEGORY_QUICK_NOTES } from '../../types/finance';
import { todayKey, addDays } from '../../utils/dates';
import { playPopSound, triggerPartyPop } from '../../utils/delight';

interface FinanceNumpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: FinanceTransaction | null;
  categories: FinanceCategory[];
  currency?: string;
  onSaveCategory: (cat: FinanceCategory) => void;
  onDeleteCategory: (id: string) => void;
}

export const FinanceNumpadModal: React.FC<FinanceNumpadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  currency = '$',
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<FinanceCategory>(
    categories[0] || DEFAULT_FINANCE_CATEGORIES[0]
  );
  const [merchant, setMerchant] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [editingCategoryTarget, setEditingCategoryTarget] = useState<FinanceCategory | null>(null);

  // Category Editor fields
  const [catNameInput, setCatNameInput] = useState('');
  const [catIconInput, setCatIconInput] = useState('🏷️');
  const [catTypeInput, setCatTypeInput] = useState<TransactionType>('expense');

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Generate 7-day pill strip centered around today or selected date
  const dateStrip = Array.from({ length: 7 }, (_, i) => {
    const dStr = addDays(todayKey(), i - 3);
    const dObj = new Date(dStr + 'T00:00:00');
    return {
      dateStr: dStr,
      dayNum: dObj.getDate(),
      dayName: dObj.toLocaleDateString('default', { weekday: 'short' }).toLowerCase(),
      isToday: dStr === todayKey(),
    };
  });

  // Filter categories by current mode (expense / income)
  const currentModeCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountStr(String(initialData.amount));
      const matchCat = categories.find(
        (c) => c.name.toLowerCase() === initialData.category.toLowerCase()
      );
      if (matchCat) {
        setSelectedCategory(matchCat);
      } else {
        setSelectedCategory({
          id: 'custom',
          name: initialData.category,
          icon: initialData.categoryIcon || '💸',
          type: initialData.type,
        });
      }
      setMerchant(initialData.merchant || initialData.note || '');
      setSelectedDate(initialData.date || todayKey());
    } else {
      setType('expense');
      setAmountStr('0');
      const firstExp = categories.find((c) => c.type === 'expense') || categories[0] || DEFAULT_FINANCE_CATEGORIES[0];
      setSelectedCategory(firstExp);
      setMerchant('');
      setSelectedDate(todayKey());
    }
    setIsCategoryPickerOpen(false);
    setIsCategoryEditorOpen(false);
    setEditingCategoryTarget(null);
  }, [initialData, isOpen, categories]);

  // When switching type (expense <-> income), select the first available category of that type
  const handleTypeSwitch = (newType: TransactionType) => {
    playPopSound();
    setType(newType);
    const matching = categories.find((c) => c.type === newType);
    if (matching) {
      setSelectedCategory(matching);
    }
  };

  // Keyboard support for desktop
  useEffect(() => {
    if (!isOpen || isCategoryEditorOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused on the text note/merchant or amount input, let default typing happen
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        if (e.key === 'Enter') {
          handleSubmit();
        } else if (e.key === 'Escape') {
          onClose();
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === '.') {
        handleDot();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+') {
        handleOperator('+');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, amountStr, type, selectedCategory, merchant, selectedDate, isCategoryEditorOpen]);

  // Evaluates math if present (e.g. "12+4.50" -> 16.5)
  const parseComputedAmount = (str: string): number => {
    try {
      if (str.includes('+')) {
        const parts = str.split('+');
        return parts.reduce((sum, p) => sum + (parseFloat(p) || 0), 0);
      }
      return parseFloat(str) || 0;
    } catch {
      return parseFloat(str) || 0;
    }
  };

  // Keypad logic
  const handleDigit = (digit: string) => {
    playPopSound();
    setAmountStr((prev) => {
      if (prev === '0') return digit;
      // If after '+', allow new leading number
      const lastToken = prev.split('+').pop() || '';
      if (lastToken === '0') {
        return prev.slice(0, -1) + digit;
      }
      // Max 2 decimal places on current token
      if (lastToken.includes('.')) {
        const decimals = lastToken.split('.')[1];
        if (decimals && decimals.length >= 2) return prev;
      }
      return prev + digit;
    });
  };

  const handleDot = () => {
    playPopSound();
    setAmountStr((prev) => {
      const lastToken = prev.split('+').pop() || '';
      if (lastToken.includes('.')) return prev;
      if (lastToken === '') return prev + '0.';
      return prev + '.';
    });
  };

  const handleOperator = (op: string) => {
    playPopSound();
    setAmountStr((prev) => {
      if (prev.endsWith('+')) return prev;
      const computed = parseComputedAmount(prev);
      return `${computed}${op}`;
    });
  };

  const handleBackspace = () => {
    playPopSound();
    setAmountStr((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    playPopSound();
    setAmountStr('0');
  };

  // Quick preset add chips (+5, +10, +25, +50, +100)
  const handleQuickAdd = (increment: number) => {
    playPopSound();
    setAmountStr((prev) => {
      const current = parseComputedAmount(prev);
      const next = Math.max(0, current + increment);
      return next % 1 === 0 ? String(next) : next.toFixed(2);
    });
  };

  const handleSubmit = () => {
    const finalAmount = Math.round(parseComputedAmount(amountStr) * 100) / 100;
    if (finalAmount <= 0) {
      alert('Please enter an amount greater than 0');
      return;
    }

    triggerPartyPop();
    onSave({
      type,
      amount: finalAmount,
      category: selectedCategory.name,
      categoryIcon: selectedCategory.icon,
      merchant: merchant.trim() || undefined,
      note: merchant.trim() || undefined,
      date: selectedDate,
    });
  };

  // Category Editor Handlers
  const handleOpenNewCategory = () => {
    playPopSound();
    setEditingCategoryTarget(null);
    setCatNameInput('');
    setCatIconInput(type === 'expense' ? '🏷️' : '💰');
    setCatTypeInput(type);
    setIsCategoryEditorOpen(true);
  };

  const handleOpenEditCategory = (cat: FinanceCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound();
    setEditingCategoryTarget(cat);
    setCatNameInput(cat.name);
    setCatIconInput(cat.icon);
    setCatTypeInput(cat.type);
    setIsCategoryEditorOpen(true);
  };

  const handleSaveCategorySubmit = () => {
    if (!catNameInput.trim()) {
      alert('Please enter a category name');
      return;
    }
    playPopSound();
    const newOrUpdated: FinanceCategory = {
      id: editingCategoryTarget ? editingCategoryTarget.id : `fcat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: catNameInput.trim(),
      icon: catIconInput.trim() || '🏷️',
      type: catTypeInput,
    };
    onSaveCategory(newOrUpdated);
    setSelectedCategory(newOrUpdated);
    setIsCategoryEditorOpen(false);
  };

  const handleDeleteCategorySubmit = (id: string) => {
    if (window.confirm('Delete this category?')) {
      playPopSound();
      onDeleteCategory(id);
      setIsCategoryEditorOpen(false);
      const fallback = categories.find((c) => c.id !== id && c.type === type) || DEFAULT_FINANCE_CATEGORIES[0];
      setSelectedCategory(fallback);
    }
  };

  if (!isOpen) return null;

  // Available quick notes for selected category
  const quickNotes = CATEGORY_QUICK_NOTES[selectedCategory.name] || [
    'General', 'Daily', 'Online', 'In Store', 'Subscription'
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm sm:max-w-md bg-surface text-main rounded-t-3xl sm:rounded-3xl border border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER: Close & Segmented Type Toggle [expenses] [income] */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-subtle/50">
          <button
            onClick={() => {
              playPopSound();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-sunken text-muted hover:text-main transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Segmented Pill Toggle */}
          <div className="flex items-center gap-1 p-1 bg-sunken rounded-full border border-subtle">
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-main text-surface shadow-2xs font-extrabold'
                  : 'text-muted hover:text-main'
              }`}
            >
              expenses
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-main text-surface shadow-2xs font-extrabold'
                  : 'text-muted hover:text-main'
              }`}
            >
              income
            </button>
          </div>

          <div className="w-8" />
        </div>

        {/* 7-DAY HORIZONTAL PILL STRIP */}
        <div className="px-4 py-2 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none border-b border-subtle/40 bg-sunken/30">
          {dateStrip.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            return (
              <button
                key={item.dateStr}
                onClick={() => {
                  playPopSound();
                  setSelectedDate(item.dateStr);
                }}
                className={`flex flex-col items-center justify-center min-w-[40px] py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-main text-surface shadow-xs font-bold scale-105'
                    : 'text-muted hover:text-main hover:bg-surface/80'
                }`}
              >
                <span className="text-xs font-mono font-extrabold leading-none">
                  {item.dayNum}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-75 mt-0.5">
                  {item.dayName}
                </span>
              </button>
            );
          })}

          {/* Custom Date Picker button */}
          <div className="relative shrink-0 pl-1">
            <label className="p-2 rounded-xl bg-surface border border-subtle hover:bg-sunken text-muted hover:text-main cursor-pointer flex items-center justify-center min-h-[36px] min-w-[36px]">
              <CalendarIcon size={14} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    playPopSound();
                    setSelectedDate(e.target.value);
                  }
                }}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* HERO AMOUNT DISPLAY (Direct Editable Input + Currency Symbol) */}
        <div className="px-6 pt-3 pb-2 text-center space-y-1">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-muted select-none">
              {currency}
            </span>
            <input
              ref={amountInputRef}
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.+]/g, '');
                setAmountStr(val || '0');
              }}
              className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-main bg-transparent text-center focus:outline-none max-w-[260px]"
            />
          </div>

          {/* Running Calculation Preview if user entered '+' */}
          {amountStr.includes('+') && (
            <p className="text-xs font-mono font-bold text-accent">
              = {currency}{parseComputedAmount(amountStr).toFixed(2)}
            </p>
          )}

          {/* QUICK PRESET CHIPS: +5, +10, +25, +50, +100, AC */}
          <div className="flex items-center justify-center gap-1.5 pt-1.5 flex-wrap">
            {[5, 10, 25, 50, 100].map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => handleQuickAdd(inc)}
                className="px-2.5 py-1 rounded-xl bg-sunken hover:bg-accent/15 border border-subtle/80 text-[11px] font-mono font-bold text-main transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                +{inc}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-mono font-bold transition-all active:scale-95 cursor-pointer"
            >
              AC
            </button>
          </div>

          {/* CATEGORY & MERCHANT SELECTOR PILLS */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                playPopSound();
                setIsCategoryPickerOpen(!isCategoryPickerOpen);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-main text-surface hover:opacity-90 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-sm select-none">{selectedCategory.icon}</span>
              <span className="truncate max-w-[130px]">{selectedCategory.name}</span>
              <ChevronDown size={12} className="stroke-[2.5]" />
            </button>

            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Merchant or note..."
              className="bg-sunken border border-subtle rounded-full px-3 py-1.5 text-xs text-main placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent max-w-[160px]"
            />
          </div>

          {/* Quick Note Suggestions for selected category */}
          <div className="flex items-center justify-center gap-1 overflow-x-auto scrollbar-none py-1">
            {quickNotes.slice(0, 4).map((qn) => (
              <button
                key={qn}
                type="button"
                onClick={() => {
                  playPopSound();
                  setMerchant(qn);
                }}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                  merchant === qn
                    ? 'bg-accent text-accent-fg border-accent font-bold'
                    : 'bg-surface hover:bg-sunken text-muted border-subtle/60'
                }`}
              >
                {qn}
              </button>
            ))}
          </div>
        </div>

        {/* CATEGORY PICKER & MANAGER DRAWER */}
        {isCategoryPickerOpen && (
          <div className="bg-sunken/90 border-t border-b border-subtle p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                Select or Edit {type} Category
              </span>
              <button
                type="button"
                onClick={handleOpenNewCategory}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-fg font-bold text-[10px] shadow-2xs hover:bg-accent-hover cursor-pointer"
              >
                <Plus size={11} className="stroke-[3]" />
                <span>New Category</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {currentModeCategories.map((cat) => {
                const isSelected = cat.id === selectedCategory.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      playPopSound();
                      setSelectedCategory(cat);
                      setIsCategoryPickerOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all group ${
                      isSelected
                        ? 'bg-main text-surface border-main font-bold shadow-2xs'
                        : 'bg-surface hover:bg-surface/90 text-main border-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-base select-none">{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </div>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditCategory(cat, e)}
                      className="opacity-60 group-hover:opacity-100 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-opacity"
                      title="Edit Category"
                    >
                      <Edit3 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 12-BUTTON MINIMALIST NUMPAD + OPERATOR STRIP */}
        <div className="px-5 pb-5 pt-1 space-y-2">
          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((keyVal) => (
              <button
                key={keyVal}
                type="button"
                onClick={() => (keyVal === '.' ? handleDot() : handleDigit(keyVal))}
                className="h-12 sm:h-13 rounded-2xl bg-sunken/80 hover:bg-sunken border border-subtle/50 text-main font-bold text-lg sm:text-xl font-mono shadow-2xs transition-all active:scale-95 flex items-center justify-center cursor-pointer select-none"
              >
                {keyVal}
              </button>
            ))}

            {/* Checkmark / Save Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="h-12 sm:h-13 rounded-2xl bg-accent hover:bg-accent-hover text-accent-fg font-extrabold shadow-sm transition-all active:scale-95 flex items-center justify-center cursor-pointer select-none"
              title="Save Transaction"
            >
              <Check size={22} className="stroke-[3]" />
            </button>
          </div>

          {/* Bottom Secondary Controls: Backspace & Math Add */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOperator('+')}
              className="py-2 rounded-xl bg-sunken/60 hover:bg-sunken border border-subtle/60 text-main text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={13} className="stroke-[2.5]" />
              <span>Add More (+)</span>
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2 rounded-xl bg-sunken/60 hover:bg-sunken border border-subtle/60 text-muted hover:text-main text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Delete size={14} />
              <span>Backspace</span>
            </button>
          </div>
        </div>

        {/* INLINE CATEGORY CREATOR / EDITOR MODAL */}
        {isCategoryEditorOpen && (
          <div className="absolute inset-0 z-50 bg-surface/95 backdrop-blur-md p-5 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-subtle pb-3">
                <h4 className="font-extrabold text-sm text-main">
                  {editingCategoryTarget ? 'Edit Category' : 'Create New Category'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCategoryEditorOpen(false)}
                  className="p-1 rounded-full hover:bg-sunken text-muted hover:text-main"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Type Toggle: Expense vs Income */}
              <div className="flex items-center gap-2 p-1 bg-sunken rounded-2xl border border-subtle">
                <button
                  type="button"
                  onClick={() => setCatTypeInput('expense')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    catTypeInput === 'expense'
                      ? 'bg-main text-surface shadow-2xs'
                      : 'text-muted'
                  }`}
                >
                  Expense Category
                </button>
                <button
                  type="button"
                  onClick={() => setCatTypeInput('income')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    catTypeInput === 'income'
                      ? 'bg-main text-surface shadow-2xs'
                      : 'text-muted'
                  }`}
                >
                  Income Category
                </button>
              </div>

              {/* Icon & Name Input */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-sunken border border-subtle flex items-center justify-center text-2xl shrink-0">
                  {catIconInput}
                </div>
                <input
                  type="text"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="Category Name (e.g. Bubble Tea)"
                  autoFocus
                  className="w-full bg-sunken border border-subtle rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-main font-semibold placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Cute Curated Emoji Palette */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                  Choose Cute Icon
                </label>
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-sunken rounded-2xl border border-subtle/60 max-h-36 overflow-y-auto">
                  {CUTE_CATEGORY_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        playPopSound();
                        setCatIconInput(emoji);
                      }}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer ${
                        catIconInput === emoji
                          ? 'bg-accent text-accent-fg shadow-2xs scale-110'
                          : 'hover:bg-surface'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-subtle">
              {editingCategoryTarget ? (
                <button
                  type="button"
                  onClick={() => handleDeleteCategorySubmit(editingCategoryTarget.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryEditorOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-sunken hover:bg-subtle text-xs font-bold text-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategorySubmit}
                  className="px-5 py-2 rounded-2xl bg-accent hover:bg-accent-hover text-accent-fg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
