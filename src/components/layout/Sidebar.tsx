import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { LayoutDashboard, Receipt, BarChart3, Wallet, Settings, Wallet2 } from 'lucide-react';
import type { TabType } from '../../types/finance';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'ផ្ទាំងគ្រប់គ្រង', icon: <LayoutDashboard className="text-xl w-6" /> },
    { id: 'transactions', label: 'ប្រតិបត្តិការ', icon: <Receipt className="text-xl w-6" /> },
    { id: 'reports', label: 'របាយការណ៍', icon: <BarChart3 className="text-xl w-6" /> },
    { id: 'budgets', label: 'ថវិកា', icon: <Wallet className="text-xl w-6" /> },
    { id: 'settings', label: 'ការកំណត់', icon: <Settings className="text-xl w-6" /> }
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800/80 m-4 rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex-shrink-0 transition-colors">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>
      
      <div className="flex items-center space-x-3 mb-10 relative z-10 p-2">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Wallet2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">សៀវភៅហិរញ្ញវត្ថុ</h1>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase">Smart Finance</p>
        </div>
      </div>

      <nav className="flex-1 space-y-3 relative z-10 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-medium hover:scale-[1.02]'
              }`}
            >
              <div className={isActive ? 'animate-pulse' : ''}>{item.icon}</div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
