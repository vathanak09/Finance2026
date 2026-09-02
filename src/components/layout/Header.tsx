import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal }) => {
  const { activeTab } = useFinance();

  const titles: Record<string, { title: string; desc: string }> = {
    dashboard: { title: 'ផ្ទាំងគ្រប់គ្រងសង្ខេប', desc: 'ទិដ្ឋភាពរួមនៃស្ថានភាពចំណូលចំណាយរបស់អ្នក' },
    transactions: { title: 'ប្រតិបត្តិការហិរញ្ញវត្ថុ', desc: 'គ្រប់គ្រង និងស្វែងរកបញ្ជីប្រតិបត្តិការទាំងអស់' },
    reports: { title: 'របាយការណ៍ហិរញ្ញវត្ថុ', desc: 'របាយការណ៍បោះពុម្ព និងការវិភាគទិន្នន័យ (Printable Canvas)' },
    budgets: { title: 'គ្រប់គ្រងថវិកា', desc: 'កំណត់ និងតាមដានកម្រិតចំណាយតាមប្រភេទ' },
    apps: { title: 'កម្មវិធី', desc: 'កម្មវិធី និងឧបករណ៍ហិរញ្ញវត្ថុបន្ថែម' },
    income_calculator: { title: 'គណនាចំណូល', desc: 'ផ្ទៀងផ្ទាត់ និងគណនាចំណូលប្រចាំថ្ងៃ' },
    settings: { title: 'ការកំណត់កម្មវិធី', desc: 'កំណត់រូបិយប័ណ្ណ រូបរាង និងការទាញយកទិន្នន័យ' }
  };

  const currentInfo = titles[activeTab] || titles.dashboard;

  return (
    <header className="hidden md:flex items-center justify-between px-10 py-6 glass-panel sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{currentInfo.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{currentInfo.desc}</p>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onOpenAddModal}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>បន្ថែមប្រតិបត្តិការ</span>
        </button>
      </div>
    </header>
  );
};
