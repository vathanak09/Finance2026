import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, CheckSquare, Square, Plus, Check, AlertTriangle, Calculator } from 'lucide-react';
import { getLocalDateString, getLocalTimeString } from '../../utils/dateUtils';
import { CustomSelect } from '../common/CustomSelect';

const CALC_DESCRIPTIONS = new Set(['ប្រាក់បង់ផ្ទាល់', 'ប្រាក់បង់តាម QR', 'លុយលក់ដូរ']);

export const IncomeCalculator: React.FC = () => {
  const { setActiveTab, transactions, categories, exchangeRate, addTransaction } = useFinance();

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString(new Date()));
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const [cash, setCash] = useState<string>('');
  const [qr, setQr] = useState<string>('');
  const [actualCash, setActualCash] = useState<string>('');

  const [hasCalculated, setHasCalculated] = useState(false);
  const [results, setResults] = useState({
    cashAmount: 0,
    qrAmount: 0,
    printingAmount: 0,
    salesAmount: 0,
    grandTotal: 0,
    hasActualCash: false,
  });

  // Income categories for inserting results into Transactions
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories]
  );

  const findDefaultCategory = (keywords: string[], fallbackIndex = 0): string => {
    const matched = incomeCategories.find((c) =>
      keywords.some((kw) => c.name.toLowerCase().includes(kw.toLowerCase()))
    );
    return matched?.id || incomeCategories[fallbackIndex]?.id || incomeCategories[0]?.id || categories[0]?.id || '';
  };

  const [cashCategoryId, setCashCategoryId] = useState<string>(() => localStorage.getItem('income_calc_cash_cat') || '');
  const [qrCategoryId, setQrCategoryId] = useState<string>(() => localStorage.getItem('income_calc_qr_cat') || '');
  const [salesCategoryId, setSalesCategoryId] = useState<string>(() => localStorage.getItem('income_calc_sales_cat') || '');

  const [insertingKey, setInsertingKey] = useState<'cash' | 'qr' | 'sales' | 'all' | null>(null);

  // Ensure valid defaults once categories load
  useEffect(() => {
    if (incomeCategories.length === 0) return;
    if (!cashCategoryId || !incomeCategories.some((c) => c.id === cashCategoryId)) {
      const def = findDefaultCategory(['ផ្ទាល់', 'cash', 'សាច់ប្រាក់'], 0);
      setCashCategoryId(def);
    }
    if (!qrCategoryId || !incomeCategories.some((c) => c.id === qrCategoryId)) {
      const def = findDefaultCategory(['qr', 'aba', 'ធនាគារ', 'bank'], 0);
      setQrCategoryId(def);
    }
    if (!salesCategoryId || !incomeCategories.some((c) => c.id === salesCategoryId)) {
      const def = findDefaultCategory(['លក់', 'sale', 'អាជីវកម្ម'], 0);
      setSalesCategoryId(def);
    }
  }, [incomeCategories]);

  const handleSelectCategory = (key: 'cash' | 'qr' | 'sales', id: string) => {
    if (key === 'cash') {
      setCashCategoryId(id);
      localStorage.setItem('income_calc_cash_cat', id);
    } else if (key === 'qr') {
      setQrCategoryId(id);
      localStorage.setItem('income_calc_qr_cat', id);
    } else {
      setSalesCategoryId(id);
      localStorage.setItem('income_calc_sales_cat', id);
    }
  };

  const todaysIncomes = useMemo(() => {
    return transactions.filter((tx) => tx.type === 'income' && tx.date === selectedDate);
  }, [transactions, selectedDate]);

  // Auto-check non-calculator incomes on date change or initial load without overwriting manual unchecks
  const prevDateRef = useRef<string>('');
  const knownTxIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const isDateChanged = prevDateRef.current !== selectedDate;
    if (isDateChanged) {
      prevDateRef.current = selectedDate;
      const initialChecked = new Set<string>();
      const known = new Set<string>();
      todaysIncomes.forEach((tx) => {
        known.add(tx.id);
        if (!CALC_DESCRIPTIONS.has((tx.description || '').trim())) {
          initialChecked.add(tx.id);
        }
      });
      knownTxIdsRef.current = known;
      setCheckedIds(initialChecked);
      setHasCalculated(false);
      setResults({
        cashAmount: 0,
        qrAmount: 0,
        printingAmount: 0,
        salesAmount: 0,
        grandTotal: 0,
        hasActualCash: false,
      });
      return;
    }

    // Same date: only auto-check newly loaded/added non-calculator incomes
    setCheckedIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      todaysIncomes.forEach((tx) => {
        if (!knownTxIdsRef.current.has(tx.id)) {
          knownTxIdsRef.current.add(tx.id);
          if (!CALC_DESCRIPTIONS.has((tx.description || '').trim())) {
            next.add(tx.id);
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [selectedDate, todaysIncomes]);

  const toggleCheck = (id: string) => {
    const newSet = new Set(checkedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setCheckedIds(newSet);
  };

  const totalDayKhr = useMemo(() => {
    return todaysIncomes.reduce((acc, tx) => {
      if (CALC_DESCRIPTIONS.has((tx.description || '').trim())) return acc;
      const amountInKhr = tx.currency === 'USD' ? tx.amount * exchangeRate : tx.amount;
      return acc + amountInKhr;
    }, 0);
  }, [todaysIncomes, exchangeRate]);

  const totalCheckedKhr = useMemo(() => {
    return todaysIncomes.reduce((acc, tx) => {
      if (checkedIds.has(tx.id)) {
        const amountInKhr = tx.currency === 'USD' ? tx.amount * exchangeRate : tx.amount;
        return acc + amountInKhr;
      }
      return acc;
    }, 0);
  }, [todaysIncomes, checkedIds, exchangeRate]);

  const handleCalculate = () => {
    const cashVal = parseFloat(cash) || 0;
    const qrVal = parseFloat(qr) || 0;
    const actualVal = parseFloat(actualCash) || 0;
    const printingVal = totalCheckedKhr;
    const hasActual = actualCash.trim() !== '';

    // លុយរាប់ជាក់ស្តែង = សាច់ប្រាក់បង់ផ្ទាល់ + ចំណូលលក់ដូរ + ចំណូលបោះពុម្ព
    // => លុយលក់ដូរ = លុយរាប់ជាក់ស្តែង - សាច់ប្រាក់បង់ផ្ទាល់ - ចំណូលបោះពុម្ព
    const salesVal = hasActual ? actualVal - cashVal - printingVal : 0;
    const grandTotal = cashVal + qrVal + printingVal + (salesVal > 0 ? salesVal : 0);

    setResults({
      cashAmount: cashVal,
      qrAmount: qrVal,
      printingAmount: printingVal,
      salesAmount: salesVal,
      grandTotal,
      hasActualCash: hasActual,
    });
    setHasCalculated(true);
  };

  // Detect if each result item has already been inserted into Transactions for selectedDate
  const isAlreadyInserted = (desc: string) =>
    todaysIncomes.some((tx) => (tx.description || '').trim() === desc);

  const cashInserted = isAlreadyInserted('ប្រាក់បង់ផ្ទាល់');
  const qrInserted = isAlreadyInserted('ប្រាក់បង់តាម QR');
  const salesInserted = isAlreadyInserted('លុយលក់ដូរ');

  const insertableItems = useMemo(
    () => ({
      cash: {
        amount: results.cashAmount,
        categoryId: cashCategoryId || incomeCategories[0]?.id || '',
        description: 'ប្រាក់បង់ផ្ទាល់',
        inserted: cashInserted,
      },
      qr: {
        amount: results.qrAmount,
        categoryId: qrCategoryId || incomeCategories[0]?.id || '',
        description: 'ប្រាក់បង់តាម QR',
        inserted: qrInserted,
      },
      sales: {
        amount: results.salesAmount,
        categoryId: salesCategoryId || incomeCategories[0]?.id || '',
        description: 'លុយលក់ដូរ',
        inserted: salesInserted,
      },
    }),
    [results, cashCategoryId, qrCategoryId, salesCategoryId, incomeCategories, cashInserted, qrInserted, salesInserted]
  );

  const canInsertAny =
    hasCalculated &&
    (['cash', 'qr', 'sales'] as const).some((k) => insertableItems[k].amount > 0 && !insertableItems[k].inserted);

  const insertTransactions = async (keys: Array<'cash' | 'qr' | 'sales'>, mode: 'cash' | 'qr' | 'sales' | 'all') => {
    const targets = keys
      .map((k) => insertableItems[k])
      .filter((item) => item.amount > 0 && !item.inserted && item.categoryId);

    if (targets.length === 0) return;

    setInsertingKey(mode);
    try {
      const nowTime = getLocalTimeString(new Date());
      const baseTime = new Date(`${selectedDate}T${nowTime}:00`).getTime() || Date.now();
      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        await addTransaction({
          amount: item.amount,
          currency: 'KHR',
          type: 'income',
          categoryId: item.categoryId,
          date: selectedDate,
          time: nowTime,
          createdAt: baseTime + i,
          description: item.description,
        });
      }
    } catch (err) {
      console.error('Failed to insert transaction(s):', err);
      alert('មានបញ្ហាក្នុងការបញ្ចូលប្រតិបត្តិការ!');
    } finally {
      setInsertingKey(null);
    }
  };

  const categoryOptions = useMemo(
    () => incomeCategories.map((c) => ({ value: c.id, label: c.name })),
    [incomeCategories]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animation-fade-in">
      {/* Header / Back / DatePicker */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('apps')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">គណនាចំណូល</h2>
        </div>

        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
        {/* Top Section (CHECK - ចំណូលបោះពុម្ព / ចំណូលក្នុងប្រព័ន្ធ) */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">បញ្ជីចំណូលបោះពុម្ព (CHECK)</h3>
            {todaysIncomes.length > 0 && (
              <button
                onClick={() => setCheckedIds(new Set())}
                className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md transition-colors cursor-pointer"
              >
                ដកគ្រីស
              </button>
            )}
          </div>
          <div className="flex flex-col sm:items-end">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              សរុបបោះពុម្ពក្នុងថ្ងៃ: <span className="font-bold text-slate-700 dark:text-slate-300">{totalDayKhr.toLocaleString()} ៛</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              សរុបបានគ្រីស (បោះពុម្ព): <span className="font-bold text-emerald-500">{totalCheckedKhr.toLocaleString()} ៛</span>
            </div>
          </div>
        </div>

        <div className="mb-6 max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {todaysIncomes.length === 0 ? (
            <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
              មិនមានទិន្នន័យចំណូលសម្រាប់ថ្ងៃនេះទេ
            </div>
          ) : (
            todaysIncomes.map((tx) => {
              const isChecked = checkedIds.has(tx.id);
              const cat = categories.find((c) => c.id === tx.categoryId);
              const amountInKhr = tx.currency === 'USD' ? tx.amount * exchangeRate : tx.amount;
              const isCalcEntry = CALC_DESCRIPTIONS.has((tx.description || '').trim());

              return (
                <div
                  key={tx.id}
                  onClick={() => toggleCheck(tx.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className={`${isChecked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                      {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <div className="truncate flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                          {tx.description || cat?.name || 'ចំណូល'}
                        </span>
                        {isCalcEntry && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex-shrink-0">
                            បានបញ្ចូលរួច
                          </span>
                        )}
                      </div>
                      {tx.description && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {cat?.name || 'ចំណូល'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white pl-2 whitespace-nowrap">
                    {amountInKhr.toLocaleString()} ៛
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                ប្រាក់បង់ផ្ទាល់ (ពីសៀវភៅ)
              </label>
              <input
                type="number"
                step="any"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                ប្រាក់បង់តាម QR (ពីសៀវភៅ)
              </label>
              <input
                type="number"
                step="any"
                value={qr}
                onChange={(e) => setQr(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              លុយរាប់ជាក់ស្តែង (បង់ផ្ទាល់ + លក់ដូរ + បោះពុម្ព)
            </label>
            <input
              type="number"
              step="any"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="បញ្ចូលលុយសាច់ប្រាក់ដែលរាប់បានពេលយប់..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-3.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" />
          <span>គណនា</span>
        </button>

        {/* Results */}
        <div className="mt-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 sm:p-5 space-y-4 border border-slate-100 dark:border-slate-800">
          {/* 1. ប្រាក់បង់ផ្ទាល់ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[125px]">ប្រាក់បង់ផ្ទាល់:</span>
              {categoryOptions.length > 0 && (
                <CustomSelect<string>
                  value={cashCategoryId}
                  onChange={(val) => handleSelectCategory('cash', val)}
                  options={categoryOptions}
                  accentColor="emerald"
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 max-w-[160px]"
                />
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                {results.cashAmount.toLocaleString()} ៛
              </span>
              {hasCalculated && results.cashAmount > 0 && (
                cashInserted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>បានបញ្ចូល</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={insertingKey !== null}
                    onClick={() => insertTransactions(['cash'], 'cash')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{insertingKey === 'cash' ? 'កំពុងបញ្ចូល...' : 'បញ្ចូល'}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* 2. ប្រាក់បង់តាម QR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[125px]">ប្រាក់បង់តាម QR:</span>
              {categoryOptions.length > 0 && (
                <CustomSelect<string>
                  value={qrCategoryId}
                  onChange={(val) => handleSelectCategory('qr', val)}
                  options={categoryOptions}
                  accentColor="emerald"
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 max-w-[160px]"
                />
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="font-extrabold text-sky-600 dark:text-sky-400 text-base">
                {results.qrAmount.toLocaleString()} ៛
              </span>
              {hasCalculated && results.qrAmount > 0 && (
                qrInserted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>បានបញ្ចូល</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={insertingKey !== null}
                    onClick={() => insertTransactions(['qr'], 'qr')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{insertingKey === 'qr' ? 'កំពុងបញ្ចូល...' : 'បញ្ចូល'}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* 3. ចំណូលបោះពុម្ព (Already in transactions — NO insert button) */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300">ចំណូលបោះពុម្ព:</span>
              <span className="ml-2 text-[11px] text-slate-400 dark:text-slate-500">(មានក្នុងប្រតិបត្តិការស្រាប់)</span>
            </div>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-base">
              {results.printingAmount.toLocaleString()} ៛
            </span>
          </div>

          {/* 4. លុយលក់ដូរ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[125px]">លុយលក់ដូរ:</span>
              {categoryOptions.length > 0 && (
                <CustomSelect<string>
                  value={salesCategoryId}
                  onChange={(val) => handleSelectCategory('sales', val)}
                  options={categoryOptions}
                  accentColor="emerald"
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 max-w-[160px]"
                />
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span
                className={`font-extrabold text-base ${
                  results.salesAmount < 0
                    ? 'text-rose-500'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {results.salesAmount.toLocaleString()} ៛
              </span>
              {hasCalculated && results.salesAmount > 0 && (
                salesInserted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>បានបញ្ចូល</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={insertingKey !== null}
                    onClick={() => insertTransactions(['sales'], 'sales')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{insertingKey === 'sales' ? 'កំពុងបញ្ចូល...' : 'បញ្ចូល'}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Discrepancy warning if actualCash < cash + printing */}
          {hasCalculated && results.hasActualCash && results.salesAmount < 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                លុយរាប់ជាក់ស្តែងតិចជាង (ប្រាក់បង់ផ្ទាល់ + ចំណូលបោះពុម្ព) ចំនួន{' '}
                {Math.abs(results.salesAmount).toLocaleString()} ៛។ សូមពិនិត្យតួលេខឡើងវិញ!
              </span>
            </div>
          )}

          {hasCalculated && !results.hasActualCash && (
            <div className="text-xs text-slate-400 dark:text-slate-500 italic">
              * មិនទាន់បានបញ្ចូល «លុយរាប់ជាក់ស្តែង» ទេ ដូច្នេះ «លុយលក់ដូរ» បង្ហាញ 0 ៛។
            </div>
          )}

          {/* 5. ចំណូលសរុបប្រចាំថ្ងៃ */}
          <div className="flex justify-between items-center pt-1">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
              ចំណូលសរុបប្រចាំថ្ងៃ:
            </span>
            <span className="font-black text-slate-900 dark:text-white text-xl">
              {results.grandTotal.toLocaleString()} ៛
            </span>
          </div>

          {/* Insert All Button */}
          {canInsertAny && (
            <button
              type="button"
              disabled={insertingKey !== null}
              onClick={() => insertTransactions(['cash', 'qr', 'sales'], 'all')}
              className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>
                {insertingKey === 'all'
                  ? 'កំពុងបញ្ចូលទៅប្រតិបត្តិការ...'
                  : 'បញ្ចូលលទ្ធផលទាំងអស់ទៅប្រតិបត្តិការ'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
