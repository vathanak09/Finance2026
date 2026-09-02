import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { FloatingAddButton } from './components/layout/FloatingAddButton';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { TransactionsTab } from './components/transactions/TransactionsTab';
import { ReportsTab } from './components/reports/ReportsTab';
import { BudgetsTab } from './components/budgets/BudgetsTab';
import { AppsTab } from './components/apps/AppsTab';
import { IncomeCalculator } from './components/apps/IncomeCalculator';
import { SettingsTab } from './components/settings/SettingsTab';
import { TransactionModal } from './components/transactions/TransactionModal';
import { TransactionDetailModal } from './components/transactions/TransactionDetailModal';

const MainContent: React.FC = () => {
  const { activeTab, viewingTransaction, setViewingTransaction, setEditingTransaction } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-200 font-sans relative">
      {/* Background Soft Gradients (Hardware-accelerated, no heavy repaint loop) */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full filter blur-[90px] pointer-events-none z-0"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full filter blur-[90px] pointer-events-none z-0"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full filter blur-[90px] pointer-events-none z-0"></div>
      
      <div className="z-10 flex flex-col md:flex-row w-full h-full relative">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-24 md:pb-0 relative" id="main-scroll-area">
          <Header onOpenAddModal={() => setIsAddModalOpen(true)} />

          <div className="flex-1 p-3 md:p-4 pb-24 md:pb-8">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'transactions' && <TransactionsTab />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'apps' && <AppsTab />}
            {activeTab === 'budgets' && <BudgetsTab />}
            {activeTab === 'income_calculator' && <IncomeCalculator />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </main>

        <BottomNav />
        <FloatingAddButton onClick={() => setIsAddModalOpen(true)} />
        <TransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        <TransactionDetailModal
          isOpen={Boolean(viewingTransaction)}
          transaction={viewingTransaction}
          onClose={() => setViewingTransaction(null)}
          onEdit={(tx) => {
            setViewingTransaction(null);
            setEditingTransaction(tx);
          }}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainContent />
    </FinanceProvider>
  );
}
