import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Search, ChevronDown, X } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CategoryBadge } from '../../utils/categoryIcons';
import { parseLocalDate } from '../../utils/dateUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

export const ReportsTab: React.FC = () => {
  const { transactions, categories, exchangeRate, setViewingTransaction, currencyMode, setCurrencyMode } = useFinance();
  const [dateRangePreset, setDateRangePreset] = useState<'today' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const formatDateDayMonth = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };
  const [flowTypeFilter, setFlowTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  // New filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  const [selectedCategoryForDetails, setSelectedCategoryForDetails] = useState<{ id: string, name: string, type: 'income' | 'expense' } | null>(null);

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories([]);
  };
  // currencyMode

  // Filter transactions based on date and type
  const filteredTxs = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date(2100, 0, 1);

    if (dateRangePreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (dateRangePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (dateRangePreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (dateRangePreset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (dateRangePreset === 'custom' && startDate && endDate) {
      start = parseLocalDate(startDate);
      end = parseLocalDate(endDate);
      end.setHours(23, 59, 59);
    }

    const filtered = transactions.filter((t) => {
      const tDate = parseLocalDate(t.date);
      if (tDate < start || tDate > end) return false;
      if (flowTypeFilter !== 'all' && t.type !== flowTypeFilter) return false;
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

    return filtered.sort((a, b) => {
      const timeA = a.createdAt || (a.time ? new Date(`${a.date}T${a.time}:00`).getTime() : new Date(a.date).getTime());
      const timeB = b.createdAt || (b.time ? new Date(`${b.date}T${b.time}:00`).getTime() : new Date(b.date).getTime());
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [transactions, dateRangePreset, startDate, endDate, flowTypeFilter, selectedCategories, searchTerm, sortOrder, categories, currencyMode]);

  // Totals calculation
  let totalIncUSD = 0, totalExpUSD = 0, totalIncKHR = 0, totalExpKHR = 0;
  filteredTxs.forEach(t => {
    if (t.currency === 'USD') {
      if (t.type === 'income') totalIncUSD += t.amount; else totalExpUSD += t.amount;
    } else {
      if (t.type === 'income') totalIncKHR += t.amount; else totalExpKHR += t.amount;
    }
  });

  const displayIncKHR = totalIncKHR + (totalIncUSD * exchangeRate);
  const displayExpKHR = totalExpKHR + (totalExpUSD * exchangeRate);
  const displayIncUSD = totalIncUSD + (totalIncKHR / exchangeRate);
  const displayExpUSD = totalExpUSD + (totalExpKHR / exchangeRate);

  // Category breakdown chart data
  const categoryTotals: Record<string, { id: string; name: string; color: string; icon?: string; amountUSD: number; type: 'income' | 'expense' }> = {};
  filteredTxs.forEach(t => {
    const amtUSD = t.currency === 'USD' ? t.amount : t.amount / exchangeRate;
    const key = `${t.type}-${t.categoryId}`;
    if (!categoryTotals[key]) {
      const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ', color: '#94a3b8', icon: 'tag' };
      categoryTotals[key] = { id: t.categoryId, name: cat.name, color: cat.color || '#94a3b8', icon: cat.icon, amountUSD: 0, type: t.type };
    }
    categoryTotals[key].amountUSD += amtUSD;
  });

  const incomeCategories = Object.values(categoryTotals).filter(c => c.type === 'income').sort((a, b) => b.amountUSD - a.amountUSD);
  const expenseCategories = Object.values(categoryTotals).filter(c => c.type === 'expense').sort((a, b) => b.amountUSD - a.amountUSD);

  const getHexFromTailwindClass = (colorClass: string) => {
    if (colorClass.includes('emerald')) return '#10b981';
    if (colorClass.includes('blue')) return '#3b82f6';
    if (colorClass.includes('teal')) return '#14b8a6';
    if (colorClass.includes('purple')) return '#8b5cf6';
    if (colorClass.includes('pink')) return '#ec4899';
    if (colorClass.includes('rose')) return '#f43f5e';
    if (colorClass.includes('amber')) return '#f59e0b';
    if (colorClass.includes('red')) return '#ef4444';
    if (colorClass.includes('orange')) return '#f97316';
    if (colorClass.includes('yellow')) return '#eab308';
    if (colorClass.includes('green')) return '#22c55e';
    if (colorClass.includes('cyan')) return '#06b6d4';
    if (colorClass.includes('indigo')) return '#6366f1';
    if (colorClass.includes('fuchsia')) return '#d946ef';
    return colorClass.startsWith('#') ? colorClass : '#94a3b8'; // fallback to slate-400
  };

  const incomeDoughnutData = {
    labels: incomeCategories.map(c => c.name),
    datasets: [
      {
        data: incomeCategories.map(c => c.amountUSD),
        backgroundColor: incomeCategories.map(c => getHexFromTailwindClass(c.color)),
        borderWidth: 0,
      },
    ],
  };

  const expenseDoughnutData = {
    labels: expenseCategories.map(c => c.name),
    datasets: [
      {
        data: expenseCategories.map(c => c.amountUSD),
        backgroundColor: expenseCategories.map(c => getHexFromTailwindClass(c.color)),
        borderWidth: 0,
      },
    ],
  };



  return (
    <div className="space-y-4 animate-fade-in">
      {/* Control Bar (Hidden when printing) */}
      <div className="print:hidden glass-panel p-2.5 px-4 rounded-2xl shadow-sm relative z-30">
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
            value={dateRangePreset}
            onChange={(e) => setDateRangePreset(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            <option value="today">ថ្ងៃនេះ</option>
            <option value="this_month">ខែនេះ</option>
            <option value="last_month">ខែមុន</option>
            <option value="this_year">ឆ្នាំនេះ</option>
            <option value="all">ទាំងអស់</option>
            <option value="custom">កំណត់ថ្ងៃ</option>
          </select>

          {/* Type Selector */}
          <select
            value={flowTypeFilter}
            onChange={(e) => setFlowTypeFilter(e.target.value as any)}
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
        </div>

        {dateRangePreset === 'custom' && (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-semibold">ចាប់ពីថ្ងៃ៖</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs dark:text-white outline-none"
            />
            <span className="text-xs text-slate-500 font-semibold">ដល់៖</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs dark:text-white outline-none"
            />
          </div>
        )}
      </div>

      {/* Row 2: Currency Selector & Summary Cards */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Currency selector */}
          <div className="flex items-center space-x-2 bg-slate-50/90 dark:bg-slate-900/90 p-2 px-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">ទិន្នន័យ៖</span>
            <select
              value={currencyMode}
              onChange={(e) => setCurrencyMode(e.target.value as any)}
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

        {/* Category Breakdown Chart & Legend */}
        {(incomeCategories.length > 0 || expenseCategories.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start bg-slate-100 dark:bg-slate-900/60 p-3 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            {expenseCategories.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-rose-500 dark:text-rose-400 uppercase tracking-wider text-center">ចំណាយ (Expenses)</h4>
                <div className="w-48 h-48 mx-auto">
                  <Doughnut data={expenseDoughnutData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: true, animation: false }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {expenseCategories.map((cat, idx) => (
                    <div 
                      key={`exp-${idx}`} 
                      onClick={() => setSelectedCategoryForDetails({ id: cat.id, name: cat.name, type: 'expense' })}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <CategoryBadge color={cat.color} icon={cat.icon} size="xs" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{cat.name}</span>
                      </div>
                      <span className="font-bold text-rose-500 dark:text-rose-400 whitespace-nowrap">{(cat.amountUSD * exchangeRate).toLocaleString()} ៛</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {incomeCategories.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-blue-500 dark:text-blue-400 uppercase tracking-wider text-center">ចំណូល (Income)</h4>
                <div className="w-48 h-48 mx-auto">
                  <Doughnut data={incomeDoughnutData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: true, animation: false }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {incomeCategories.map((cat, idx) => (
                    <div 
                      key={`inc-${idx}`} 
                      onClick={() => setSelectedCategoryForDetails({ id: cat.id, name: cat.name, type: 'income' })}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <CategoryBadge color={cat.color} icon={cat.icon} size="xs" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{cat.name}</span>
                      </div>
                      <span className="font-bold text-blue-500 dark:text-blue-400 whitespace-nowrap">{(cat.amountUSD * exchangeRate).toLocaleString()} ៛</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {/* Detailed Transactions Table - Displaying like TransactionsTab */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-slate-500 dark:text-slate-300 uppercase tracking-wider">បញ្ជីប្រតិបត្តិការលម្អិត</h4>
          <div className="glass-panel rounded-2xl md:rounded-3xl shadow-sm overflow-hidden border border-slate-200/80 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-xs font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2 sm:p-3 px-2 sm:px-4">កាលបរិច្ឆេទ</th>
                    <th className="p-2 sm:p-3 px-2 sm:px-4">ចំនួនទឹកប្រាក់</th>
                    <th className="p-2 sm:p-3 px-2 sm:px-4">ប្រភេទ</th>
                    <th className="p-2 sm:p-3 px-2 sm:px-4">ការពិពណ៌នា</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 font-medium text-xs">
                        មិនមានទិន្នន័យប្រតិបត្តិការឡើយ! (No transactions found)
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((t) => {
                      const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ', color: 'from-blue-400 to-blue-600', icon: 'tag' };
                      const isInc = t.type === 'income';
                      const formattedDate = formatDateDayMonth(t.date);
                      const displayAmountStr = t.currency === 'USD'
                        ? `$${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${t.amount.toLocaleString()} ៛`;

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
                          <td className="p-2 sm:p-3 px-2 sm:px-4 font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className={`p-2 sm:p-3 px-2 sm:px-4 font-black whitespace-nowrap ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isInc ? '+' : '-'}{displayAmountStr}
                          </td>
                          <td className="p-2 sm:p-3 px-2 sm:px-4">
                            <div className="flex items-center space-x-1.5 sm:space-x-2">
                              <CategoryBadge color={cat.color} icon={cat.icon} size="xs" />
                              <span className="font-normal text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 line-clamp-2 max-w-[75px] sm:max-w-[140px] leading-tight">
                                {cat.name}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 px-2 sm:px-4 text-xs text-slate-600 dark:text-slate-300">
                            <p className="line-clamp-2 max-w-[220px] leading-tight">
                              {t.description || '-'}
                            </p>
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
      
      {/* Category Details Modal */}
      {selectedCategoryForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedCategoryForDetails(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg">
                ប្រតិបត្តិការ៖ <span className={selectedCategoryForDetails.type === 'income' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}>{selectedCategoryForDetails.name}</span>
              </h3>
              <button 
                onClick={() => setSelectedCategoryForDetails(null)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 sm:p-5">
              <div className="glass-panel rounded-2xl shadow-sm overflow-hidden border border-slate-200/80 dark:border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-xs font-black tracking-wider border-b border-slate-200 dark:border-slate-800">
                        <th className="p-2 sm:p-3 px-2 sm:px-4">កាលបរិច្ឆេទ</th>
                        <th className="p-2 sm:p-3 px-2 sm:px-4">ចំនួនទឹកប្រាក់</th>
                        <th className="p-2 sm:p-3 px-2 sm:px-4">ប្រភេទ</th>
                        <th className="p-2 sm:p-3 px-2 sm:px-4">ការពិពណ៌នា</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredTxs.filter(t => t.categoryId === selectedCategoryForDetails.id && t.type === selectedCategoryForDetails.type).map((t) => {
                        const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ', color: 'from-blue-400 to-blue-600', icon: 'tag' };
                        const isInc = t.type === 'income';
                        const formattedDate = formatDateDayMonth(t.date);
                        const displayAmountStr = t.currency === 'USD'
                          ? `$${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${t.amount.toLocaleString()} ៛`;

                        return (
                          <tr 
                            key={t.id} 
                            onClick={() => {
                              setSelectedCategoryForDetails(null);
                              setViewingTransaction(t);
                            }}
                            className={`transition-colors text-xs cursor-pointer ${
                              isInc 
                                ? 'bg-emerald-50/20 hover:bg-emerald-50/70 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/40' 
                                : 'bg-rose-50/20 hover:bg-rose-50/70 dark:bg-rose-950/10 dark:hover:bg-rose-950/40'
                            }`}
                          >
                            <td className="p-2 sm:p-3 px-2 sm:px-4 font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className={`p-2 sm:p-3 px-2 sm:px-4 font-black whitespace-nowrap ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isInc ? '+' : '-'}{displayAmountStr}
                            </td>
                            <td className="p-2 sm:p-3 px-2 sm:px-4">
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <CategoryBadge color={cat.color} icon={cat.icon} size="xs" />
                                <span className="font-normal text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 line-clamp-2 max-w-[75px] sm:max-w-[140px] leading-tight">
                                  {cat.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-2 sm:p-3 px-2 sm:px-4 text-xs text-slate-600 dark:text-slate-300">
                              <p className="line-clamp-2 max-w-[220px] leading-tight">
                                {t.description || '-'}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
