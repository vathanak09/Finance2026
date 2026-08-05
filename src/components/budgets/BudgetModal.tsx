import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import type { Currency } from '../../types/finance';
import { X, Calendar, ChevronDown, Check } from 'lucide-react';
import { CustomCalendarPicker } from '../common/CustomCalendarPicker';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose }) => {
  const { categories, addBudget, updateBudget, editingBudget, setEditingBudget } = useFinance();
  
  const [name, setName] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [limitAmount, setLimitAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('KHR');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  
  // Date picker toggle state
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  // Filter only expense categories
  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (editingBudget) {
      setName(editingBudget.name || '');
      setSelectedCategoryIds(
        editingBudget.categoryIds || (editingBudget.categoryId ? [editingBudget.categoryId] : [])
      );
      setLimitAmount(editingBudget.limitAmount ? editingBudget.limitAmount.toString() : '');
      setCurrency(editingBudget.currency || 'KHR');
      setStartDate(editingBudget.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(editingBudget.endDate || new Date().toISOString().split('T')[0]);
      setDescription(editingBudget.description || '');
      setActiveDatePicker(null);
      setIsCatDropdownOpen(false);
    } else {
      setName('');
      setSelectedCategoryIds([]);
      setLimitAmount('');
      setCurrency('KHR');
      const start = new Date().toISOString().split('T')[0];
      const endD = new Date();
      endD.setMonth(endD.getMonth() + 1);
      setStartDate(start);
      setEndDate(endD.toISOString().split('T')[0]);
      setDescription('');
      setActiveDatePicker(null);
      setIsCatDropdownOpen(false);
    }
  }, [editingBudget, isOpen]);

  // Click outside listener for category dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    };
    if (isCatDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCatDropdownOpen]);

  const activeOpen = isOpen || Boolean(editingBudget);
  if (!activeOpen) return null;

  const handleClose = () => {
    if (editingBudget) setEditingBudget(null);
    setActiveDatePicker(null);
    setIsCatDropdownOpen(false);
    onClose();
  };

  const toggleCategory = (catId: string) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  const handleSelectAllCategories = () => {
    if (selectedCategoryIds.length === expenseCategories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(expenseCategories.map(c => c.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('សូមបញ្ចូលឈ្មោះកញ្ចប់ថវិកា!');
    if (!limitAmount || parseFloat(limitAmount) <= 0) return alert('សូមបញ្ចូលថវិកាអតិបរមាឲ្យបានត្រឹមត្រូវ!');

    const payload = {
      name: name.trim(),
      categoryId: selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : 'all',
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : ['all'],
      limitAmount: parseFloat(limitAmount),
      currency,
      startDate,
      endDate: endDate || startDate,
      description: description.trim()
    };

    if (editingBudget) {
      await updateBudget(editingBudget.id, payload);
      setEditingBudget(null);
    } else {
      await addBudget(payload);
    }

    handleClose();
  };

  // Format date display for button
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`; // MM/DD/YYYY format like mockup (07/31/2026)
    }
    return dateStr;
  };

  // Category summary text for trigger button
  const getCategoryDisplayText = () => {
    if (selectedCategoryIds.length === 0 || selectedCategoryIds.includes('all')) {
      return 'សូមជ្រើសរើសប្រភេទ...';
    }
    if (selectedCategoryIds.length === expenseCategories.length) {
      return 'គ្រប់ប្រភេទទាំងអស់ (All Categories)';
    }
    const matchedNames = expenseCategories
      .filter(c => selectedCategoryIds.includes(c.id))
      .map(c => c.name);

    if (matchedNames.length <= 2) {
      return matchedNames.join(', ');
    }
    return `${matchedNames[0]}, ${matchedNames[1]} (+${matchedNames.length - 2})`;
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-100 dark:border-slate-800 relative z-[101] my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
            {editingBudget ? 'កែប្រែថវិកា' : 'កំណត់ថវិកាថ្មី'}
          </h3>
          <button 
            type="button"
            onClick={handleClose} 
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field 1: ឈ្មោះកញ្ចប់ថវិកា */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ឈ្មោះកញ្ចប់ថវិកា
            </label>
            <input
              type="text"
              required
              placeholder="ឧ. ថវិកាម្ហូបប្រចាំខែ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Field 2: សម្រាប់ប្រភេទចំណាយ (រើសបានច្រើន) */}
          <div className="relative" ref={catDropdownRef}>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              សម្រាប់ប្រភេទចំណាយ (រើសបានច្រើន)
            </label>
            <button
              type="button"
              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-left flex items-center justify-between transition-all cursor-pointer focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <span className={`truncate ${selectedCategoryIds.length === 0 ? 'text-slate-400' : 'text-slate-800 dark:text-slate-200 font-semibold'}`}>
                {getCategoryDisplayText()}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCatDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </button>

            {/* Multi-Select Category Dropdown Menu */}
            {isCatDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 max-h-52 overflow-y-auto space-y-1">
                <button
                  type="button"
                  onClick={handleSelectAllCategories}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span>ជ្រើសរើសទាំងអស់ (Select All)</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {selectedCategoryIds.length === expenseCategories.length ? 'ដោះចេញ' : 'ជ្រើសយក'}
                  </span>
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                {expenseCategories.map(c => {
                  const isChecked = selectedCategoryIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(c.id)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Field 3 & 4: ថវិកាអតិបរមា & រូបិយប័ណ្ណ */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ថវិកាអតិបរមា
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                រូបិយប័ណ្ណ
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="KHR">KHR (៛)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* Field 5 & 6: ថ្ងៃចាប់ផ្តើម & ថ្ងៃបញ្ចប់ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ថ្ងៃចាប់ផ្តើម
              </label>
              <button
                type="button"
                onClick={() => setActiveDatePicker(activeDatePicker === 'start' ? null : 'start')}
                className={`w-full px-3.5 py-3 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                  activeDatePicker === 'start'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-[#00a2e8] text-[#00a2e8]'
                    : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-mono">{formatDateDisplay(startDate)}</span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ថ្ងៃបញ្ចប់
              </label>
              <button
                type="button"
                onClick={() => setActiveDatePicker(activeDatePicker === 'end' ? null : 'end')}
                className={`w-full px-3.5 py-3 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                  activeDatePicker === 'end'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-[#00a2e8] text-[#00a2e8]'
                    : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-mono">{formatDateDisplay(endDate)}</span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Calendar Picker Dropdown */}
          {activeDatePicker === 'start' && (
            <div className="relative animate-in fade-in zoom-in-95 duration-150">
              <CustomCalendarPicker
                value={startDate}
                onChange={(newD) => {
                  setStartDate(newD);
                  setActiveDatePicker(null);
                }}
                className="shadow-xl"
              />
            </div>
          )}

          {activeDatePicker === 'end' && (
            <div className="relative animate-in fade-in zoom-in-95 duration-150">
              <CustomCalendarPicker
                value={endDate}
                onChange={(newD) => {
                  setEndDate(newD);
                  setActiveDatePicker(null);
                }}
                className="shadow-xl"
              />
            </div>
          )}

          {/* Field 7: ការពិពណ៌នា (មិនចាំបាច់ក៏បាន) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ការពិពណ៌នា <span className="text-slate-400 dark:text-slate-500 font-normal">(មិនចាំបាច់ក៏បាន)</span>
            </label>
            <input
              type="text"
              placeholder="ចំណាំបន្ថែម..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Action Buttons: បោះបង់ & រក្សាទុក */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#00a884] hover:bg-[#008f70] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              រក្សាទុក
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
