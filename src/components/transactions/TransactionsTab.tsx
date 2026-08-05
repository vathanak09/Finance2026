import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Search, Trash2, Edit2, ChevronDown, Download } from 'lucide-react';
import type { CurrencyMode, TimePreset } from '../../types/finance';
import * as XLSX from 'xlsx';
import { CategoryBadge } from '../../utils/categoryIcons';

export const TransactionsTab: React.FC = () => {
  const { transactions, categories, deleteTransaction, exchangeRate, currencyMode, setCurrencyMode, setEditingTransaction, setViewingTransaction } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Time preset state - DEFAULT IS THIS_MONTH (ខែនេះ គឺគោល)
  const [timePreset, setTimePreset] = useState<TimePreset | 'last_month' | 'all'>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories([]);
  };

  const now = new Date();
  const filterByDate = (dateStr: string) => {
    if (timePreset === 'all') return true;
    const tDate = new Date(dateStr);
    if (isNaN(tDate.getTime())) return true;

    if (timePreset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      return dateStr === todayStr;
    } else if (timePreset === 'this_month') {
      return tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth();
    } else if (timePreset === 'last_month') {
      const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return tDate.getFullYear() === lastM.getFullYear() && tDate.getMonth() === lastM.getMonth();
    } else if (timePreset === 'this_year') {
      return tDate.getFullYear() === now.getFullYear();
    } else if (timePreset === 'custom' && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59);
      return tDate >= start && tDate <= end;
    }
    return true;
  };

  const filtered = transactions.filter((t) => {
    if (!filterByDate(t.date)) return false;
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(t.categoryId)) return false;
    if (currencyMode === 'USD_ONLY' && t.currency !== 'USD') return false;
    if (currencyMode === 'KHR_ONLY' && t.currency !== 'KHR') return false;

    if (searchTerm) {
      const cat = categories.find(c => c.id === t.categoryId);
      const catName = cat ? cat.name.toLowerCase() : '';
      const desc = (t.description || '').toLowerCase();
      const query = searchTerm.toLowerCase();
      if (!catName.includes(query) && !desc.includes(query) && !t.amount.toString().includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Calculate totals for summary cards based on filtered list
  let totalFilteredIncUSD = 0;
  let totalFilteredExpUSD = 0;
  let totalFilteredIncKHR = 0;
  let totalFilteredExpKHR = 0;

  filtered.forEach(t => {
    if (t.currency === 'USD') {
      if (t.type === 'income') totalFilteredIncUSD += t.amount;
      else totalFilteredExpUSD += t.amount;
    } else {
      if (t.type === 'income') totalFilteredIncKHR += t.amount;
      else totalFilteredExpKHR += t.amount;
    }
  });

  const displayIncKHR = totalFilteredIncKHR + (totalFilteredIncUSD * exchangeRate);
  const displayExpKHR = totalFilteredExpKHR + (totalFilteredExpUSD * exchangeRate);
  const displayIncUSD = totalFilteredIncUSD + (totalFilteredIncKHR / exchangeRate);
  const displayExpUSD = totalFilteredExpUSD + (totalFilteredExpKHR / exchangeRate);

  const formatDateDayMonth = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}`;
    }
    return dateStr;
  };

  const sorted = [...filtered].sort((a, b) => {
    const timeA = a.createdAt || (a.time ? new Date(`${a.date}T${a.time}:00`).getTime() : new Date(a.date).getTime());
    const timeB = b.createdAt || (b.time ? new Date(`${b.date}T${b.time}:00`).getTime() : new Date(b.date).getTime());
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const handleExportExcel = () => {
    const dataToExport = sorted.map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      return {
        'កាលបរិច្ឆេទ': t.date,
        'ម៉ោង': t.time || '',
        'ប្រភេទ': cat ? cat.name : 'ផ្សេងៗ',
        'ប្រភេទលំហូរ': t.type === 'income' ? 'ចំណូល' : 'ចំណាយ',
        'ចំនួនទឹកប្រាក់': t.amount,
        'រូបិយប័ណ្ណ': t.currency,
        'ការពិពណ៌នា': t.description || ''
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `Transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Filter Bar: Wrap allowed for menu buttons on mobile */}
      <div className="glass-panel p-2.5 px-4 rounded-2xl shadow-sm relative z-30">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-shrink-0 w-44 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរក..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>

          {/* Time Filter Preset */}
          <select
            value={timePreset}
            onChange={(e) => setTimePreset(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <option value="this_month">ខែនេះ</option>
            <option value="last_month">ខែមុន</option>
            <option value="this_year">ឆ្នាំនេះ</option>
            <option value="all">ទាំងអស់</option>
            <option value="custom">កំណត់ថ្ងៃ</option>
          </select>

          {/* Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <option value="all">ទាំងអស់</option>
            <option value="income">ចំណូល</option>
            <option value="expense">ចំណាយ</option>
          </select>

          {/* Multi-Select Category Dropdown */}
          <div className="relative z-40 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
              className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>
                {selectedCategories.length === 0
                  ? 'គ្រប់ប្រភេទ'
                  : `ប្រភេទ (${selectedCategories.length})`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCatDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsCatDropdownOpen(false)} 
                />
                <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-3 space-y-2 animate-scale-in">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ជ្រើសរើសប្រភេទ (Check)</span>
                    <button
                      type="button"
                      onClick={selectAllCategories}
                      className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      ជ្រើសរើសទាំងអស់
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {categories.map(c => {
                      const isChecked = selectedCategories.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCategory(c.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sort Order Selector */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <option value="newest">ថ្មីមុន</option>
            <option value="oldest">ចាស់មុន</option>
          </select>

          {/* Excel Export Icon Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="p-1.5 px-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors flex-shrink-0 cursor-pointer"
            title="ទាញយកជា Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>

        {/* Custom Date Inputs if custom selected */}
        {timePreset === 'custom' && (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-semibold">ចាប់ពីថ្ងៃ៖</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-xs dark:text-white outline-none"
            />
            <span className="text-xs text-slate-500 font-semibold">ដល់៖</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-xs dark:text-white outline-none"
            />
          </div>
        )}
      </div>

      {/* Row 2: Currency Selector (left) & Summary Cards (right) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Currency selector */}
        <div className="flex items-center space-x-2 bg-slate-50/90 dark:bg-slate-900/90 p-2 px-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">ទិន្នន័យ៖</span>
          <select
            value={currencyMode}
            onChange={(e) => setCurrencyMode(e.target.value as CurrencyMode)}
            className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 outline-none cursor-pointer hover:bg-emerald-100/60 transition-colors"
          >
            <option value="MERGED_KHR">បញ្ចូលគ្នារក KHR (៛)</option>
            <option value="MERGED_USD">បញ្ចូលគ្នារក USD ($)</option>
            <option value="USD_ONLY">USD តែប៉ុណ្ណោះ</option>
            <option value="KHR_ONLY">KHR តែប៉ុណ្ណោះ</option>
          </select>
        </div>

        {/* Right: Summary cards */}
        <div className="flex items-center space-x-3">
          {/* Income card */}
          <div className="p-3 px-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 shadow-sm text-right min-w-[140px]">
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 block mb-0.5">ចំណូល</span>
            <h3 className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {currencyMode === 'MERGED_USD' || currencyMode === 'USD_ONLY'
                ? `$${displayIncUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${Math.round(displayIncKHR).toLocaleString()} ៛`
              }
            </h3>
          </div>

          {/* Expense card */}
          <div className="p-3 px-6 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 shadow-sm text-right min-w-[140px]">
            <span className="text-xs font-extrabold text-rose-700 dark:text-rose-400 block mb-0.5">ចំណាយ</span>
            <h3 className="text-lg md:text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {currencyMode === 'MERGED_USD' || currencyMode === 'USD_ONLY'
                ? `$${displayExpUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${Math.round(displayExpKHR).toLocaleString()} ៛`
              }
            </h3>
          </div>
        </div>
      </div>

      {/* Transactions List Table matching screenshot layout */}
      <div className="glass-panel rounded-2xl md:rounded-3xl shadow-sm overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-xs font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 px-4">កាលបរិច្ឆេទ</th>
                <th className="p-3 px-4">ចំនួនទឹកប្រាក់</th>
                <th className="p-3 px-4">ប្រភេទ</th>
                <th className="p-3 px-4">ការពិពណ៌នា</th>
                <th className="p-3 px-4 text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium text-xs">
                    មិនមានទិន្នន័យប្រតិបត្តិការឡើយ! (No transactions found)
                  </td>
                </tr>
              ) : (
                sorted.map((t) => {
                  const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ', color: 'from-blue-400 to-blue-600', icon: 'tag' };
                  const isInc = t.type === 'income';

                  // Original entered currency displayed in table rows
                  const displayAmountStr = t.currency === 'USD'
                    ? `$${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `${t.amount.toLocaleString()} ៛`;

                  const formattedDate = formatDateDayMonth(t.date);

                  return (
                    <tr 
                      key={t.id} 
                      onClick={() => setViewingTransaction(t)}
                      className={`transition-colors text-xs cursor-pointer ${
                        isInc 
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/70 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/40' 
                          : 'bg-rose-50/20 hover:bg-rose-50/70 dark:bg-rose-950/10 dark:hover:bg-rose-950/40'
                      }`}
                      title="ចុចដើម្បីមើលព័ត៌មានលម្អិត"
                    >
                      {/* Date Column: DD.MM only, single line unwrap */}
                      <td className="p-3 px-4 font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Amount Column: Original entered currency, single line unwrap */}
                      <td className={`p-3 px-4 font-black whitespace-nowrap ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isInc ? '+' : '-'}{displayAmountStr}
                      </td>

                      {/* Category Column: Shorter width, normal font & smaller text on mobile */}
                      <td className="p-2 sm:p-3 px-2 sm:px-4">
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <CategoryBadge color={cat.color} icon={cat.icon} size="xs" />
                          <span className="font-normal text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 line-clamp-2 max-w-[75px] sm:max-w-[140px] leading-tight">
                            {cat.name}
                          </span>
                        </div>
                      </td>

                      {/* Description Column: max 2 lines */}
                      <td className="p-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        <p className="line-clamp-2 max-w-[220px] leading-tight">
                          {t.description || '-'}
                        </p>
                      </td>

                      {/* Actions Column: single line unwrap */}
                      <td className="p-3 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingTransaction(t)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer active:scale-95"
                            title="កែប្រែ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('តើអ្នកចង់លុបប្រតិបត្តិការនេះមែនទេ?')) deleteTransaction(t.id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-100/60 dark:bg-rose-900/40 text-rose-500 hover:text-rose-600 transition-all cursor-pointer active:scale-95"
                            title="លុប"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
