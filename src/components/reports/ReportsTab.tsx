import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Printer, Filter } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CategoryBadge } from '../../utils/categoryIcons';
import { parseLocalDate } from '../../utils/dateUtils';

ChartJS.register(ArcElement, Tooltip, Legend);

export const ReportsTab: React.FC = () => {
  const { transactions, categories, exchangeRate, getDayOnly, setViewingTransaction } = useFinance();
  const [dateRangePreset, setDateRangePreset] = useState<'today' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom'>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [flowTypeFilter, setFlowTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
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

    return transactions.filter((t) => {
      const tDate = parseLocalDate(t.date);
      if (tDate < start || tDate > end) return false;
      if (flowTypeFilter !== 'all' && t.type !== flowTypeFilter) return false;
      return true;
    });
  }, [transactions, dateRangePreset, startDate, endDate, flowTypeFilter]);

  // Totals calculation
  let totalIncUSD = 0, totalExpUSD = 0, totalIncKHR = 0, totalExpKHR = 0;
  filteredTxs.forEach(t => {
    if (t.currency === 'USD') {
      if (t.type === 'income') totalIncUSD += t.amount; else totalExpUSD += t.amount;
    } else {
      if (t.type === 'income') totalIncKHR += t.amount; else totalExpKHR += t.amount;
    }
  });

  // Category breakdown chart data
  const categoryTotals: Record<string, { name: string; color: string; icon?: string; amountUSD: number }> = {};
  filteredTxs.forEach(t => {
    const amtUSD = t.currency === 'USD' ? t.amount : t.amount / exchangeRate;
    if (!categoryTotals[t.categoryId]) {
      const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ', color: '#94a3b8', icon: 'tag' };
      categoryTotals[t.categoryId] = { name: cat.name, color: cat.color || '#94a3b8', icon: cat.icon, amountUSD: 0 };
    }
    categoryTotals[t.categoryId].amountUSD += amtUSD;
  });

  const chartLabels = Object.values(categoryTotals).map(c => c.name);
  const chartDataValues = Object.values(categoryTotals).map(c => c.amountUSD);
  const chartColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

  const doughnutData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartDataValues,
        backgroundColor: chartColors.slice(0, chartLabels.length),
        borderWidth: 0,
      },
    ],
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Bar (Hidden when printing) */}
      <div className="print:hidden p-5 rounded-3xl glass-panel shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
            <Filter className="w-4 h-4 text-blue-500" />
            <span>តម្រងទិន្នន័យរបាយការណ៍ (Report Filters)</span>
          </h4>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>🖨️ បោះពុម្ព (Print Canvas)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">កាលបរិច្ឆេទ</label>
            <select
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="today">ថ្ងៃនេះ (Today)</option>
              <option value="this_month">ខែនេះ (This Month)</option>
              <option value="last_month">ខែមុន (Last Month)</option>
              <option value="this_year">ឆ្នាំនេះ (This Year)</option>
              <option value="all">ទាំងអស់ (All Time)</option>
              <option value="custom">កំណត់ថ្ងៃ (Custom Range)</option>
            </select>
          </div>

          {dateRangePreset === 'custom' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">ចាប់ពីថ្ងៃ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">ដល់ថ្ងៃ</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">ប្រភេទលំហូរ</label>
            <select
              value={flowTypeFilter}
              onChange={(e) => setFlowTypeFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">ទាំងអស់</option>
              <option value="income">ចំណូល (+)</option>
              <option value="expense">ចំណាយ (-)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Canva Printable Canvas */}
      <div id="report-canvas" className="p-6 md:p-8 rounded-3xl glass-panel shadow-2xl space-y-6">
        {/* Report Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">របាយការណ៍ហិរញ្ញវត្ថុផ្ទាល់ខ្លួន (Financial Report)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">សៀវភៅហិរញ្ញវត្ថុ • កាលបរិច្ឆេទ៖ {new Date().toLocaleDateString('km-KH')}</p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 font-bold text-xs rounded-full">
              Canva Print Ready
            </span>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-100 dark:bg-slate-900/80 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">ចំណូលសរុប (KHR)</span>
            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{totalIncKHR.toLocaleString()} ៛</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">ចំណាយសរុប (KHR)</span>
            <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{totalExpKHR.toLocaleString()} ៛</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">ចំណូលសរុប (USD)</span>
            <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">${totalIncUSD.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">ចំណាយសរុប (USD)</span>
            <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">${totalExpUSD.toLocaleString()}</p>
          </div>
        </div>

        {/* Category Breakdown Chart & Legend */}
        {chartDataValues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-100 dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-48 h-48 mx-auto">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: true, animation: false }} />
            </div>
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-xs text-slate-500 dark:text-slate-300 uppercase tracking-wider">ការបែងចែកតាមប្រភេទ (Category Breakdown)</h4>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {Object.values(categoryTotals).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <CategoryBadge color={cat.color} icon={cat.icon} size="xs" />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{cat.name}</span>
                    </div>
                    <span className="font-bold text-rose-500 dark:text-rose-400">{(cat.amountUSD * exchangeRate).toLocaleString()} ៛</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Transactions Table - Displaying DAY ONLY */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-slate-500 dark:text-slate-300 uppercase tracking-wider">បញ្ជីប្រតិបត្តិការលម្អិត</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 w-14 text-center">ថ្ងៃ</th>
                  <th className="p-3">ប្រភេទ (Tag)</th>
                  <th className="p-3">ការពិពណ៌នា</th>
                  <th className="p-3 text-right">ចំនួនទឹកប្រាក់</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500 dark:text-slate-400 font-medium">មិនមានប្រតិបត្តិការក្នុងកំឡុងពេលនេះឡើយ</td>
                  </tr>
                ) : (
                  filteredTxs.map((t) => {
                    const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ', color: '#94a3b8', icon: 'tag' };
                    const dayNum = getDayOnly(t.date);
                    const isInc = t.type === 'income';
                    return (
                      <tr 
                        key={t.id} 
                        onClick={() => setViewingTransaction(t)}
                        className="hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="ចុចដើម្បីមើលព័ត៌មានលម្អិត"
                      >
                        {/* DAY ONLY COLUMN */}
                        <td className="p-2.5 text-center font-extrabold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-lg">{dayNum}</td>
                        <td className="p-2.5">
                          <div className="flex items-center space-x-2">
                            <CategoryBadge color={cat.color} icon={cat.icon} size="xs" />
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{cat.name}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400">{t.description || '-'}</td>
                        <td className={`p-2.5 text-right font-bold ${isInc ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isInc ? '+' : '-'}{t.currency === 'USD' ? '$' : ''}{t.amount.toLocaleString()}{t.currency === 'KHR' ? ' ៛' : ''}
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
    </div>
  );
};
