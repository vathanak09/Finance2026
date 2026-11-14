import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, LogOut, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal }) => {
  const { activeTab, currentUser, logout, setActiveTab } = useFinance();

  const titles: Record<string, { title: string; desc: string }> = {
    dashboard: { title: 'ផ្ទាំងគ្រប់គ្រងសង្ខេប', desc: 'ទិដ្ឋភាពរួមនៃស្ថានភាពចំណូលចំណាយរបស់អ្នក' },
    transactions: { title: 'ប្រតិបត្តិការហិរញ្ញវត្ថុ', desc: 'គ្រប់គ្រង និងស្វែងរកបញ្ជីប្រតិបត្តិការទាំងអស់' },
    reports: { title: 'របាយការណ៍ហិរញ្ញវត្ថុ', desc: 'របាយការណ៍បោះពុម្ព និងការវិភាគទិន្នន័យ (Printable Canvas)' },
    budgets: { title: 'គ្រប់គ្រងថវិកា', desc: 'កំណត់ និងតាមដានកម្រិតចំណាយតាមប្រភេទ' },
    apps: { title: 'កម្មវិធី', desc: 'កម្មវិធី និងឧបករណ៍ហិរញ្ញវត្ថុបន្ថែម' },
    income_calculator: { title: 'គណនាចំណូល', desc: 'ផ្ទៀងផ្ទាត់ និងគណនាចំណូលប្រចាំថ្ងៃ' },
    settings: { title: 'ការកំណត់កម្មវិធី', desc: 'កំណត់គណនី រូបិយប័ណ្ណ រូបរាង និងកំណត់ត្រាសកម្មភាព' }
  };

  const currentInfo = titles[activeTab] || titles.dashboard;

  const handleLogout = async () => {
    if (confirm('តើអ្នកចង់ចាកចេញពីគណនីនេះមែនទេ?')) {
      await logout();
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 glass-panel sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center space-x-2.5 min-w-0">
          <img src="/icon.svg" alt="Logo" className="w-8 h-8 rounded-xl shadow-sm flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{currentInfo.title}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {currentUser && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              title="ការកំណត់គណនី"
            >
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              )}
              <span className="max-w-[90px] truncate">{currentUser.displayName}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/50 cursor-pointer"
            title="ចាកចេញ (Logout)"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-10 py-6 glass-panel sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{currentInfo.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentInfo.desc}</p>
        </div>

        <div className="flex items-center space-x-3">
          {currentUser && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="ការកំណត់គណនី"
            >
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <User className="w-4 h-4 text-blue-500" />
              )}
              <span>{currentUser.displayName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                {currentUser.role === 'admin' ? 'Admin' : 'សមាជិក'}
              </span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>បន្ថែមប្រតិបត្តិការ</span>
          </button>
        </div>
      </header>
    </>
  );
};
