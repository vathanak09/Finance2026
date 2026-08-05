import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Trash2, Edit3, Wallet, Calendar } from 'lucide-react';
import { BudgetModal } from './BudgetModal';
import type { Budget } from '../../types/finance';

export const BudgetsTab: React.FC = () => {
  const { budgets, transactions, categories, deleteBudget, exchangeRate, setEditingBudget, editingBudget } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-xl text-slate-900 dark:text-white">បញ្ជីថវិកាដែលបានកំណត់ (Budgets)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">សរុប {budgets.length} កញ្ចប់ថវិកា</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2.5 bg-[#00a884] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>កំណត់ថវិកាថ្មី</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {budgets.length === 0 ? (
          <div className="col-span-2 p-12 text-center glass-panel rounded-3xl space-y-3">
            <Wallet className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              អ្នកមិនទាន់បានកំណត់ថវិកាឡើយ! ចុចប៊ូតុងខាងលើដើម្បីបង្កើតថវិកាដំបូង។
            </p>
          </div>
        ) : (
          budgets.map((b) => {
            const catIds = b.categoryIds || (b.categoryId ? [b.categoryId] : ['all']);
            const isAllCategories = catIds.includes('all') || catIds.length === 0;

            const matchedCatNames = isAllCategories
              ? ['គ្រប់ប្រភេទទាំងអស់']
              : categories.filter(c => catIds.includes(c.id)).map(c => c.name);

            // Compute spent amount within budget date range and categories
            let spentKHR = 0;
            transactions.forEach(t => {
              if (t.type !== 'expense') return;

              // Date range check if exists
              if (b.startDate && t.date < b.startDate) return;
              if (b.endDate && t.date > b.endDate) return;

              // Category check
              const isMatchCategory = isAllCategories || catIds.includes(t.categoryId);
              if (isMatchCategory) {
                const amt = t.currency === 'KHR' ? t.amount : t.amount * exchangeRate;
                spentKHR += amt;
              }
            });

            const limitKHR = b.currency === 'KHR' ? b.limitAmount : b.limitAmount * exchangeRate;
            const percent = Math.min(Math.round((spentKHR / (limitKHR || 1)) * 100), 100);
            const isExceeded = spentKHR > limitKHR;

            return (
              <div 
                key={b.id} 
                className="p-6 rounded-3xl glass-panel shadow-xl space-y-4 hover:border-emerald-300 dark:hover:border-slate-700 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{b.name}</h4>
                    
                    {/* Category Tags */}
                    <div className="flex flex-wrap gap-1">
                      {matchedCatNames.slice(0, 3).map((name, i) => (
                        <span 
                          key={i} 
                          className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                        >
                          {name}
                        </span>
                      ))}
                      {matchedCatNames.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          +{matchedCatNames.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Date Range */}
                    {(b.startDate || b.endDate) && (
                      <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono pt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDateShort(b.startDate)} - {formatDateShort(b.endDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(b)}
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all cursor-pointer"
                      title="កែប្រែថវិកា"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('តើអ្នកចង់លុបថវិកានេះមែនទេ?')) deleteBudget(b.id);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="លុបថវិកា"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-600 dark:text-slate-400">
                      ប្រើប្រាស់អស់៖ <span className="font-bold text-slate-900 dark:text-slate-200">{spentKHR.toLocaleString()} ៛</span>
                    </span>
                    <span className={isExceeded ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                      {percent}% / {limitKHR.toLocaleString()} ៛
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded ? 'bg-gradient-to-r from-rose-500 to-rose-400 shadow-rose-500/50' : percent > 80 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                {b.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    {b.description}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <BudgetModal 
        isOpen={isModalOpen || Boolean(editingBudget)} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }} 
      />
    </div>
  );
};
