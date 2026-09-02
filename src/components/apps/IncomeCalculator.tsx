import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';

export const IncomeCalculator: React.FC = () => {
  const { setActiveTab, transactions, categories, exchangeRate } = useFinance();
  
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString(new Date()));
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  
  const [cash, setCash] = useState<string>('');
  const [qr, setQr] = useState<string>('');
  const [actualCash, setActualCash] = useState<string>('');

  const [results, setResults] = useState({
    totalSales: 0,
    cashAmount: 0,
    qrAmount: 0,
  });

  const todaysIncomes = useMemo(() => {
    return transactions.filter(tx => tx.type === 'income' && tx.date === selectedDate);
  }, [transactions, selectedDate]);

  // Check all by default when date changes
  useEffect(() => {
    const allIds = new Set(transactions.filter(tx => tx.type === 'income' && tx.date === selectedDate).map(tx => tx.id));
    setCheckedIds(allIds);
  }, [selectedDate, transactions.length]);

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
    
    setResults({
      totalSales: totalCheckedKhr,
      cashAmount: cashVal,
      qrAmount: qrVal
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animation-fade-in">
      {/* Header / Back / DatePicker */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setActiveTab('apps')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
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
        
        {/* Top Section (CHECK) */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">បញ្ជីចំណូល (CHECK)</h3>
            {todaysIncomes.length > 0 && (
              <button 
                onClick={() => setCheckedIds(new Set())}
                className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md transition-colors"
              >
                ដកគ្រីស
              </button>
            )}
          </div>
          <div className="flex flex-col sm:items-end">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              សរុបប្រចាំថ្ងៃ: <span className="font-bold text-slate-700 dark:text-slate-300">{totalDayKhr.toLocaleString()} ៛</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              សរុបបានគ្រីស: <span className="font-bold text-emerald-500">{totalCheckedKhr.toLocaleString()} ៛</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6 max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {todaysIncomes.length === 0 ? (
            <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
              មិនមានទិន្នន័យចំណូលសម្រាប់ថ្ងៃនេះទេ
            </div>
          ) : (
            todaysIncomes.map(tx => {
              const isChecked = checkedIds.has(tx.id);
              const cat = categories.find(c => c.id === tx.categoryId);
              const amountInKhr = tx.currency === 'USD' ? tx.amount * exchangeRate : tx.amount;
              
              return (
                <div 
                  key={tx.id} 
                  onClick={() => toggleCheck(tx.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 hover:border-emerald-300'}`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className={`${isChecked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                      {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <div className="truncate flex flex-col">
                       <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{tx.description || cat?.name || 'ចំណូល'}</span>
                       {tx.description && <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{cat?.name || 'ចំណូល'}</span>}
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
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">បង់ផ្ទាល់</label>
              <input 
                type="number" 
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">បង់តាម QR</label>
              <input 
                type="number" 
                value={qr}
                onChange={(e) => setQr(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">លុយរាប់ជាក់ស្តែង</label>
            <input 
              type="number" 
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="មិនមាន"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <button 
          onClick={handleCalculate}
          className="w-full mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl py-3.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          គណនា
        </button>

        {/* Results */}
        <div className="mt-6 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800/60">
            <span className="font-bold text-slate-700 dark:text-slate-300">លុយលក់ថ្ងៃនេះ:</span>
            <span className="font-bold text-slate-900 dark:text-white text-lg">{results.totalSales.toLocaleString()} ៛</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-700 dark:text-slate-300">លុយបង់ផ្ទាល់:</span>
            <span className="font-bold text-rose-500">{results.cashAmount.toLocaleString()} ៛</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-700 dark:text-slate-300">លុយបង់តាម QR:</span>
            <span className="font-bold text-rose-500">{results.qrAmount.toLocaleString()} ៛</span>
          </div>
        </div>

      </div>
    </div>
  );
};
