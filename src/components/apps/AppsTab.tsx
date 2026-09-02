import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Wallet, ChevronRight } from 'lucide-react';

export const AppsTab: React.FC = () => {
  const { setActiveTab } = useFinance();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animation-fade-in pb-10">
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">កម្មវិធីហិរញ្ញវត្ថុទាំងអស់</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Budget App Item */}
          <button
            onClick={() => setActiveTab('budgets')}
            className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md cursor-pointer group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            
            <div className="ml-4 flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">គ្រប់គ្រងថវិកា</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">កំណត់ និងតាមដានកម្រិតចំណាយប្រចាំខែរបស់អ្នក</p>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
          </button>
          
          {/* Income Calculator App Item */}
          <button
            onClick={() => setActiveTab('income_calculator')}
            className="flex items-center p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md cursor-pointer group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="10" x2="16" y2="10.01"></line><line x1="12" y1="10" x2="12" y2="10.01"></line><line x1="8" y1="10" x2="8" y2="10.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>
            </div>
            
            <div className="ml-4 flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">គណនាចំណូល</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">គណនាប្រាក់លក់រាយប្រចាំថ្ងៃ ផ្ទាល់និង QR</p>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
          </button>
          
          {/* Future apps can be added here */}

        </div>
      </div>
    </div>
  );
};
