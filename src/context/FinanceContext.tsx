import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Transaction, Category, Budget, TabType, CurrencyMode } from '../types/finance';
import { db } from '../services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getLocalDateString } from '../utils/dateUtils';

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
  currencyMode: CurrencyMode;
  setCurrencyMode: (mode: CurrencyMode) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  viewingTransaction: Transaction | null;
  setViewingTransaction: (tx: Transaction | null) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  editingBudget: Budget | null;
  setEditingBudget: (bg: Budget | null) => void;
  addBudget: (bg: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, bg: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, cat: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
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
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return (localStorage.getItem('finance_activeTab') as TabType) || 'dashboard';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('finance_isDarkMode');
    return saved ? JSON.parse(saved) : true;
  });
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('finance_exchangeRate');
    return saved ? parseFloat(saved) : 4000;
  });
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(() => {
    return (localStorage.getItem('finance_currencyMode') as CurrencyMode) || 'MERGED_KHR';
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    localStorage.setItem('finance_isDarkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('finance_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('finance_currencyMode', currencyMode);
  }, [currencyMode]);

  useEffect(() => {
    localStorage.setItem('finance_exchangeRate', exchangeRate.toString());
  }, [exchangeRate]);

  useEffect(() => {
    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const docs: Transaction[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        const txDate = d.date || getLocalDateString();
        const txTime = d.time ? String(d.time).trim() : '12:00'; // Set legacy transaction time to 12:00 PM
        const txCreatedAt = d.createdAt 
          ? Number(d.createdAt) 
          : (new Date(`${txDate}T${txTime}:00`).getTime() || Date.now());

        return {
          id: docSnap.id,
          amount: Number(d.amount || 0),
          currency: d.currency || 'USD',
          type: d.type || 'expense',
          categoryId: d.categoryId || d.category_id || 'cat_other_exp',
          date: txDate,
          time: txTime,
          createdAt: txCreatedAt,
          description: d.description || ''
        };
      });

      // Sort newest to oldest by default (ពីថ្មីទៅចាស់)
      docs.sort((a, b) => {
        const timeA = a.createdAt || new Date(`${a.date}T${a.time || '12:00'}:00`).getTime();
        const timeB = b.createdAt || new Date(`${b.date}T${b.time || '12:00'}:00`).getTime();
        return timeB - timeA;
      });

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
          name: d.name || '',
          categoryId: d.categoryId || d.category_id || 'all',
          categoryIds: d.categoryIds || (d.categoryId ? [d.categoryId] : ['all']),
          limitAmount: Number(d.limitAmount || d.limit_amount || 0),
          currency: d.currency || 'KHR',
          startDate: d.startDate || d.start_date || getLocalDateString(),
          endDate: d.endDate || d.end_date || getLocalDateString(),
          description: d.description || ''
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

  const updateBudget = async (id: string, bg: Partial<Budget>) => {
    await updateDoc(doc(db, 'budgets', id), bg);
  };

  const deleteBudget = async (id: string) => {
    await deleteDoc(doc(db, 'budgets', id));
  };

  const addCategory = async (cat: Omit<Category, 'id'>) => {
    await addDoc(collection(db, 'categories'), cat);
  };

  const updateCategory = async (id: string, cat: Partial<Category>) => {
    await updateDoc(doc(db, 'categories', id), cat);
  };

  const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
  };

  const getDayOnly = (dateStr: string): string => {
    if (!dateStr) return '--';
    const parts = dateStr.split(/[-./]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) return String(parseInt(parts[2], 10)); // YYYY-MM-DD
      return String(parseInt(parts[0], 10)); // DD.MM.YYYY
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
      currencyMode,
      setCurrencyMode,
      editingTransaction,
      setEditingTransaction,
      viewingTransaction,
      setViewingTransaction,
      editingBudget,
      setEditingBudget,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      updateBudget,
      deleteBudget,
      addCategory,
      updateCategory,
      deleteCategory,
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
