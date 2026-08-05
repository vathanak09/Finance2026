import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { FileSpreadsheet, Moon, Sun, Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { CategoryModal } from './CategoryModal';
import type { Category } from '../../types/finance';
import { CategoryIcon, CategoryBadge } from '../../utils/categoryIcons';

export const SettingsTab: React.FC = () => {
  const { transactions, categories, deleteCategory, exchangeRate, setExchangeRate, isDarkMode, setIsDarkMode } = useFinance();
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបចំណាត់ថ្នាក់នេះមែនទេ? (វានឹងមិនលុបប្រតិបត្តិការចាស់ៗទេ)')) {
      await deleteCategory(id);
    }
  };

  const handleExportExcel = () => {
    if (transactions.length === 0) return alert('មិនមានប្រតិបត្តិការដើម្បីនាំចេញឡើយ!');

    const data = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ' };
      return {
        'កាលបរិច្ឆេទ': t.date,
        'ប្រភេទ': cat.name,
        'លំហូរ': t.type === 'income' ? 'ចំណូល (+)' : 'ចំណាយ (-)',
        'ចំនួនទឹកប្រាក់': t.amount,
        'រូបិយប័ណ្ណ': t.currency,
        'ការពិពណ៌នា': t.description || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ប្រតិបត្តិការទាំងអស់");
    XLSX.writeFile(wb, `FinanceBook_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Exchange Rate Card */}
      <div className="glass-panel p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 relative">
        <h4 className="font-bold text-lg text-slate-900 dark:text-white">អត្រាប្តូរប្រាក់ (Exchange Rate)</h4>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">$1 USD =</span>
          <input
            type="number"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(Number(e.target.value))}
            className="w-36 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-base font-extrabold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">៛ KHR</span>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="glass-panel p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 relative">
        <h4 className="font-bold text-lg text-slate-900 dark:text-white">រូបរាងកម្មវិធី (Appearance)</h4>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Dark Mode / Light Mode</span>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl text-sm border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </div>

      {/* Category Management */}
      <div className="glass-panel p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 relative">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-500" />
            <span>គ្រប់គ្រងចំណាត់ថ្នាក់ (Categories)</span>
          </h4>
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមថ្មី</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Income Categories */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ចំណូល (Income)</h5>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {categories.filter(c => c.type === 'income').map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <CategoryBadge color={cat.color} icon={cat.icon} size="md" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditCategory(cat)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500 cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Expense Categories */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ចំណាយ (Expense)</h5>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {categories.filter(c => c.type === 'expense').map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-rose-200 dark:hover:border-rose-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <CategoryBadge color={cat.color} icon={cat.icon} size="md" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditCategory(cat)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500 cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Export Card */}
      <div className="glass-panel p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 relative">
        <h4 className="font-bold text-lg text-slate-900 dark:text-white">ទាញយកទិន្នន័យ (Export Data)</h4>
        <button
          onClick={handleExportExcel}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>ទាញយកទិន្នន័យជា Excel (.xlsx)</span>
        </button>
      </div>

      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        editingCategory={editingCategory}
      />
    </div>
  );
};
