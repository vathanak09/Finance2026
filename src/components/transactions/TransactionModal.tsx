import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import type { Currency, TransactionType } from '../../types/finance';
import { X, Calendar, Clock, ChevronDown, Check } from 'lucide-react';
import { CustomCalendarPicker } from '../common/CustomCalendarPicker';
import { CustomClockTimePicker } from '../common/CustomClockTimePicker';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getCurrentTimeString = (): string => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatTime12 = (timeStr?: string) => {
  const raw = timeStr || '12:00';
  const parts = raw.split(':');
  if (parts.length < 2) return '12:00 PM';
  let h = parseInt(parts[0], 10);
  const m = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
  if (isNaN(h)) return '12:00 PM';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${period}`;
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10) - 1;
    const d = parts[2];
    return `${d} ${months[m] || ''} ${y}`;
  }
  return dateStr;
};

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose }) => {
  const { categories, addTransaction, updateTransaction, editingTransaction, setEditingTransaction } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('KHR');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [description, setDescription] = useState<string>('');
  
  // Active picker mode: null, 'date', or 'time'
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);

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
    } else {
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(getCurrentTimeString());
      setActivePicker(null);
    }
  }, [editingTransaction, isOpen]);

  const activeOpen = isOpen || Boolean(editingTransaction);
  if (!activeOpen) return null;

  const handleClose = () => {
    if (editingTransaction) setEditingTransaction(null);
    setActivePicker(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return alert('សូមបញ្ចូលចំនួនទឹកប្រាក់ឲ្យបានត្រឹមត្រូវ!');
    
    const cat = categoryId || (categories.find(c => c.type === type)?.id || categories[0].id);
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
    setActivePicker(null);
    onClose();
  };

  const availableCategories = categories.filter(c => c.type === type);

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
              onClick={() => setType('expense')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                type === 'expense' ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              ចំណាយ
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
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

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">ប្រភេទចំណាត់ថ្នាក់</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              <option value="">ជ្រើសរើសប្រភេទ...</option>
              {availableCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
                onClick={() => setActivePicker(activePicker === 'date' ? null : 'date')}
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
                onClick={() => setActivePicker(activePicker === 'time' ? null : 'time')}
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
