import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, FileText, ArrowUpRight, ArrowDownLeft, Edit2, Trash2, Tag, DollarSign, Clock } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { Transaction } from '../../types/finance';
import { CategoryBadge } from '../../utils/categoryIcons';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onEdit,
}) => {
  const { categories, deleteTransaction, exchangeRate } = useFinance();

  if (!isOpen || !transaction) return null;

  const cat = categories.find((c) => c.id === transaction.categoryId) || {
    id: 'unknown',
    name: 'ផ្សេងៗ',
    color: '#94a3b8',
    icon: 'tag',
    type: transaction.type
  };

  const isInc = transaction.type === 'income';

  // Amount formatting
  const mainAmountStr = transaction.currency === 'USD'
    ? `$${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${transaction.amount.toLocaleString()} ៛`;

  const convertedAmountStr = transaction.currency === 'USD'
    ? `${(transaction.amount * exchangeRate).toLocaleString()} ៛`
    : `$${(transaction.amount / exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

  const handleDelete = async () => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបប្រតិបត្តិការនេះមែនទេ?')) {
      await deleteTransaction(transaction.id);
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative z-[111] border border-slate-200 dark:border-slate-800 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${isInc ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
              {isInc ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <span>ព័ត៌មានលម្អិតនៃប្រតិបត្តិការ</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Amount Section */}
        <div className={`p-4 sm:p-5 rounded-2xl border text-center relative overflow-hidden ${
          isInc 
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300'
        }`}>
          <div className="flex items-center justify-center space-x-1.5 mb-1">
            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              isInc 
                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
            }`}>
              {isInc ? 'ចំណូល (Income)' : 'ចំណាយ (Expense)'}
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black tracking-tight my-1.5">
            {isInc ? '+' : '-'}{mainAmountStr}
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-1">
            <span>ប្រហាក់ប្រហែល៖</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{convertedAmountStr}</span>
          </div>
        </div>

        {/* Transaction Details List */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* Category Item */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5">
              <Tag className="w-4 h-4 text-slate-400" />
              <span>ប្រភេទ (Category)</span>
            </span>
            <div className="flex items-center space-x-2">
              <CategoryBadge color={cat.color} icon={cat.icon} size="xs" />
              <span className="font-bold text-slate-900 dark:text-white">{cat.name}</span>
            </div>
          </div>

          <div className="h-px bg-slate-200/60 dark:bg-slate-800" />

          {/* Date & Time Item */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>កាលបរិច្ឆេទ & ម៉ោង</span>
            </span>
            <div className="text-right">
              <span className="font-bold text-slate-900 dark:text-white font-mono">{transaction.date}</span>
              <span className="ml-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-bold">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>{formatTime12(transaction.time)}</span>
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-200/60 dark:bg-slate-800" />

          {/* Currency Item */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span>រូបិយប័ណ្ណដើម (Currency)</span>
            </span>
            <span className="font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-mono text-xs">
              {transaction.currency}
            </span>
          </div>

          <div className="h-px bg-slate-200/60 dark:bg-slate-800" />

          {/* Description Item */}
          <div className="space-y-1 text-xs sm:text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>ការពិពណ៌នា (Description)</span>
            </span>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-normal leading-relaxed text-xs">
              {transaction.description?.trim() ? transaction.description : 'គ្មានការពិពណ៌នាឡើយ (No Description)'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onEdit(transaction)}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-98"
          >
            <Edit2 className="w-4 h-4" />
            <span>កែប្រែ (Edit)</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-98"
          >
            <Trash2 className="w-4 h-4" />
            <span>លុប (Delete)</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
