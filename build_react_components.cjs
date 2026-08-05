const fs = require('fs');
const path = require('path');

const baseDir = __dirname;

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Folders
ensureDir(path.join(baseDir, 'src', 'types'));
ensureDir(path.join(baseDir, 'src', 'services'));
ensureDir(path.join(baseDir, 'src', 'context'));
ensureDir(path.join(baseDir, 'src', 'components', 'layout'));
ensureDir(path.join(baseDir, 'src', 'components', 'dashboard'));
ensureDir(path.join(baseDir, 'src', 'components', 'transactions'));
ensureDir(path.join(baseDir, 'src', 'components', 'reports'));
ensureDir(path.join(baseDir, 'src', 'components', 'budgets'));
ensureDir(path.join(baseDir, 'src', 'components', 'settings'));
ensureDir(path.join(baseDir, 'src', 'components', 'pwa'));
ensureDir(path.join(baseDir, 'public', 'icons'));

// 1. src/types/finance.ts
fs.writeFileSync(path.join(baseDir, 'src', 'types', 'finance.ts'), `
export type Currency = 'USD' | 'KHR';
export type TransactionType = 'income' | 'expense';
export type TabType = 'dashboard' | 'transactions' | 'reports' | 'budgets' | 'settings';

export interface Transaction {
  id: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  categoryId: string;
  date: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Budget {
  id: string;
  name: string;
  categoryId: string;
  limitAmount: number;
  currency: Currency;
  startDate: string;
  endDate: string;
  description?: string;
}
`);

// 2. src/services/firebase.ts
fs.writeFileSync(path.join(baseDir, 'src', 'services', 'firebase.ts'), `
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdSd3fW5TfEus56E3L1LzAc1C5s0p9PHw",
  authDomain: "finance-record-vathanak.firebaseapp.com",
  projectId: "finance-record-vathanak",
  storageBucket: "finance-record-vathanak.firebasestorage.app",
  messagingSenderId: "355419681968",
  appId: "1:355419681968:web:d1bf2577f1aa3662eef775",
  measurementId: "G-6VNCXB5K16"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
`);

// 3. src/context/FinanceContext.tsx
fs.writeFileSync(path.join(baseDir, 'src', 'context', 'FinanceContext.tsx'), `
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, Category, Budget, TabType } from '../types/finance';
import { db } from '../services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (bg: Omit<Budget, 'id'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getDayOnly: (dateStr: string) => string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const defaultCategories: Category[] = [
  { id: 'cat_food', name: 'អាហារ និងភេសជ្ជៈ', type: 'expense', icon: 'utensils', color: 'from-amber-400 to-amber-600' },
  { id: 'cat_salary', name: 'ប្រាក់ខែ', type: 'income', icon: 'wallet', color: 'from-emerald-400 to-emerald-600' },
  { id: 'cat_transport', name: 'ការធ្វើដំណើរ', type: 'expense', icon: 'car', color: 'from-blue-400 to-blue-600' },
  { id: 'cat_business', name: 'ប្រាក់ចំណេញអាជីវកម្ម', type: 'income', icon: 'chart-line', color: 'from-teal-400 to-teal-600' },
  { id: 'cat_bills', name: 'ទឹក ភ្លើង និងអ៊ីនធឺណិត', type: 'expense', icon: 'lightbulb', color: 'from-purple-400 to-purple-600' },
  { id: 'cat_shopping', name: 'ការទិញទំនិញ', type: 'expense', icon: 'bag-shopping', color: 'from-pink-400 to-pink-600' },
  { id: 'cat_other_exp', name: 'ចំណាយផ្សេងៗ', type: 'expense', icon: 'receipt', color: 'from-rose-400 to-rose-600' }
];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [exchangeRate, setExchangeRate] = useState<number>(4000);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const docs: Transaction[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          amount: Number(d.amount || 0),
          currency: d.currency || 'USD',
          type: d.type || 'expense',
          categoryId: d.categoryId || d.category_id || 'cat_other_exp',
          date: d.date || new Date().toISOString().split('T')[0],
          description: d.description || ''
        };
      });
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(docs);
    });

    const unsubCat = onSnapshot(collection(db, 'categories'), (snapshot) => {
      if (!snapshot.empty) {
        const docs: Category[] = snapshot.docs.map(docSnap => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name,
            type: d.type,
            icon: d.icon || 'tag',
            color: d.color || 'from-slate-400 to-slate-600'
          };
        });
        setCategories(docs);
      }
    });

    const unsubBg = onSnapshot(collection(db, 'budgets'), (snapshot) => {
      const docs: Budget[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name,
          categoryId: d.categoryId || d.category_id,
          limitAmount: Number(d.limitAmount || d.limit_amount || 0),
          currency: d.currency || 'USD',
          startDate: d.startDate || d.start_date,
          endDate: d.endDate || d.end_date,
          description: d.description
        };
      });
      setBudgets(docs);
    });

    return () => {
      unsubTx();
      unsubCat();
      unsubBg();
    };
  }, []);

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    await addDoc(collection(db, 'transactions'), tx);
  };

  const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
    await updateDoc(doc(db, 'transactions', id), tx);
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  const addBudget = async (bg: Omit<Budget, 'id'>) => {
    await addDoc(collection(db, 'budgets'), bg);
  };

  const deleteBudget = async (id: string) => {
    await deleteDoc(doc(db, 'budgets', id));
  };

  const getDayOnly = (dateStr: string): string => {
    if (!dateStr) return '--';
    const parts = dateStr.split(/[-./]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return String(parseInt(parts[2], 10));
      return String(parseInt(parts[0], 10));
    }
    return dateStr;
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      categories,
      budgets,
      activeTab,
      setActiveTab,
      isDarkMode,
      setIsDarkMode,
      exchangeRate,
      setExchangeRate,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      deleteBudget,
      getDayOnly
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
`);

