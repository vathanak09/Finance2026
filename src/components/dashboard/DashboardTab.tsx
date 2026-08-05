import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, PolarArea, Bar, Line, Pie, Radar } from 'react-chartjs-2';
import type { TimePreset } from '../../types/finance';
import { CategoryBadge } from '../../utils/categoryIcons';
import { getLocalDateString, parseLocalDate, formatDateDisplay, formatTime12 } from '../../utils/dateUtils';

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement);

export const DashboardTab: React.FC = () => {
  const { transactions, categories, exchangeRate, setViewingTransaction } = useFinance();
  const [timePreset, setTimePreset] = useState<TimePreset>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Filtered transactions based on time preset
  const filteredTxs = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = parseLocalDate(t.date);
      if (isNaN(tDate.getTime())) return true;

      if (timePreset === 'today') {
        const todayStr = getLocalDateString(now);
        return t.date === todayStr;
      } else if (timePreset === 'last_month') {
        const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return tDate.getFullYear() === lastM.getFullYear() && tDate.getMonth() === lastM.getMonth();
      } else if (timePreset === 'this_month') {
        return tDate.getFullYear() === now.getFullYear() && tDate.getMonth() === now.getMonth();
      } else if (timePreset === 'this_year') {
        return tDate.getFullYear() === now.getFullYear();
      } else if (timePreset === 'custom' && customStart && customEnd) {
        return t.date >= customStart && t.date <= customEnd;
      }
      return true;
    });
  }, [transactions, timePreset, customStart, customEnd]);

  // Compute metrics in USD & KHR separately
  let incUSD = 0, expUSD = 0, incKHR = 0, expKHR = 0;
  filteredTxs.forEach(t => {
    if (t.currency === 'USD') {
      if (t.type === 'income') incUSD += t.amount; else expUSD += t.amount;
    } else {
      if (t.type === 'income') incKHR += t.amount; else expKHR += t.amount;
    }
  });

  const totalIncInUSD = incUSD + (incKHR / exchangeRate);
  const totalIncInKHR = incKHR + (incUSD * exchangeRate);

  const totalExpInUSD = expUSD + (expKHR / exchangeRate);
  const totalExpInKHR = expKHR + (expUSD * exchangeRate);

  const netBalanceUSD = totalIncInUSD - totalExpInUSD;
  const netBalanceKHR = totalIncInKHR - totalExpInKHR;

  // Compute category breakdown for expense charts
  const categoryExpenses: Record<string, { name: string; color: string; amountUSD: number }> = {};
  const categoryIncomes: Record<string, { name: string; color: string; amountUSD: number }> = {};
  
  filteredTxs.forEach(t => {
    const amtUSD = t.currency === 'USD' ? t.amount : t.amount / exchangeRate;
    const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ', color: '#94a3b8' };
    const color = cat.color?.includes('from-') ? cat.color.replace('from-', '').replace('to-', '').split('-')[0] : cat.color || '#94a3b8';
    
    // Map tailwind color names to hex roughly for charts if needed, or just use chartColors palette
    if (t.type === 'expense') {
      if (!categoryExpenses[t.categoryId]) categoryExpenses[t.categoryId] = { name: cat.name, color: color, amountUSD: 0 };
      categoryExpenses[t.categoryId].amountUSD += amtUSD;
    } else {
      if (!categoryIncomes[t.categoryId]) categoryIncomes[t.categoryId] = { name: cat.name, color: color, amountUSD: 0 };
      categoryIncomes[t.categoryId].amountUSD += amtUSD;
    }
  });

  const chartColors = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1', '#14b8a6', '#d946ef'];

  const expLabels = Object.values(categoryExpenses).map(c => c.name);
  const expValues = Object.values(categoryExpenses).map(c => c.amountUSD);
  
  const incLabels = Object.values(categoryIncomes).map(c => c.name);
  const incValues = Object.values(categoryIncomes).map(c => c.amountUSD);

  const expChartData = {
    labels: expLabels,
    datasets: [{
      data: expValues,
      backgroundColor: chartColors.slice(0, expLabels.length),
      borderWidth: 0,
    }],
  };

  const incChartData = {
    labels: incLabels,
    datasets: [{
      data: incValues,
      backgroundColor: chartColors.slice(0, incLabels.length).reverse(),
      borderWidth: 0,
    }],
  };

  // Bar Chart Data (Income vs Expense)
  const barChartData = {
    labels: ['ចំណូល', 'ចំណាយ'],
    datasets: [{
      data: [totalIncInUSD, totalExpInUSD],
      backgroundColor: ['#10b981', '#f43f5e'],
      borderRadius: 4,
    }]
  };

  // Line Chart Data (Trend by Day)
  const dailyData: Record<string, { inc: number; exp: number }> = {};
  filteredTxs.forEach(t => {
    // get DD.MM format
    const d = new Date(t.date);
    const dayStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    const amtUSD = t.currency === 'USD' ? t.amount : t.amount / exchangeRate;
    if (!dailyData[dayStr]) dailyData[dayStr] = { inc: 0, exp: 0 };
    if (t.type === 'income') dailyData[dayStr].inc += amtUSD;
    else dailyData[dayStr].exp += amtUSD;
  });

  const sortedDays = Object.keys(dailyData).sort((a, b) => {
    const [d1, m1] = a.split('.');
    const [d2, m2] = b.split('.');
    return (Number(m1) - Number(m2)) || (Number(d1) - Number(d2));
  });

  const lineChartData = {
    labels: sortedDays,
    datasets: [
      {
        label: 'ចំណូល',
        data: sortedDays.map(d => dailyData[d].inc),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: 'ចំណាយ',
        data: sortedDays.map(d => dailyData[d].exp),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
          borderDash: [5, 5],
        },
        border: { display: false }
      },
      x: {
        grid: { display: false },
        border: { display: false }
      }
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* 2.2. Time Preset Filter Bar */}
      <div className="glass-panel p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">កាលបរិច្ឆេទ៖</span>
          </div>
          
          <select 
            value={timePreset}
            onChange={(e) => setTimePreset(e.target.value as TimePreset)}
            className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <option value="today">ថ្ងៃនេះ (Today)</option>
            <option value="last_month">ខែមុន (Last Month)</option>
            <option value="this_month">ខែនេះ (This Month)</option>
            <option value="this_year">ឆ្នាំនេះ (This Year)</option>
            <option value="all">ទាំងអស់ (All Time)</option>
            <option value="custom">កំណត់ថ្ងៃ (Custom Range)</option>
          </select>

          {timePreset === 'custom' && (
            <div className="flex items-center space-x-2 animate-slide-up">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm dark:text-white outline-none"
              />
              <span className="text-sm text-slate-400 font-medium">ដល់</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm dark:text-white outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2.1. Financial Summary Cards (Dual Currency KHR & USD) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Net Balance Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 md:p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-500/30 relative overflow-hidden glass-card-hover group">
          <div className="absolute -right-6 -bottom-6 opacity-20 text-white transform group-hover:scale-110 transition-transform duration-500"><Wallet className="w-40 h-40" /></div>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="text-xs font-bold text-indigo-100 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md uppercase tracking-wider">សមតុល្យសុទ្ធ (Net Balance)</span>
          <div className="mt-6 space-y-1 relative z-10">
            <h3 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
              {netBalanceKHR.toLocaleString()} ៛
            </h3>
            <p className="text-base text-indigo-200 font-bold tracking-wide">
              ${netBalanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-5 md:p-6 rounded-[2rem] text-white shadow-xl shadow-blue-500/30 relative overflow-hidden glass-card-hover group">
          <div className="absolute -right-6 -bottom-6 opacity-20 text-white transform group-hover:scale-110 transition-transform duration-500"><TrendingUp className="w-40 h-40" /></div>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="text-xs font-bold text-blue-100 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md uppercase tracking-wider">ចំណូលសរុប (Income)</span>
          <div className="mt-6 space-y-1 relative z-10">
            <h3 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
              {totalIncInKHR.toLocaleString()} ៛
            </h3>
            <p className="text-base text-blue-100 font-bold tracking-wide">
              ${totalIncInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-gradient-to-br from-rose-500 to-orange-500 p-5 md:p-6 rounded-[2rem] text-white shadow-xl shadow-rose-500/30 relative overflow-hidden glass-card-hover group">
          <div className="absolute -right-6 -bottom-6 opacity-20 text-white transform group-hover:scale-110 transition-transform duration-500"><TrendingDown className="w-40 h-40" /></div>
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="text-xs font-bold text-rose-100 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md uppercase tracking-wider">ចំណាយសរុប (Expense)</span>
          <div className="mt-6 space-y-1 relative z-10">
            <h3 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
              -{totalExpInKHR.toLocaleString()} ៛
            </h3>
            <p className="text-base text-rose-100 font-bold tracking-wide">
              -${totalExpInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Graphical Analysis Section Matching Screenshots */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">ការវិភាគក្រាហ្វិក</h2>
          <p className="text-xs text-slate-500 italic mt-1">* ចំណាំ៖ លេខនៅលើក្រាហ្វិកត្រូវបានបម្លែងជា USD</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Bar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-center text-sm text-slate-700 dark:text-slate-200 mb-6">ប្រៀបធៀបចំណូល និងចំណាយ</h4>
            <div className="h-64">
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </div>

          {/* Chart 2: Doughnut Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-center text-sm text-slate-700 dark:text-slate-200 mb-6">បំណែងចែកចំណាយតាមប្រភេទ</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 h-64 flex justify-center">
                <Doughnut data={expChartData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false, animation: false }} />
              </div>
              <div className="md:col-span-5 max-h-60 overflow-y-auto space-y-2 pr-1">
                {expLabels.map((lbl, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-[10px] md:text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <div className="w-6 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: chartColors[idx % chartColors.length] }}></div>
                    <span className="truncate">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 3: Line Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-center text-sm text-slate-700 dark:text-slate-200 mb-2">និន្នាការលំហូរសាច់ប្រាក់តាមថ្ងៃ</h4>
            <div className="flex justify-center space-x-6 mb-4">
              <div className="flex items-center space-x-2"><div className="w-6 h-2 bg-emerald-500 rounded-sm border border-emerald-500"></div><span className="text-[10px] text-slate-500">ចំណូល</span></div>
              <div className="flex items-center space-x-2"><div className="w-6 h-2 bg-rose-500 rounded-sm border border-rose-500/20"></div><span className="text-[10px] text-slate-500">ចំណាយ</span></div>
            </div>
            <div className="h-64">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>

          {/* Chart 4: Polar Area */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-center text-sm text-slate-700 dark:text-slate-200 mb-6">ទំហំចំណាយធៀបនឹងប្រភេទ</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 h-64 flex justify-center">
                <PolarArea data={expChartData} options={{ plugins: { legend: { display: false } }, scales: { r: { ticks: { display: false } } }, maintainAspectRatio: false, animation: false }} />
              </div>
              <div className="md:col-span-5 max-h-60 overflow-y-auto space-y-2 pr-1">
                {expLabels.map((lbl, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-[10px] md:text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <div className="w-6 h-3 rounded-sm opacity-60 flex-shrink-0" style={{ backgroundColor: chartColors[idx % chartColors.length] }}></div>
                    <span className="truncate">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 5: Pie Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-center text-sm text-slate-700 dark:text-slate-200 mb-6">ប្រភពចំណូលតាមប្រភេទ</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 h-64 flex justify-center">
                <Pie data={incChartData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false, animation: false }} />
              </div>
              <div className="md:col-span-5 max-h-60 overflow-y-auto space-y-2 pr-1">
                {incLabels.map((lbl, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-[10px] md:text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <div className="w-6 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: chartColors.slice().reverse()[idx % chartColors.length] }}></div>
                    <span className="truncate">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 6: Radar Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-center text-sm text-slate-700 dark:text-slate-200 mb-6">វិភាគកម្រិតចំណាយ (Radar)</h4>
            <div className="h-72">
              <Radar 
                data={{
                  labels: expLabels.length ? expLabels : ['គ្មានទិន្នន័យ'],
                  datasets: [{
                    label: 'ចំណាយ',
                    data: expValues.length ? expValues : [0],
                    backgroundColor: 'rgba(14, 165, 233, 0.4)',
                    borderColor: '#0ea5e9',
                    pointBackgroundColor: '#0ea5e9',
                  }]
                }} 
                options={{
                  plugins: { legend: { display: false } },
                  scales: { r: { ticks: { display: false } } },
                  maintainAspectRatio: false
                }} 
              />
            </div>
          </div>

        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="glass-panel p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200">ប្រតិបត្តិការចុងក្រោយ (Recent Transactions)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">បង្ហាញ {filteredTxs.length} ប្រតិបត្តិការតាមកាលបរិច្ឆេទ</p>
          </div>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
            {filteredTxs.length} ធាតុ
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredTxs.slice(0, 5).map((t) => {
            const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ', color: 'from-blue-400 to-blue-600', icon: 'tag' };
            const isInc = t.type === 'income';

            return (
              <div 
                key={t.id} 
                onClick={() => setViewingTransaction(t)}
                className="py-3 flex items-center justify-between group hover:bg-blue-50/60 dark:hover:bg-slate-800/60 px-3 rounded-2xl transition-colors cursor-pointer active:scale-[0.995]"
                title="ចុចដើម្បីមើលព័ត៌មានលម្អិត"
              >
                <div className="flex items-center space-x-3">
                  <CategoryBadge color={cat.color} icon={cat.icon} size="md" />
                  <div>
                    <h5 className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.name}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDateDisplay(t.date)}{t.time ? ` • ${formatTime12(t.time)}` : ''} • {t.description || 'គ្មានការពិពណ៌នា'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-sm sm:text-base ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isInc ? '+' : '-'}{t.currency === 'USD' ? '$' : ''}{t.amount.toLocaleString()}{t.currency === 'KHR' ? ' ៛' : ''}
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider">{t.currency}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
