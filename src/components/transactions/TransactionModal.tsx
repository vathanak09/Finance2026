import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import type { Currency, TransactionType } from '../../types/finance';
import { X, Calendar, Clock, ChevronDown, Check } from 'lucide-react';
import { CustomCalendarPicker } from '../common/CustomCalendarPicker';
import { CustomClockTimePicker } from '../common/CustomClockTimePicker';
import { getLocalDateString, getLocalTimeString, formatDateDisplay, formatTime12, parseLocalDate } from '../../utils/dateUtils';
import { CategoryBadge } from '../../utils/categoryIcons';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose }) => {
  const { categories, transactions, addTransaction, updateTransaction, editingTransaction, setEditingTransaction } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('KHR');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(getLocalDateString());
  const [time, setTime] = useState<string>(getLocalTimeString());
  const [description, setDescription] = useState<string>('');
  
  // Active picker mode: null, 'date', or 'time'
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    };
    if (isCatDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCatDropdownOpen]);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCurrency(editingTransaction.currency);
      setCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
      // Keep existing time or fallback to 12:00 PM
      setTime(editingTransaction.time || '12:00');
      setDescription(editingTransaction.description || '');
      setActivePicker(null);
      setIsCatDropdownOpen(false);
    } else if (isOpen) {
      setAmount('');
      setDescription('');
      setCategoryId('');
      setDate(getLocalDateString());
      setTime(getLocalTimeString());
      setActivePicker(null);
      setIsCatDropdownOpen(false);
    }
  }, [editingTransaction, isOpen]);

  // Sort categories by most frequently used recently down to least used
  const availableCategories = useMemo(() => {
    const now = Date.now();
    const HALF_LIFE_DAYS = 30;
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const stats = new Map<string, { score: number; count: number; latestTime: number }>();

    transactions.forEach((t) => {
      if (t.type !== type) return;
      const txTime = t.createdAt || parseLocalDate(t.date).getTime() || 0;
      const daysAgo = Math.max(0, (now - txTime) / MS_PER_DAY);
      const weight = Math.pow(0.5, daysAgo / HALF_LIFE_DAYS);

      const prev = stats.get(t.categoryId) || { score: 0, count: 0, latestTime: 0 };
      stats.set(t.categoryId, {
        score: prev.score + weight,
        count: prev.count + 1,
        latestTime: Math.max(prev.latestTime, txTime),
      });
    });

    return categories
      .filter((c) => c.type === type)
      .sort((a, b) => {
        const statA = stats.get(a.id) || { score: 0, count: 0, latestTime: 0 };
        const statB = stats.get(b.id) || { score: 0, count: 0, latestTime: 0 };

        if (Math.abs(statB.score - statA.score) > 1e-6) {
          return statB.score - statA.score;
        }
        if (statB.count !== statA.count) {
          return statB.count - statA.count;
        }
        if (statB.latestTime !== statA.latestTime) {
          return statB.latestTime - statA.latestTime;
        }
        return 0;
      });
  }, [categories, transactions, type]);

  const selectedCategory = useMemo(
    () => availableCategories.find((c) => c.id === categoryId) || categories.find((c) => c.id === categoryId),
    [availableCategories, categories, categoryId]
  );

  const activeOpen = isOpen || Boolean(editingTransaction);
  if (!activeOpen) return null;

  const handleClose = () => {
    if (editingTransaction) setEditingTransaction(null);
    setActivePicker(null);
    setIsCatDropdownOpen(false);
    onClose();
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setIsCatDropdownOpen(false);
    if (categoryId) {
      const currentCat = categories.find((c) => c.id === categoryId);
      if (currentCat && currentCat.type !== newType) {
        setCategoryId('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return alert('សូមបញ្ចូលចំនួនទឹកប្រាក់ឲ្យបានត្រឹមត្រូវ!');
    
    const cat = categoryId || (availableCategories[0]?.id || categories[0].id);
    const selectedTime = time.trim() || '12:00';

    // Compute timestamp accurately for sorting
    const computedDateTimeStr = `${date}T${selectedTime}:00`;
    const computedTimestamp = new Date(computedDateTimeStr).getTime() || Date.now();

    const payload = {
      amount: parseFloat(amount),
      currency,
      type,
      categoryId: cat,
      date,
      time: selectedTime,
      createdAt: computedTimestamp,
      description
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, payload);
      setEditingTransaction(null);
    } else {
      await addTransaction(payload);
    }

    setAmount('');
    setDescription('');
    setCategoryId('');
    setActivePicker(null);
    setIsCatDropdownOpen(false);
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl relative z-[101] my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
            {editingTransaction ? 'កែប្រែប្រតិបត្តិការ' : 'បន្ថែមប្រតិបត្តិការ'}
          </h3>
          <button onClick={handleClose} className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                type === 'expense' ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              ចំណាយ
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                type === 'income' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              ចំណូល
            </button>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">ចំនួនទឹកប្រាក់ *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">រូបិយប័ណ្ណ</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-blue-600 dark:text-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="USD">USD</option>
                <option value="KHR">KHR</option>
              </select>
            </div>
          </div>

          {/* Category (Custom App Dropdown UI, sorted by recent usage frequency) */}
          <div className="relative" ref={catDropdownRef}>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">ប្រភេទចំណាត់ថ្នាក់</label>
            <button
              type="button"
              onClick={() => {
                setActivePicker(null);
                setIsCatDropdownOpen((prev) => !prev);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                isCatDropdownOpen
                  ? 'bg-white dark:bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                {selectedCategory ? (
                  <>
                    <CategoryBadge color={selectedCategory.color} icon={selectedCategory.icon} size="xs" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {selectedCategory.name}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-400">
                    ជ្រើសរើសប្រភេទ...
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isCatDropdownOpen ? 'rotate-180 text-blue-500' : ''}`} />
            </button>

            {isCatDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-1.5 max-h-52 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {availableCategories.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    មិនមានប្រភេទចំណាត់ថ្នាក់ទេ
                  </div>
                ) : (
                  availableCategories.map((c) => {
                    const isSelected = categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(c.id);
                          setIsCatDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <CategoryBadge color={c.color} icon={c.icon} size="sm" />
                          <span className="text-sm font-semibold truncate">{c.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Date and Time Selector Bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              កាលបរិច្ឆេទ & ពេលវេលា (Date & Time)
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Date Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCatDropdownOpen(false);
                  setActivePicker(activePicker === 'date' ? null : 'date');
                }}
                className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  activePicker === 'date'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-[#00a2e8] text-[#00a2e8] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-xl ${activePicker === 'date' ? 'bg-[#00a2e8] text-white' : 'bg-sky-100 dark:bg-sky-950/80 text-[#00a2e8]'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] text-slate-400 font-medium">កាលបរិច្ឆេទ</span>
                    <span className="text-xs font-bold font-mono">{formatDateDisplay(date)}</span>
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activePicker === 'date' ? 'rotate-180 text-[#00a2e8]' : ''}`} />
              </button>

              {/* Time Button */}
              <button
                type="button"
                onClick={() => {
                  setIsCatDropdownOpen(false);
                  setActivePicker(activePicker === 'time' ? null : 'time');
                }}
                className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  activePicker === 'time'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-[#5b45a0] dark:border-indigo-500 text-[#5b45a0] dark:text-indigo-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-xl ${activePicker === 'time' ? 'bg-[#5b45a0] text-white' : 'bg-indigo-100 dark:bg-indigo-950/80 text-[#5b45a0] dark:text-indigo-400'}`}>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] text-slate-400 font-medium">ម៉ោង</span>
                    <span className="text-xs font-bold font-mono">{formatTime12(time)}</span>
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activePicker === 'time' ? 'rotate-180 text-[#5b45a0]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Interactive Picker Dropdown Container */}
          {activePicker === 'date' && (
            <div className="relative animate-in fade-in zoom-in-95 duration-150">
              <CustomCalendarPicker
                value={date}
                onChange={(newDate) => setDate(newDate)}
                className="shadow-xl"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setActivePicker(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>យល់ព្រម</span>
                </button>
              </div>
            </div>
          )}

          {activePicker === 'time' && (
            <div className="relative animate-in fade-in zoom-in-95 duration-150">
              <CustomClockTimePicker
                value={time}
                onChange={(newTime) => setTime(newTime)}
                className="shadow-xl"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setActivePicker(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#5b45a0] hover:bg-[#4d388c] text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>យល់ព្រម</span>
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">ការពិពណ៌នា (មិនចាំបាច់)</label>
            <input
              type="text"
              placeholder="សម្គាល់បន្ថែម..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/30 transition-all cursor-pointer mt-2"
          >
            {editingTransaction ? 'បច្ចុប្បន្នភាព' : 'រក្សាទុក'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
