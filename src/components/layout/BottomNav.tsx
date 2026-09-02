import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { LayoutDashboard, Receipt, BarChart3, LayoutGrid, Settings } from 'lucide-react';
import type { TabType } from '../../types/finance';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'ផ្ទាំងដើម', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'transactions', label: 'ប្រតិបត្តិការ', icon: <Receipt className="w-5 h-5" /> },
    { id: 'reports', label: 'របាយការណ៍', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'apps', label: 'កម្មវិធី', icon: <LayoutGrid className="w-5 h-5" /> },
    { id: 'settings', label: 'ការកំណត់', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full glass-panel border-t border-slate-200 dark:border-slate-800 flex justify-around items-center p-2 z-40 pb-safe">
      {navItems.map((item) => {
        const isActive = activeTab === item.id || (item.id === 'apps' && (activeTab === 'budgets' || activeTab === 'income_calculator'));
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center py-2 px-3 transition-all cursor-pointer ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-110'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
