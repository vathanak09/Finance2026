import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../../context/FinanceContext';
import type { CurrencyMode, Transaction } from '../../types/finance';
import {
  ArrowLeft,
  BarChart2,
  Calendar,
  ChevronDown,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Wallet,
  Award,
  Layers,
  X,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Bar, Line, Doughnut, PolarArea, Radar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { CustomSelect } from '../common/CustomSelect';
import { CategoryBadge } from '../../utils/categoryIcons';
import {
  KHMER_MONTHS,
  getAvailableYears,
  parseLocalDate,
  getLocalDateString,
  formatDateDisplay,
  formatTime12,
} from '../../utils/dateUtils';
import {
  SHORT_KHMER_MONTHS,
  REPORT_PALETTE,
  convertTxValue,
  formatReportMoney,
  formatCompactMoney,
  calcGrowthPct,
} from '../../utils/summaryReportHelpers';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  BarElement
);

type FlowFilter = 'all' | 'income' | 'expense';
type ChartViewMode = 'overview' | 'categories';

interface DrillDownTarget {
  title: string;
  month?: number;
  categoryId?: string;
}

export const SummaryReportTab: React.FC = () => {
  const {
    transactions,
    categories,
    exchangeRate,
    currencyMode,
    setCurrencyMode,
    setActiveTab,
    setViewingTransaction,
  } = useFinance();

  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);

  const [flowFilter, setFlowFilter] = useState<FlowFilter>('all');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);

  const [viewMode, setViewMode] = useState<ChartViewMode>('overview');
  const [barStacked, setBarStacked] = useState<boolean>(false);
  const [compareYoY, setCompareYoY] = useState<boolean>(false);
  const [radialChartType, setRadialChartType] = useState<'polar' | 'radar'>('polar');
  const [drillDown, setDrillDown] = useState<DrillDownTarget | null>(null);

  const sortedSelectedMonths = useMemo(
    () => [...selectedMonths].sort((a, b) => a - b),
    [selectedMonths]
  );

  // Months that actually have transactions in selectedYear
  const activeMonthsInYear = useMemo(() => {
    const set = new Set<number>();
    transactions.forEach((t) => {
      const d = parseLocalDate(t.date);
      if (!isNaN(d.getTime()) && d.getFullYear() === selectedYear) {
        set.add(d.getMonth());
      }
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [transactions, selectedYear]);

  const toggleMonth = (m: number) => {
    setSelectedMonths((prev) => {
      if (prev.includes(m)) {
        return prev.length > 1 ? prev.filter((x) => x !== m) : prev; // keep at least 1 month
      }
      return [...prev, m].sort((a, b) => a - b);
    });
  };

  const applyMonthPreset = (months: number[]) => {
    setSelectedMonths(months.length > 0 ? months : [new Date().getMonth()]);
    setIsMonthMenuOpen(false);
  };

  // Categories available under the chosen flowFilter
  const filteredCategoryCatalog = useMemo(() => {
    return categories.filter((c) => flowFilter === 'all' || c.type === flowFilter);
  }, [categories, flowFilter]);

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Filter transactions for a given year & selected months + flow/category/currency filters
  const getMatchingTxsForYear = useMemo(() => {
    const monthSet = new Set(sortedSelectedMonths);
    const catSet = new Set(selectedCategoryIds);

    return (targetYear: number) =>
      transactions.filter((t) => {
        const d = parseLocalDate(t.date);
        if (isNaN(d.getTime())) return false;
        if (d.getFullYear() !== targetYear) return false;
        if (!monthSet.has(d.getMonth())) return false;
        if (flowFilter !== 'all' && t.type !== flowFilter) return false;
        if (catSet.size > 0 && !catSet.has(t.categoryId)) return false;
        return convertTxValue(t, currencyMode, exchangeRate) !== null;
      });
  }, [transactions, sortedSelectedMonths, flowFilter, selectedCategoryIds, currencyMode, exchangeRate]);

  const currentYearTxs = useMemo(() => getMatchingTxsForYear(selectedYear), [getMatchingTxsForYear, selectedYear]);
  const prevYearTxs = useMemo(
    () => (compareYoY ? getMatchingTxsForYear(selectedYear - 1) : []),
    [compareYoY, getMatchingTxsForYear, selectedYear]
  );

  // Aggregate monthly totals for selected year & previous year
  const monthlyStats = useMemo(() => {
    const map = new Map<number, { income: number; expense: number; net: number; savingsRate: number | null; count: number }>();
    sortedSelectedMonths.forEach((m) => {
      map.set(m, { income: 0, expense: 0, net: 0, savingsRate: null, count: 0 });
    });

    currentYearTxs.forEach((t) => {
      const m = parseLocalDate(t.date).getMonth();
      const val = convertTxValue(t, currencyMode, exchangeRate);
      const entry = map.get(m);
      if (!entry || val === null) return;
      if (t.type === 'income') entry.income += val;
      else entry.expense += val;
      entry.count += 1;
    });

    const rows = sortedSelectedMonths.map((m) => {
      const e = map.get(m)!;
      e.net = e.income - e.expense;
      e.savingsRate = e.income > 0 ? (e.net / e.income) * 100 : null;
      return { month: m, label: SHORT_KHMER_MONTHS[m], ...e };
    });

    return rows;
  }, [currentYearTxs, sortedSelectedMonths, currencyMode, exchangeRate]);

  const prevYearMonthlyStats = useMemo(() => {
    const map = new Map<number, { income: number; expense: number; net: number }>();
    sortedSelectedMonths.forEach((m) => map.set(m, { income: 0, expense: 0, net: 0 }));

    prevYearTxs.forEach((t) => {
      const m = parseLocalDate(t.date).getMonth();
      const val = convertTxValue(t, currencyMode, exchangeRate);
      const entry = map.get(m);
      if (!entry || val === null) return;
      if (t.type === 'income') entry.income += val;
      else entry.expense += val;
    });

    return sortedSelectedMonths.map((m) => {
      const e = map.get(m)!;
      return { month: m, ...e, net: e.income - e.expense };
    });
  }, [prevYearTxs, sortedSelectedMonths, currencyMode, exchangeRate]);

  // Overall KPIs
  const kpi = useMemo(() => {
    const totalInc = monthlyStats.reduce((s, r) => s + r.income, 0);
    const totalExp = monthlyStats.reduce((s, r) => s + r.expense, 0);
    const totalNet = totalInc - totalExp;
    const monthCount = Math.max(1, monthlyStats.length);
    const avgInc = totalInc / monthCount;
    const avgExp = totalExp / monthCount;
    const overallSavingsRate = totalInc > 0 ? (totalNet / totalInc) * 100 : null;

    const prevInc = prevYearMonthlyStats.reduce((s, r) => s + r.income, 0);
    const prevExp = prevYearMonthlyStats.reduce((s, r) => s + r.expense, 0);

    const bestIncomeMonth = [...monthlyStats].sort((a, b) => b.income - a.income)[0];
    const highestExpenseMonth = [...monthlyStats].sort((a, b) => b.expense - a.expense)[0];

    // Latest two active months MoM net change
    const nonZeroMonths = monthlyStats.filter((m) => m.income > 0 || m.expense > 0);
    let momLabel = '—';
    let momPct: number | null = null;
    if (nonZeroMonths.length >= 2) {
      const latest = nonZeroMonths[nonZeroMonths.length - 1];
      const prev = nonZeroMonths[nonZeroMonths.length - 2];
      const baseCurr = flowFilter === 'expense' ? latest.expense : latest.income;
      const basePrev = flowFilter === 'expense' ? prev.expense : prev.income;
      momPct = calcGrowthPct(baseCurr, basePrev);
      momLabel = `${latest.label} ធៀប ${prev.label}`;
    }

    return {
      totalInc,
      totalExp,
      totalNet,
      avgInc,
      avgExp,
      overallSavingsRate,
      yoyIncPct: compareYoY ? calcGrowthPct(totalInc, prevInc) : null,
      yoyExpPct: compareYoY ? calcGrowthPct(totalExp, prevExp) : null,
      bestIncomeMonth,
      highestExpenseMonth,
      momPct,
      momLabel,
    };
  }, [monthlyStats, prevYearMonthlyStats, compareYoY, flowFilter]);

  // Category x Month matrix & totals
  const categoryMatrix = useMemo(() => {
    const byCat = new Map<
      string,
      {
        categoryId: string;
        name: string;
        type: 'income' | 'expense';
        icon: string;
        color: string;
        monthValues: Record<number, number>;
        total: number;
        count: number;
      }
    >();

    // Seed explicitly selected categories even if 0 so comparisons remain visible
    if (selectedCategoryIds.length > 0) {
      selectedCategoryIds.forEach((cid) => {
        const cat = categories.find((c) => c.id === cid);
        if (cat && (flowFilter === 'all' || cat.type === flowFilter)) {
          byCat.set(cid, {
            categoryId: cid,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            monthValues: {},
            total: 0,
            count: 0,
          });
        }
      });
    }

    currentYearTxs.forEach((t) => {
      const val = convertTxValue(t, currencyMode, exchangeRate);
      if (val === null) return;
      const m = parseLocalDate(t.date).getMonth();
      const cat = categories.find((c) => c.id === t.categoryId);
      const existing = byCat.get(t.categoryId) || {
        categoryId: t.categoryId,
        name: cat?.name || 'ផ្សេងៗ',
        type: t.type,
        icon: cat?.icon || 'tag',
        color: cat?.color || 'from-slate-400 to-slate-600',
        monthValues: {},
        total: 0,
        count: 0,
      };
      existing.monthValues[m] = (existing.monthValues[m] || 0) + val;
      existing.total += val;
      existing.count += 1;
      byCat.set(t.categoryId, existing);
    });

    return Array.from(byCat.values()).sort((a, b) => b.total - a.total);
  }, [currentYearTxs, categories, selectedCategoryIds, flowFilter, currencyMode, exchangeRate]);

  // Chart datasets
  const monthLabels = useMemo(
    () => sortedSelectedMonths.map((m) => SHORT_KHMER_MONTHS[m]),
    [sortedSelectedMonths]
  );

  // Categories shown in 'categories' viewMode (selected ones or top 6 active)
  const chartCategories = useMemo(() => {
    if (selectedCategoryIds.length > 0) return categoryMatrix;
    return categoryMatrix.slice(0, 6);
  }, [categoryMatrix, selectedCategoryIds]);

  const barChartData = useMemo(() => {
    if (viewMode === 'categories') {
      return {
        labels: monthLabels,
        datasets: chartCategories.map((cat, idx) => {
          const hex = REPORT_PALETTE[idx % REPORT_PALETTE.length];
          return {
            label: cat.name,
            data: sortedSelectedMonths.map((m) => cat.monthValues[m] || 0),
            backgroundColor: `${hex}cc`,
            borderColor: hex,
            borderWidth: 1.5,
            borderRadius: 6,
          };
        }),
      };
    }

    const datasets: any[] = [];
    if (flowFilter !== 'expense') {
      datasets.push({
        label: `ចំណូល (${selectedYear})`,
        data: monthlyStats.map((r) => r.income),
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 6,
      });
    }
    if (flowFilter !== 'income') {
      datasets.push({
        label: `ចំណាយ (${selectedYear})`,
        data: monthlyStats.map((r) => r.expense),
        backgroundColor: 'rgba(244, 63, 94, 0.85)',
        borderColor: '#f43f5e',
        borderWidth: 1,
        borderRadius: 6,
      });
    }
    if (flowFilter === 'all' && !barStacked) {
      datasets.push({
        label: `សមតុល្យសុទ្ធ (${selectedYear})`,
        data: monthlyStats.map((r) => r.net),
        backgroundColor: 'rgba(59, 130, 246, 0.78)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 6,
      });
    }
    if (compareYoY) {
      if (flowFilter !== 'expense') {
        datasets.push({
          label: `ចំណូល (${selectedYear - 1})`,
          data: prevYearMonthlyStats.map((r) => r.income),
          backgroundColor: 'rgba(16, 185, 129, 0.25)',
          borderColor: '#059669',
          borderWidth: 1.5,
          borderRadius: 6,
        });
      }
      if (flowFilter !== 'income') {
        datasets.push({
          label: `ចំណាយ (${selectedYear - 1})`,
          data: prevYearMonthlyStats.map((r) => r.expense),
          backgroundColor: 'rgba(244, 63, 94, 0.25)',
          borderColor: '#e11d48',
          borderWidth: 1.5,
          borderRadius: 6,
        });
      }
    }

    return { labels: monthLabels, datasets };
  }, [
    viewMode,
    monthLabels,
    chartCategories,
    sortedSelectedMonths,
    flowFilter,
    selectedYear,
    monthlyStats,
    barStacked,
    compareYoY,
    prevYearMonthlyStats,
  ]);

  const lineChartData = useMemo(() => {
    if (viewMode === 'categories') {
      return {
        labels: monthLabels,
        datasets: chartCategories.map((cat, idx) => {
          const hex = REPORT_PALETTE[idx % REPORT_PALETTE.length];
          return {
            label: cat.name,
            data: sortedSelectedMonths.map((m) => cat.monthValues[m] || 0),
            borderColor: hex,
            backgroundColor: `${hex}22`,
            fill: false,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: 3.5,
            pointHoverRadius: 6,
          };
        }),
      };
    }

    const datasets: any[] = [];
    if (flowFilter !== 'expense') {
      datasets.push({
        label: `ចំណូល (${selectedYear})`,
        data: monthlyStats.map((r) => r.income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.14)',
        fill: true,
        tension: 0.38,
        borderWidth: 2.5,
        pointRadius: 3.5,
        pointHoverRadius: 6,
      });
    }
    if (flowFilter !== 'income') {
      datasets.push({
        label: `ចំណាយ (${selectedYear})`,
        data: monthlyStats.map((r) => r.expense),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.14)',
        fill: true,
        tension: 0.38,
        borderWidth: 2.5,
        pointRadius: 3.5,
        pointHoverRadius: 6,
      });
    }
    if (compareYoY) {
      if (flowFilter !== 'expense') {
        datasets.push({
          label: `ចំណូល (${selectedYear - 1})`,
          data: prevYearMonthlyStats.map((r) => r.income),
          borderColor: '#34d399',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          fill: false,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2.5,
        });
      }
      if (flowFilter !== 'income') {
        datasets.push({
          label: `ចំណាយ (${selectedYear - 1})`,
          data: prevYearMonthlyStats.map((r) => r.expense),
          borderColor: '#fb7185',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          fill: false,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 2.5,
        });
      }
    }

    return { labels: monthLabels, datasets };
  }, [
    viewMode,
    monthLabels,
    chartCategories,
    sortedSelectedMonths,
    flowFilter,
    selectedYear,
    monthlyStats,
    compareYoY,
    prevYearMonthlyStats,
  ]);

  // Top Categories for Doughnut & Polar/Radar & Ranking Cards
  const topIncomeCategories = useMemo(
    () => categoryMatrix.filter((c) => c.type === 'income' && c.total > 0),
    [categoryMatrix]
  );
  const topExpenseCategories = useMemo(
    () => categoryMatrix.filter((c) => c.type === 'expense' && c.total > 0),
    [categoryMatrix]
  );
  const activeDistributionCategories = useMemo(
    () => categoryMatrix.filter((c) => c.total > 0).slice(0, 10),
    [categoryMatrix]
  );

  const doughnutData = useMemo(() => {
    return {
      labels: activeDistributionCategories.length
        ? activeDistributionCategories.map((c) => c.name)
        : ['គ្មានទិន្នន័យ'],
      datasets: [
        {
          data: activeDistributionCategories.length
            ? activeDistributionCategories.map((c) => c.total)
            : [1],
          backgroundColor: activeDistributionCategories.length
            ? activeDistributionCategories.map((_, idx) => REPORT_PALETTE[idx % REPORT_PALETTE.length])
            : ['#cbd5e1'],
          borderWidth: 0,
        },
      ],
    };
  }, [activeDistributionCategories]);

  const radialData = useMemo(() => {
    const slice = activeDistributionCategories.slice(0, 8);
    return {
      labels: slice.length ? slice.map((c) => c.name) : ['គ្មានទិន្នន័យ'],
      datasets: [
        {
          label: 'សរុបតាមប្រភេទ',
          data: slice.length ? slice.map((c) => c.total) : [0],
          backgroundColor:
            radialChartType === 'polar'
              ? slice.map((_, idx) => `${REPORT_PALETTE[idx % REPORT_PALETTE.length]}b3`)
              : 'rgba(99, 102, 241, 0.35)',
          borderColor:
            radialChartType === 'polar'
              ? slice.map((_, idx) => REPORT_PALETTE[idx % REPORT_PALETTE.length])
              : '#6366f1',
          borderWidth: 1.5,
        },
      ],
    };
  }, [activeDistributionCategories, radialChartType]);

  // Drill-down transactions matching clicked month and/or category
  const drillDownTransactions = useMemo<Transaction[]>(() => {
    if (!drillDown) return [];
    return currentYearTxs.filter((t) => {
      const m = parseLocalDate(t.date).getMonth();
      if (drillDown.month !== undefined && m !== drillDown.month) return false;
      if (drillDown.categoryId && t.categoryId !== drillDown.categoryId) return false;
      return true;
    });
  }, [drillDown, currentYearTxs]);

  const openMonthDrillDown = (monthIdx: number) => {
    const m = sortedSelectedMonths[monthIdx];
    if (m === undefined) return;
    setDrillDown({
      title: `ប្រតិបត្តិការ៖ ${SHORT_KHMER_MONTHS[m]} ${selectedYear}`,
      month: m,
    });
  };

  const commonAxisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#64748b',
          boxWidth: 12,
          font: { size: 11, weight: 'bold' as const },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatReportMoney(Number(ctx.raw || 0), currencyMode)}`,
        },
      },
    },
    scales: {
      x: {
        stacked: viewMode === 'categories' || barStacked,
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11, weight: 'bold' as const } },
      },
      y: {
        stacked: viewMode === 'categories' || barStacked,
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (val: any) => formatCompactMoney(Number(val), currencyMode),
        },
      },
    },
  };

  // Excel Export (Matrix + Monthly Totals)
  const handleExportExcel = () => {
    const matrixRows = categoryMatrix.map((cat) => {
      const row: Record<string, string | number> = {
        'ប្រភេទ': cat.name,
        'ចំណូល/ចំណាយ': cat.type === 'income' ? 'ចំណូល' : 'ចំណាយ',
      };
      sortedSelectedMonths.forEach((m) => {
        row[SHORT_KHMER_MONTHS[m]] = Number((cat.monthValues[m] || 0).toFixed(2));
      });
      row['សរុប'] = Number(cat.total.toFixed(2));
      row['មធ្យម/ខែ'] = Number((cat.total / Math.max(1, sortedSelectedMonths.length)).toFixed(2));
      return row;
    });

    const summaryRows = monthlyStats.map((r, i) => {
      const prevNet = i > 0 ? monthlyStats[i - 1].net : null;
      const mom = prevNet !== null ? calcGrowthPct(r.net, prevNet) : null;
      return {
        'ខែ': `${r.label} ${selectedYear}`,
        'ចំណូល': Number(r.income.toFixed(2)),
        'ចំណាយ': Number(r.expense.toFixed(2)),
        'សមតុល្យសុទ្ធ': Number(r.net.toFixed(2)),
        'អត្រាសន្សំ (%)': r.savingsRate !== null ? `${r.savingsRate.toFixed(1)}%` : '-',
        'ធៀបខែមុន (%)': mom !== null ? `${mom >= 0 ? '+' : ''}${mom.toFixed(1)}%` : '-',
      };
    });

    const wb = XLSX.utils.book_new();
    const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
    const wsMonthly = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'សរុបប្រចាំខែ');
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'ប្រភេទ_តាមខែ');
    XLSX.writeFile(wb, `Summary_Report_${selectedYear}_${getLocalDateString()}.xlsx`);
  };

  const monthSummaryLabel =
    selectedMonths.length === 12
      ? 'ទាំង ១២ ខែ'
      : selectedMonths.length <= 3
      ? sortedSelectedMonths.map((m) => SHORT_KHMER_MONTHS[m]).join(', ')
      : `បានជ្រើស ${selectedMonths.length} ខែ`;

  const totalDistribution = activeDistributionCategories.reduce((s, c) => s + c.total, 0);

  return (
    <div className="space-y-5 max-w-6xl mx-auto animate-fade-in pb-10">
      {/* Header & Back / Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setActiveTab('apps')}
            className="print:hidden p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="ត្រឡប់ទៅកម្មវិធី"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              <span>របាយការណ៍សរុប ({selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ប្រៀបធៀប {monthSummaryLabel} • {currentYearTxs.length} ប្រតិបត្តិការ
            </p>
          </div>
        </div>

        <div className="print:hidden flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter & Comparison Control Panel */}
      <div className="print:hidden glass-panel p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3 relative z-30">
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <CustomSelect<number>
              value={selectedYear}
              onChange={setSelectedYear}
              options={availableYears.map((y) => ({ value: y, label: `ឆ្នាំ ${y}` }))}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
            />
          </div>

          {/* Multi-Select Months Dropdown */}
          <div className="relative z-40">
            <button
              type="button"
              onClick={() => {
                setIsMonthMenuOpen(!isMonthMenuOpen);
                setIsCatMenuOpen(false);
              }}
              className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <span>ខែ៖ {monthSummaryLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMonthMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMonthMenuOpen && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsMonthMenuOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-3 space-y-2.5">
                  <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <button
                      type="button"
                      onClick={() => applyMonthPreset([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])}
                      className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold hover:bg-indigo-100 cursor-pointer"
                    >
                      ទាំង ១២ ខែ
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMonthPreset([0, 1, 2, 3, 4, 5])}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      ៦ ខែដើម
                    </button>
                    <button
                      type="button"
                      onClick={() => applyMonthPreset([6, 7, 8, 9, 10, 11])}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      ៦ ខែចុង
                    </button>
                    {activeMonthsInYear.length > 0 && (
                      <button
                        type="button"
                        onClick={() => applyMonthPreset(activeMonthsInYear)}
                        className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
                      >
                        ខែមានទិន្នន័យ ({activeMonthsInYear.length})
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
                    {KHMER_MONTHS.map((m) => {
                      const checked = selectedMonths.includes(m.value);
                      return (
                        <label
                          key={m.value}
                          className={`flex items-center space-x-2 p-2 rounded-xl cursor-pointer text-xs font-semibold transition-colors ${
                            checked
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMonth(m.value)}
                            className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 dark:border-slate-700"
                          />
                          <span className="truncate">{SHORT_KHMER_MONTHS[m.value]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Flow Type Filter */}
          <CustomSelect<FlowFilter>
            value={flowFilter}
            onChange={(val) => {
              setFlowFilter(val);
              setSelectedCategoryIds([]);
            }}
            options={[
              { value: 'all', label: 'ចំណូល & ចំណាយ' },
              { value: 'income', label: 'ចំណូលតែប៉ុណ្ណោះ' },
              { value: 'expense', label: 'ចំណាយតែប៉ុណ្ណោះ' },
            ]}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
          />

          {/* Multi-Select Categories Dropdown */}
          <div className="relative z-40">
            <button
              type="button"
              onClick={() => {
                setIsCatMenuOpen(!isCatMenuOpen);
                setIsMonthMenuOpen(false);
              }}
              className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <span>
                {selectedCategoryIds.length === 0
                  ? 'ប្រភេទ៖ ទាំងអស់'
                  : `ប្រៀបធៀបប្រភេទ (${selectedCategoryIds.length})`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCatMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCatMenuOpen && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsCatMenuOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      ជ្រើសប្រភេទដើម្បីប្រៀបធៀប
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryIds([])}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      ជ្រើសទាំងអស់
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    {filteredCategoryCatalog.map((c) => {
                      const checked = selectedCategoryIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategory(c.id)}
                              className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700"
                            />
                            <CategoryBadge color={c.color} icon={c.icon} size="xs" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                              {c.name}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              c.type === 'income'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {c.type === 'income' ? 'ចំណូល' : 'ចំណាយ'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Currency Mode */}
          <CustomSelect<CurrencyMode>
            value={currencyMode}
            onChange={setCurrencyMode}
            accentColor="emerald"
            options={[
              { value: 'MERGED_KHR', label: 'បញ្ចូលគ្នា KHR (៛)' },
              { value: 'MERGED_USD', label: 'បញ្ចូលគ្នា USD ($)' },
              { value: 'USD_ONLY', label: 'USD តែប៉ុណ្ណោះ' },
              { value: 'KHR_ONLY', label: 'KHR តែប៉ុណ្ណោះ' },
            ]}
            className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300"
          />
        </div>

        {/* View Mode + YoY + Stacked Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ប្រៀបធៀប ចំណូល-ចំណាយ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'categories'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ប្រៀបធៀបតាម ប្រភេទ
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewMode === 'overview' && (
              <>
                <button
                  type="button"
                  onClick={() => setCompareYoY(!compareYoY)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    compareYoY
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>ធៀបឆ្នាំ {selectedYear - 1} (YoY)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBarStacked(!barStacked)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    barStacked
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ក្រាបជង់ (Stacked)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Income */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/15 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">ចំណូលសរុប</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatReportMoney(kpi.totalInc, currencyMode)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>មធ្យម៖ {formatCompactMoney(kpi.avgInc, currencyMode)}/ខែ</span>
            {kpi.yoyIncPct !== null && (
              <span className={kpi.yoyIncPct >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                {kpi.yoyIncPct >= 0 ? '▲' : '▼'} {Math.abs(kpi.yoyIncPct).toFixed(1)}% YoY
              </span>
            )}
          </div>
        </div>

        {/* Expense */}
        <div className="glass-panel p-4 rounded-2xl border border-rose-200/70 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/15 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">ចំណាយសរុប</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400">
            {formatReportMoney(kpi.totalExp, currencyMode)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>មធ្យម៖ {formatCompactMoney(kpi.avgExp, currencyMode)}/ខែ</span>
            {kpi.yoyExpPct !== null && (
              <span className={kpi.yoyExpPct <= 0 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                {kpi.yoyExpPct >= 0 ? '▲' : '▼'} {Math.abs(kpi.yoyExpPct).toFixed(1)}% YoY
              </span>
            )}
          </div>
        </div>

        {/* Net Balance & Savings Rate */}
        <div className="glass-panel p-4 rounded-2xl border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/15 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">សមតុល្យសុទ្ធ & សន្សំ</span>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <p className={`text-xl font-black ${kpi.totalNet >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {kpi.totalNet >= 0 ? '+' : ''}{formatReportMoney(kpi.totalNet, currencyMode)}
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">អត្រាសន្សំ៖</span>
            <span
              className={`px-2 py-0.5 rounded-full font-extrabold ${
                kpi.overallSavingsRate === null
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  : kpi.overallSavingsRate >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
              }`}
            >
              {kpi.overallSavingsRate !== null ? `${kpi.overallSavingsRate.toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>

        {/* Highlights & MoM */}
        <div className="glass-panel p-4 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/15 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">ខែលេចធ្លោ & កំណើន</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xs space-y-1 pt-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">ចំណូលខ្ពស់៖</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {kpi.bestIncomeMonth && kpi.bestIncomeMonth.income > 0
                  ? `${kpi.bestIncomeMonth.label} (${formatCompactMoney(kpi.bestIncomeMonth.income, currencyMode)})`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">ចំណាយខ្ពស់៖</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">
                {kpi.highestExpenseMonth && kpi.highestExpenseMonth.expense > 0
                  ? `${kpi.highestExpenseMonth.label} (${formatCompactMoney(kpi.highestExpenseMonth.expense, currencyMode)})`
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 truncate max-w-[115px]">{kpi.momLabel}៖</span>
              <span
                className={`font-extrabold ${
                  kpi.momPct === null
                    ? 'text-slate-400'
                    : kpi.momPct >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {kpi.momPct !== null ? `${kpi.momPct >= 0 ? '▲ +' : '▼ '}${kpi.momPct.toFixed(1)}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar Chart */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
                ក្រាបសសរប្រៀបធៀបតាមខែ ({viewMode === 'categories' ? 'តាមប្រភេទ' : 'ចំណូល / ចំណាយ'})
              </h4>
              <p className="text-[11px] text-slate-400">ចុចលើសសរខែណាមួយ ដើម្បីមើលប្រតិបត្តិការលម្អិត</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <Bar
              data={barChartData}
              options={{
                ...commonAxisOptions,
                onClick: (_event, elements) => {
                  if (elements && elements.length > 0) {
                    openMonthDrillDown(elements[0].index);
                  }
                },
              }}
            />
          </div>
        </div>

        {/* Line Trend Chart */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
              ក្រាបខ្សែបង្ហាញនិន្នាការឡើងចុះ
            </h4>
            <p className="text-[11px] text-slate-400">មើលសន្ទុះកើន/ថយឆ្លងខែ (ចុចលើចំណុចដើម្បីមើលប្រតិបត្តិការ)</p>
          </div>
          <div className="h-72 sm:h-80">
            <Line
              data={lineChartData}
              options={{
                ...commonAxisOptions,
                interaction: { mode: 'index', intersect: false },
                onClick: (_event, elements) => {
                  if (elements && elements.length > 0) {
                    openMonthDrillDown(elements[0].index);
                  }
                },
              }}
            />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-2">
            <PieChartIcon className="w-4 h-4 text-emerald-500" />
            <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
              សមាមាត្រតាមប្រភេទ (%)
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-6 h-56 flex justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: false,
                  animation: false,
                  cutout: '62%',
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx: any) =>
                          `${ctx.label}: ${formatReportMoney(Number(ctx.raw || 0), currencyMode)}`,
                      },
                    },
                  },
                  onClick: (_event, elements) => {
                    if (elements && elements.length > 0) {
                      const cat = activeDistributionCategories[elements[0].index];
                      if (cat) setDrillDown({ title: `ប្រតិបត្តិការ៖ ${cat.name}`, categoryId: cat.categoryId });
                    }
                  },
                }}
              />
            </div>
            <div className="sm:col-span-6 max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {activeDistributionCategories.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">គ្មានទិន្នន័យ</p>
              ) : (
                activeDistributionCategories.map((c, idx) => {
                  const pct = totalDistribution > 0 ? ((c.total / totalDistribution) * 100).toFixed(1) : '0';
                  return (
                    <button
                      key={c.categoryId}
                      type="button"
                      onClick={() => setDrillDown({ title: `ប្រតិបត្តិការ៖ ${c.name}`, categoryId: c.categoryId })}
                      className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: REPORT_PALETTE[idx % REPORT_PALETTE.length] }}
                        />
                        <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{c.name}</span>
                      </div>
                      <span className="font-bold text-slate-500 dark:text-slate-400 ml-2 flex-shrink-0">{pct}%</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* PolarArea / Radar Toggle Chart */}
        <div className="glass-panel p-4 sm:p-5 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
              ក្រាបវិភាគទំហំប្រភេទ ({radialChartType === 'polar' ? 'Polar' : 'Radar'})
            </h4>
            <div className="print:hidden inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setRadialChartType('polar')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                  radialChartType === 'polar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Polar
              </button>
              <button
                type="button"
                onClick={() => setRadialChartType('radar')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                  radialChartType === 'radar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Radar
              </button>
            </div>
          </div>
          <div className="h-56">
            {radialChartType === 'polar' ? (
              <PolarArea
                data={radialData}
                options={{
                  maintainAspectRatio: false,
                  animation: false,
                  plugins: { legend: { display: false } },
                  scales: { r: { ticks: { display: false }, grid: { color: 'rgba(148,163,184,0.2)' } } },
                }}
              />
            ) : (
              <Radar
                data={radialData}
                options={{
                  maintainAspectRatio: false,
                  animation: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    r: {
                      ticks: { display: false },
                      grid: { color: 'rgba(148,163,184,0.2)' },
                      pointLabels: { color: '#64748b', font: { size: 10 } },
                    },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Top Income & Top Expense Category Ranking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {flowFilter !== 'expense' && (
          <div className="glass-panel p-5 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm sm:text-base text-emerald-700 dark:text-emerald-400">
                ចំណាត់ថ្នាក់ប្រភេទចំណូល (Top Income)
              </h4>
              <span className="text-xs font-bold text-slate-400">{topIncomeCategories.length} ប្រភេទ</span>
            </div>
            {topIncomeCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">មិនមានទិន្នន័យចំណូល</p>
            ) : (
              <div className="space-y-3">
                {topIncomeCategories.map((c) => {
                  const pct = kpi.totalInc > 0 ? (c.total / kpi.totalInc) * 100 : 0;
                  return (
                    <button
                      key={c.categoryId}
                      type="button"
                      onClick={() => setDrillDown({ title: `ចំណូល៖ ${c.name}`, categoryId: c.categoryId })}
                      className="w-full text-left space-y-1.5 p-2 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <CategoryBadge color={c.color} icon={c.icon} size="xs" />
                          <span className="font-bold text-slate-800 dark:text-white truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-400">({c.count})</span>
                        </div>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                          {formatReportMoney(c.total, currencyMode)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {flowFilter !== 'income' && (
          <div className="glass-panel p-5 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm sm:text-base text-rose-700 dark:text-rose-400">
                ចំណាត់ថ្នាក់ប្រភេទចំណាយ (Top Expense)
              </h4>
              <span className="text-xs font-bold text-slate-400">{topExpenseCategories.length} ប្រភេទ</span>
            </div>
            {topExpenseCategories.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">មិនមានទិន្នន័យចំណាយ</p>
            ) : (
              <div className="space-y-3">
                {topExpenseCategories.map((c) => {
                  const pct = kpi.totalExp > 0 ? (c.total / kpi.totalExp) * 100 : 0;
                  return (
                    <button
                      key={c.categoryId}
                      type="button"
                      onClick={() => setDrillDown({ title: `ចំណាយ៖ ${c.name}`, categoryId: c.categoryId })}
                      className="w-full text-left space-y-1.5 p-2 rounded-xl hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 min-w-0">
                          <CategoryBadge color={c.color} icon={c.icon} size="xs" />
                          <span className="font-bold text-slate-800 dark:text-white truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-400">({c.count})</span>
                        </div>
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 flex-shrink-0">
                          {formatReportMoney(c.total, currencyMode)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category x Month Matrix Table */}
      <div className="glass-panel rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              តារាងម៉ាទ្រីសប្រៀបធៀប (ប្រភេទ × ខែ)
            </h4>
            <p className="text-[11px] text-slate-400">
              ចុចលើឈ្មោះខែ ឬតួលេខណាមួយ ដើម្បីមើលប្រតិបត្តិការលម្អិត
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 px-4 sticky left-0 bg-slate-100 dark:bg-slate-900 z-10 min-w-[150px]">
                  ប្រភេទ
                </th>
                {sortedSelectedMonths.map((m) => (
                  <th key={m} className="p-3 px-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setDrillDown({ title: `ប្រតិបត្តិការ៖ ${SHORT_KHMER_MONTHS[m]} ${selectedYear}`, month: m })}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {SHORT_KHMER_MONTHS[m]}
                    </button>
                  </th>
                ))}
                <th className="p-3 px-3 text-right whitespace-nowrap bg-slate-200/60 dark:bg-slate-800/80">
                  សរុប
                </th>
                <th className="p-3 px-3 text-right whitespace-nowrap">មធ្យម/ខែ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {categoryMatrix.length === 0 ? (
                <tr>
                  <td colSpan={sortedSelectedMonths.length + 3} className="py-10 text-center text-slate-400">
                    មិនមានទិន្នន័យសម្រាប់លក្ខខណ្ឌដែលបានជ្រើសរើសទេ
                  </td>
                </tr>
              ) : (
                categoryMatrix.map((cat) => {
                  const avg = cat.total / Math.max(1, sortedSelectedMonths.length);
                  return (
                    <tr key={cat.categoryId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5 px-4 sticky left-0 bg-white/95 dark:bg-slate-950/95 z-10 border-r border-slate-100 dark:border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => setDrillDown({ title: `ប្រតិបត្តិការ៖ ${cat.name}`, categoryId: cat.categoryId })}
                          className="flex items-center space-x-2 text-left hover:text-indigo-600 cursor-pointer"
                        >
                          <CategoryBadge color={cat.color} icon={cat.icon} size="xs" />
                          <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[130px]">
                            {cat.name}
                          </span>
                        </button>
                      </td>
                      {sortedSelectedMonths.map((m) => {
                        const val = cat.monthValues[m] || 0;
                        return (
                          <td key={m} className="p-2.5 px-2.5 text-right whitespace-nowrap font-mono">
                            {val > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setDrillDown({
                                    title: `${cat.name} • ${SHORT_KHMER_MONTHS[m]} ${selectedYear}`,
                                    month: m,
                                    categoryId: cat.categoryId,
                                  })
                                }
                                className={`font-semibold hover:underline cursor-pointer ${
                                  cat.type === 'income'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {formatCompactMoney(val, currencyMode)}
                              </button>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td
                        className={`p-2.5 px-3 text-right whitespace-nowrap font-black font-mono bg-slate-50/70 dark:bg-slate-900/50 ${
                          cat.type === 'income'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {formatCompactMoney(cat.total, currencyMode)}
                      </td>
                      <td className="p-2.5 px-3 text-right whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">
                        {formatCompactMoney(avg, currencyMode)}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Summary Footer Rows */}
              {flowFilter !== 'expense' && (
                <tr className="bg-emerald-50/60 dark:bg-emerald-950/20 font-extrabold border-t-2 border-emerald-200 dark:border-emerald-900/60">
                  <td className="p-3 px-4 sticky left-0 bg-emerald-50 dark:bg-emerald-950/40 z-10 text-emerald-700 dark:text-emerald-300">
                    សរុបចំណូល
                  </td>
                  {monthlyStats.map((r) => (
                    <td key={r.month} className="p-3 px-2.5 text-right whitespace-nowrap font-mono text-emerald-700 dark:text-emerald-300">
                      {formatCompactMoney(r.income, currencyMode)}
                    </td>
                  ))}
                  <td className="p-3 px-3 text-right whitespace-nowrap font-mono text-emerald-700 dark:text-emerald-300">
                    {formatCompactMoney(kpi.totalInc, currencyMode)}
                  </td>
                  <td className="p-3 px-3 text-right whitespace-nowrap font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCompactMoney(kpi.avgInc, currencyMode)}
                  </td>
                </tr>
              )}

              {flowFilter !== 'income' && (
                <tr className="bg-rose-50/60 dark:bg-rose-950/20 font-extrabold">
                  <td className="p-3 px-4 sticky left-0 bg-rose-50 dark:bg-rose-950/40 z-10 text-rose-700 dark:text-rose-300">
                    សរុបចំណាយ
                  </td>
                  {monthlyStats.map((r) => (
                    <td key={r.month} className="p-3 px-2.5 text-right whitespace-nowrap font-mono text-rose-700 dark:text-rose-300">
                      {formatCompactMoney(r.expense, currencyMode)}
                    </td>
                  ))}
                  <td className="p-3 px-3 text-right whitespace-nowrap font-mono text-rose-700 dark:text-rose-300">
                    {formatCompactMoney(kpi.totalExp, currencyMode)}
                  </td>
                  <td className="p-3 px-3 text-right whitespace-nowrap font-mono text-rose-600 dark:text-rose-400">
                    {formatCompactMoney(kpi.avgExp, currencyMode)}
                  </td>
                </tr>
              )}

              {flowFilter === 'all' && (
                <>
                  <tr className="bg-blue-50/60 dark:bg-blue-950/20 font-black">
                    <td className="p-3 px-4 sticky left-0 bg-blue-50 dark:bg-blue-950/40 z-10 text-blue-700 dark:text-blue-300">
                      សមតុល្យសុទ្ធ
                    </td>
                    {monthlyStats.map((r) => (
                      <td
                        key={r.month}
                        className={`p-3 px-2.5 text-right whitespace-nowrap font-mono ${
                          r.net >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatCompactMoney(r.net, currencyMode)}
                      </td>
                    ))}
                    <td className="p-3 px-3 text-right whitespace-nowrap font-mono text-blue-700 dark:text-blue-300">
                      {formatCompactMoney(kpi.totalNet, currencyMode)}
                    </td>
                    <td className="p-3 px-3 text-right whitespace-nowrap font-mono text-blue-600 dark:text-blue-400">
                      {formatCompactMoney(kpi.totalNet / Math.max(1, monthlyStats.length), currencyMode)}
                    </td>
                  </tr>

                  <tr className="bg-slate-50/90 dark:bg-slate-900/70 font-bold text-[11px]">
                    <td className="p-2.5 px-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 text-slate-600 dark:text-slate-300">
                      អត្រាសន្សំ (%)
                    </td>
                    {monthlyStats.map((r) => (
                      <td
                        key={r.month}
                        className={`p-2.5 px-2.5 text-right whitespace-nowrap font-mono ${
                          r.savingsRate === null
                            ? 'text-slate-400'
                            : r.savingsRate >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {r.savingsRate !== null ? `${r.savingsRate.toFixed(0)}%` : '-'}
                      </td>
                    ))}
                    <td className="p-2.5 px-3 text-right whitespace-nowrap font-mono text-slate-700 dark:text-slate-200">
                      {kpi.overallSavingsRate !== null ? `${kpi.overallSavingsRate.toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-2.5 px-3 text-right text-slate-400">-</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-Down Transactions Modal */}
      {drillDown &&
        createPortal(
          <div
            className="fixed inset-0 z-[105] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setDrillDown(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {drillDown.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ចំនួន {drillDownTransactions.length} ប្រតិបត្តិការ (ចុចដើម្បីមើលព័ត៌មានលម្អិត)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrillDown(null)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800">
                {drillDownTransactions.length === 0 ? (
                  <p className="py-12 text-center text-xs text-slate-400">មិនមានប្រតិបត្តិការឡើយ</p>
                ) : (
                  drillDownTransactions.map((t) => {
                    const cat = categories.find((c) => c.id === t.categoryId);
                    const isInc = t.type === 'income';
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setDrillDown(null);
                          setViewingTransaction(t);
                        }}
                        className="w-full py-3 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <CategoryBadge
                            color={cat?.color || 'from-slate-400 to-slate-600'}
                            icon={cat?.icon || 'tag'}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                              {cat?.name || 'ផ្សេងៗ'}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {formatDateDisplay(t.date)} • {formatTime12(t.time)}
                              {t.createdByName ? ` • ដោយ ${t.createdByName}` : ''}
                              {t.description ? ` • ${t.description}` : ''}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs sm:text-sm font-black whitespace-nowrap ml-3 ${
                            isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isInc ? '+' : '-'}
                          {t.currency === 'USD'
                            ? `$${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${t.amount.toLocaleString()} ៛`}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
