import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { LayoutDashboard, Receipt, BarChart3, LayoutGrid, Settings, Download } from 'lucide-react';
import type { TabType } from '../../types/finance';
import { PWAInstallModal } from '../common/PWAInstallModal';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'ផ្ទាំងគ្រប់គ្រង', icon: <LayoutDashboard className="text-xl w-6" /> },
    { id: 'transactions', label: 'ប្រតិបត្តិការ', icon: <Receipt className="text-xl w-6" /> },
    { id: 'reports', label: 'របាយការណ៍', icon: <BarChart3 className="text-xl w-6" /> },
    { id: 'apps', label: 'កម្មវិធី', icon: <LayoutGrid className="text-xl w-6" /> },
    { id: 'settings', label: 'ការកំណត់', icon: <Settings className="text-xl w-6" /> }
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col w-72 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/80 dark:border-slate-800/80 m-4 rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex-shrink-0 transition-colors">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none"></div>
        
        <div className="flex items-center space-x-3 mb-8 relative z-10 p-3 pt-4">
          <img 
            src="/icon.svg" 
            alt="Logo" 
            className="w-12 h-12 rounded-2xl shadow-lg shadow-emerald-500/25 object-contain" 
          />
          <div>
            <h1 className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-snug">សៀវភៅហិរញ្ញវត្ថុ</h1>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-widest uppercase">Smart Finance</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 relative z-10 px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === 'apps' && (activeTab === 'budgets' || activeTab === 'income_calculator'));
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-medium hover:scale-[1.02]'
                }`}
              >
                <div className={isActive ? 'animate-pulse' : ''}>{item.icon}</div>
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Install Shortcut App Button */}
        <div className="p-3 relative z-10 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition-all border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>ដំឡើង App (Install App)</span>
          </button>
        </div>
      </aside>

      <PWAInstallModal 
        isOpen={isInstallModalOpen} 
        onClose={() => setIsInstallModalOpen(false)} 
      />
    </>
  );
};
