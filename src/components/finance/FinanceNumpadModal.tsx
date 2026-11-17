import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Check, 
  Delete, 
  Tag, 
  ArrowDownLeft, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import type { FinanceTransaction, TransactionType, FinanceCategoryPreset } from '../../types/finance';
import { DEFAULT_FINANCE_CATEGORIES } from '../../types/finance';
import { todayKey, addDays } from '../../utils/dates';
import { playPopSound, triggerPartyPop } from '../../utils/delight';

interface FinanceNumpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<FinanceTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: FinanceTransaction | null;
}

export const FinanceNumpadModal: React.FC<FinanceNumpadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<FinanceCategoryPreset>(
    DEFAULT_FINANCE_CATEGORIES[0]
  );
  const [merchant, setMerchant] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

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

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountStr(String(initialData.amount));
      const matchCat = DEFAULT_FINANCE_CATEGORIES.find(
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
      setSelectedCategory(DEFAULT_FINANCE_CATEGORIES[0]);
      setMerchant('');
      setSelectedDate(todayKey());
    }
  }, [initialData, isOpen]);

  // Keyboard support for desktop
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, amountStr, type, selectedCategory, merchant, selectedDate]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    playPopSound();
    if (amountStr === '0') {
      setAmountStr(digit);
    } else {
      // Limit to 2 decimal places
      if (amountStr.includes('.')) {
        const parts = amountStr.split('.');
        if (parts[1] && parts[1].length >= 2) return;
      }
      if (amountStr.length >= 8) return;
      setAmountStr(amountStr + digit);
    }
  };

  const handleDot = () => {
    playPopSound();
    if (!amountStr.includes('.')) {
      setAmountStr(amountStr + '.');
    }
  };

  const handleBackspace = () => {
    playPopSound();
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr(amountStr.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    const num = parseFloat(amountStr);
    if (isNaN(num) || num <= 0) {
      return;
    }
    onSave({
      type,
      amount: Math.round(num * 100) / 100,
      category: selectedCategory.name,
      categoryIcon: selectedCategory.icon,
      merchant: merchant.trim() || undefined,
      note: merchant.trim() || undefined,
      date: selectedDate,
    });
    triggerPartyPop('single');
    playPopSound();
    onClose();
  };

  const availableCategories = DEFAULT_FINANCE_CATEGORIES.filter((c) => c.type === type);

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-main/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-raised border border-subtle flex flex-col max-h-[95vh] overflow-hidden text-main"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe Grab Indicator */}
        <div className="w-12 h-1.5 bg-border-strong rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Top Header & Type Switcher (Matches Screen 3) */}
        <div className="p-4 sm:p-5 pb-2 flex items-center justify-between border-b border-subtle">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-sunken border border-subtle">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setSelectedCategory(DEFAULT_FINANCE_CATEGORIES.find((c) => c.type === 'expense') || DEFAULT_FINANCE_CATEGORIES[0]);
                playPopSound();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-surface text-main shadow-2xs font-black'
                  : 'text-muted hover:text-main'
              }`}
            >
              expenses
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setSelectedCategory(DEFAULT_FINANCE_CATEGORIES.find((c) => c.type === 'income') || DEFAULT_FINANCE_CATEGORIES[11]);
                playPopSound();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-surface text-main shadow-2xs font-black'
                  : 'text-muted hover:text-main'
              }`}
            >
              income
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-faint hover:text-main rounded-xl hover:bg-sunken transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Date Selector Row (Screen 3: 12 mon, 13 tue, 14 wed...) */}
        <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar border-b border-subtle">
          {dateStrip.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDate(item.dateStr);
                  playPopSound();
                }}
                className={`flex-1 min-w-[42px] py-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-main text-on-accent font-black shadow-2xs scale-105'
                    : 'bg-sunken/60 hover:bg-sunken text-muted hover:text-main'
                }`}
              >
                <span className="text-xs font-mono font-bold leading-none">{item.dayNum}</span>
                <span className="text-[10px] uppercase font-bold opacity-80 mt-0.5 leading-none">{item.dayName}</span>
              </button>
            );
          })}

          <div className="relative shrink-0 ml-1">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Pick a custom date"
            />
            <div className="p-2 rounded-xl bg-sunken border border-subtle text-muted hover:text-main cursor-pointer">
              <CalendarIcon size={14} />
            </div>
          </div>
        </div>

        {/* Amount Display & Category / Merchant Pill (Matches Screen 3) */}
        <div className="p-4 sm:p-6 text-center space-y-2 bg-page/35 border-b border-subtle">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-main">
            {type === 'expense' ? '-' : '+'}${amountStr}
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Category Pill with Icon */}
            <button
              type="button"
              onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-main text-on-accent text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer hover:opacity-90"
            >
              <span>{selectedCategory.icon}</span>
              <span>{selectedCategory.name}</span>
            </button>

            {/* Merchant / Description Input */}
            <div className="relative inline-flex items-center">
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Note / Merchant (e.g. burger king)"
                className="px-3 py-1 rounded-full bg-sunken border border-border-input text-main text-xs font-medium placeholder:text-faint focus:outline-hidden focus:border-accent w-48 text-center"
              />
            </div>
          </div>

          {/* Inline Category Popover */}
          {isCategoryPickerOpen && (
            <div className="pt-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-2 rounded-2xl bg-surface border border-subtle shadow-md">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsCategoryPickerOpen(false);
                    playPopSound();
                  }}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-left text-xs transition cursor-pointer ${
                    selectedCategory.id === cat.id
                      ? 'bg-accent-soft text-accent-text font-bold border border-accent/20'
                      : 'hover:bg-sunken text-main'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Minimalist Keypad (Screen 3: 1 2 3, 4 5 6, 7 8 9, . 0 ✓) */}
        <div className="p-4 sm:p-5 grid grid-cols-3 gap-2 sm:gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 sm:h-14 rounded-2xl bg-sunken/80 hover:bg-sunken text-main text-lg sm:text-xl font-bold font-mono shadow-2xs border border-subtle active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          {/* Row 4: . 0 ✓/⌫ */}
          <button
            type="button"
            onClick={handleDot}
            className="h-12 sm:h-14 rounded-2xl bg-sunken/80 hover:bg-sunken text-main text-lg sm:text-xl font-black font-mono shadow-2xs border border-subtle active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            .
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 sm:h-14 rounded-2xl bg-sunken/80 hover:bg-sunken text-main text-lg sm:text-xl font-bold font-mono shadow-2xs border border-subtle active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="h-12 sm:h-14 rounded-2xl bg-accent hover:bg-accent-hover text-on-accent text-lg font-black shadow-soft border border-accent/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title="Save transaction"
          >
            <Check size={22} className="stroke-[3]" />
          </button>
        </div>

        {/* Bottom Backspace & Quick Action bar */}
        <div className="px-5 pb-4 flex items-center justify-between text-xs text-muted">
          <button
            type="button"
            onClick={handleBackspace}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-sunken text-muted hover:text-main cursor-pointer transition active:scale-95"
          >
            <Delete size={15} />
            <span>Backspace</span>
          </button>

          <div className="text-[11px] text-faint">
            Tap ✓ or press Enter to save
          </div>
        </div>

      </div>
    </div>
  );
};