// 4. src/components/layout/Sidebar.tsx
fs.writeFileSync(path.join(baseDir, 'src', 'components', 'layout', 'Sidebar.tsx'), `
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { LayoutDashboard, Receipt, BarChart3, Wallet, Settings, Wallet2 } from 'lucide-react';
import { TabType } from '../../types/finance';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'ផ្ទាំងគ្រប់គ្រង', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'transactions', label: 'ប្រតិបត្តិការ', icon: <Receipt className="w-5 h-5" /> },
    { id: 'reports', label: 'របាយការណ៍', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'budgets', label: 'ថវិកា', icon: <Wallet className="w-5 h-5" /> },
    { id: 'settings', label: 'ការកំណត់', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white p-6 space-y-8 flex-shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Wallet2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">សៀវភៅហិរញ្ញវត្ថុ</h1>
          <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">React Smart Finance</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={\`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 \${
              activeTab === item.id
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }\`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 text-xs space-y-1">
        <p className="text-slate-400">ស្ថានភាព Sync: <span className="text-emerald-400 font-bold">Online 🔥</span></p>
        <p className="text-slate-500 text-[10px]">Firebase Realtime Connected</p>
      </div>
    </aside>
  );
};
`);

// 5. src/components/layout/Header.tsx
fs.writeFileSync(path.join(baseDir, 'src', 'components', 'layout', 'Header.tsx'), `
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Sun, Moon, Plus } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal }) => {
  const { isDarkMode, setIsDarkMode, activeTab } = useFinance();

  const titles: Record<string, { title: string; desc: string }> = {
    dashboard: { title: 'ផ្ទាំងគ្រប់គ្រងសង្ខេប', desc: 'ទិន្នន័យរួមនៃស្ថានភាពចំណូលចំណាយរបស់អ្នក' },
    transactions: { title: 'ប្រតិបត្តិការហិរញ្ញវត្ថុ', desc: 'គ្រប់គ្រង និងស្វែងរកបញ្ជីប្រតិបត្តិការទាំងអស់' },
    reports: { title: 'របាយការណ៍ហិរញ្ញវត្ថុ', desc: 'របាយការណ៍បោះពុម្ព និងការវិភាគទិន្នន័យ (Printable Canvas)' },
    budgets: { title: 'គ្រប់គ្រងថវិកា', desc: 'កំណត់ និងតាមដានកម្រិតចំណាយតាមប្រភេទ' },
    settings: { title: 'ការកំណត់កម្មវិធី', desc: 'កំណត់រូបិយប័ណ្ណ រូបរាង និងការទាញយកទិន្នន័យ' }
  };

  const currentInfo = titles[activeTab] || titles.dashboard;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between transition-colors">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{currentInfo.title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{currentInfo.desc}</p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all shadow-sm"
          title="ប្តូរ Dark/Light Mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        <button
          onClick={onOpenAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមប្រតិបត្តិការ</span>
        </button>
      </div>
    </header>
  );
};
`);

// 6. src/components/layout/BottomNav.tsx
fs.writeFileSync(path.join(baseDir, 'src', 'components', 'layout', 'BottomNav.tsx'), `
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { LayoutDashboard, Receipt, BarChart3, Wallet, Settings } from 'lucide-react';
import { TabType } from '../../types/finance';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'ផ្ទាំងដើម', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'transactions', label: 'ប្រតិបត្តិការ', icon: <Receipt className="w-5 h-5" /> },
    { id: 'reports', label: 'របាយការណ៍', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'budgets', label: 'ថវិកា', icon: <Wallet className="w-5 h-5" /> },
    { id: 'settings', label: 'ការកំណត់', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex justify-around items-center">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={\`flex flex-col items-center py-1 px-3 rounded-xl transition-all \${
            activeTab === item.id
              ? 'text-emerald-500 dark:text-emerald-400 font-bold scale-105'
              : 'text-slate-400 dark:text-slate-500'
          }\`}
        >
          {item.icon}
          <span className="text-[10px] mt-1">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
`);

// 7. src/components/dashboard/DashboardTab.tsx
fs.writeFileSync(path.join(baseDir, 'src', 'components', 'dashboard', 'DashboardTab.tsx'), `
import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const DashboardTab: React.FC = () => {
  const { transactions, categories, exchangeRate } = useFinance();

  let incUSD = 0, expUSD = 0, incKHR = 0, expKHR = 0;
  transactions.forEach(t => {
    if (t.currency === 'USD') {
      if (t.type === 'income') incUSD += t.amount; else expUSD += t.amount;
    } else {
      if (t.type === 'income') incKHR += t.amount; else expKHR += t.amount;
    }
  });

  const totalIncInUSD = incUSD + (incKHR / exchangeRate);
  const totalExpInUSD = expUSD + (expKHR / exchangeRate);
  const totalBalanceInUSD = totalIncInUSD - totalExpInUSD;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xl shadow-emerald-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">សមតុល្យសរុប</span>
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl"><Wallet className="w-5 h-5 text-white" /></div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold">\${totalBalanceInUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-emerald-200 mt-1">~ \${(totalBalanceInUSD * exchangeRate).toLocaleString()} ៛</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">ចំណូលសរុប</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500">\${totalIncInUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-400 mt-1">+\${incKHR.toLocaleString()} ៛</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">ចំណាយសរុប</span>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-xl"><TrendingDown className="w-5 h-5 text-rose-500" /></div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-500">\${totalExpInUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-400 mt-1">-\${expKHR.toLocaleString()} ៛</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <h4 className="font-bold text-base text-slate-800 dark:text-white">ប្រតិបត្តិការថ្មីៗ</h4>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.slice(0, 7).map((t) => {
            const cat = categories.find(c => c.id === t.categoryId) || { name: 'ផ្សេងៗ', color: 'from-slate-400 to-slate-600' };
            const isInc = t.type === 'income';
            return (
              <div key={t.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={\`w-10 h-10 rounded-2xl bg-gradient-to-br \${cat.color} flex items-center justify-center text-white text-xs font-bold shadow-md\`}>
                    {isInc ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800 dark:text-white">{cat.name}</h5>
                    <p className="text-[11px] text-slate-400">{t.date} • {t.description || 'គ្មានការពិពណ៌នា'}</p>
                  </div>
                </div>
                <div className={\`font-bold text-sm \${isInc ? 'text-emerald-500' : 'text-rose-500'}\`}>
                  {isInc ? '+' : '-'}{t.currency === 'USD' ? '$' : ''}{t.amount.toLocaleString()}{t.currency === 'KHR' ? ' ៛' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
`);

console.log("DashboardTab component created.");
`);

fs.writeFileSync(path.join(baseDir, 'build_react_components.cjs'), script1);
console.log("build_react_components.cjs written.");
