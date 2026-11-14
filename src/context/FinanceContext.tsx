import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Transaction,
  Category,
  Budget,
  TabType,
  CurrencyMode,
  UserAccount,
  AccountRole,
  ActivityLog,
  ActivityAction,
} from '../types/finance';
import { db } from '../services/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { getLocalDateString } from '../utils/dateUtils';
import { hashPassword, normalizeUsername } from '../utils/authUtils';

const AUTH_STORAGE_KEY = 'finance_auth_user_id';

interface CreateAccountInput {
  username: string;
  displayName: string;
  password: string;
  role: AccountRole;
}

interface UpdateAccountInput {
  displayName?: string;
  role?: AccountRole;
  isActive?: boolean;
  password?: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  accounts: UserAccount[];
  accountsLoaded: boolean;
  currentUser: UserAccount | null;
  activityLogs: ActivityLog[];
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
  restoreBackup: (backupData: any) => Promise<boolean>;
  googleSheetSettings: { webAppUrl: string; sheetViewLink: string };
  saveGoogleSheetSettings: (webAppUrl: string, sheetViewLink: string) => Promise<void>;
  createInitialAdmin: (username: string, displayName: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  createAccount: (input: CreateAccountInput) => Promise<{ ok: boolean; error?: string }>;
  updateAccount: (id: string, input: UpdateAccountInput) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: (id: string) => Promise<{ ok: boolean; error?: string }>;
  logActivity: (
    action: ActivityAction,
    summary: string,
    details?: string,
    targetId?: string,
    actorOverride?: UserAccount
  ) => Promise<void>;
  clearActivityLogs: () => Promise<void>;
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
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState<boolean>(false);
  const [authUserId, setAuthUserId] = useState<string | null>(() => localStorage.getItem(AUTH_STORAGE_KEY));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
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
  const [googleSheetSettings, setGoogleSheetSettings] = useState<{ webAppUrl: string; sheetViewLink: string }>(() => ({
    webAppUrl: localStorage.getItem('g_apps_script_url') || '',
    sheetViewLink: localStorage.getItem('g_sheet_view_link') || ''
  }));

  const currentUser = useMemo<UserAccount | null>(() => {
    if (!authUserId || accounts.length === 0) return null;
    const found = accounts.find((a) => a.id === authUserId);
    if (!found || found.isActive === false) return null;
    return found;
  }, [authUserId, accounts]);

  useEffect(() => {
    if (!accountsLoaded || !authUserId) return;
    const found = accounts.find((a) => a.id === authUserId);
    if (!found || found.isActive === false) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthUserId(null);
    }
  }, [accountsLoaded, accounts, authUserId]);

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
          description: d.description || '',
          createdById: d.createdById || undefined,
          createdByName: d.createdByName || undefined,
          updatedById: d.updatedById || undefined,
          updatedByName: d.updatedByName || undefined,
          updatedAt: d.updatedAt ? Number(d.updatedAt) : undefined,
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

    const unsubAccounts = onSnapshot(
      collection(db, 'accounts'),
      (snapshot) => {
        const docs: UserAccount[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            username: d.username || '',
            displayName: d.displayName || d.username || '',
            passwordHash: d.passwordHash || '',
            role: d.role === 'admin' ? 'admin' : 'member',
            isActive: d.isActive !== false,
            createdAt: Number(d.createdAt || Date.now()),
            createdByName: d.createdByName || undefined,
          };
        });
        docs.sort((a, b) => a.createdAt - b.createdAt);
        setAccounts(docs);
        setAccountsLoaded(true);
      },
      (err) => {
        console.error('Failed to subscribe to accounts:', err);
        setAccountsLoaded(true);
      }
    );

    const logsQuery = query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'), limit(250));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const docs: ActivityLog[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          action: d.action || 'tx_create',
          actorId: d.actorId || 'system',
          actorName: d.actorName || 'ប្រព័ន្ធ',
          actorUsername: d.actorUsername || undefined,
          summary: d.summary || '',
          details: d.details || undefined,
          targetId: d.targetId || undefined,
          createdAt: Number(d.createdAt || Date.now()),
        };
      });
      setActivityLogs(docs);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'google_sheet_sync'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const webAppUrl = data.webAppUrl || '';
        const sheetViewLink = data.sheetViewLink || '';
        setGoogleSheetSettings({ webAppUrl, sheetViewLink });
        localStorage.setItem('g_apps_script_url', webAppUrl);
        localStorage.setItem('g_sheet_view_link', sheetViewLink);
      } else {
        const localUrl = localStorage.getItem('g_apps_script_url') || '';
        const localView = localStorage.getItem('g_sheet_view_link') || '';
        if (localUrl || localView) {
          setDoc(doc(db, 'settings', 'google_sheet_sync'), {
            webAppUrl: localUrl,
            sheetViewLink: localView,
            updatedAt: Date.now()
          }).catch(err => console.error('Failed to migrate Google Sheet settings:', err));
        }
      }
    });

    return () => {
      unsubTx();
      unsubCat();
      unsubBg();
      unsubAccounts();
      unsubLogs();
      unsubSettings();
    };
  }, []);

  const logActivity = useCallback(
    async (
      action: ActivityAction,
      summary: string,
      details?: string,
      targetId?: string,
      actorOverride?: UserAccount
    ) => {
      const actor = actorOverride || currentUser;
      try {
        await addDoc(collection(db, 'activity_logs'), {
          action,
          actorId: actor?.id || 'system',
          actorName: actor?.displayName || actor?.username || 'ប្រព័ន្ធ',
          ...(actor?.username ? { actorUsername: actor.username } : {}),
          summary,
          ...(details ? { details } : {}),
          ...(targetId ? { targetId } : {}),
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error('Failed to write activity log:', err);
      }
    },
    [currentUser]
  );

  const formatTxLogSummary = useCallback(
    (tx: Partial<Transaction>) => {
      const typeLabel = tx.type === 'income' ? 'ចំណូល' : 'ចំណាយ';
      const amtStr =
        tx.currency === 'USD'
          ? `$${Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `${Number(tx.amount || 0).toLocaleString()} ៛`;
      const catName = categories.find((c) => c.id === tx.categoryId)?.name || tx.categoryId || 'ផ្សេងៗ';
      return `${typeLabel} ${amtStr} (${catName})`;
    },
    [categories]
  );

  const createInitialAdmin = async (
    username: string,
    displayName: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (accounts.length > 0) {
      return { ok: false, error: 'មានគណនីនៅក្នុងប្រព័ន្ធរួចហើយ! សូមប្រើមុខងារចូលប្រើប្រាស់។' };
    }
    const cleanUser = normalizeUsername(username);
    const cleanName = displayName.trim();
    if (!cleanUser || !cleanName || password.length < 4) {
      return { ok: false, error: 'សូមបំពេញឈ្មោះ ឈ្មោះចូលប្រើ និងលេខសម្ងាត់យ៉ាងតិច 4 ខ្ទង់។' };
    }

    const passwordHash = await hashPassword(password);
    const now = Date.now();
    const docRef = await addDoc(collection(db, 'accounts'), {
      username: cleanUser,
      displayName: cleanName,
      passwordHash,
      role: 'admin',
      isActive: true,
      createdAt: now,
      createdByName: cleanName,
    });

    const newAdmin: UserAccount = {
      id: docRef.id,
      username: cleanUser,
      displayName: cleanName,
      passwordHash,
      role: 'admin',
      isActive: true,
      createdAt: now,
      createdByName: cleanName,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, docRef.id);
    setAuthUserId(docRef.id);
    await logActivity('account_create', `បង្កើតគណនី Admin ដំបូង "${cleanName}" (@${cleanUser})`, undefined, docRef.id, newAdmin);
    return { ok: true };
  };

  const login = async (username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const cleanUser = normalizeUsername(username);
    if (!cleanUser || !password) {
      return { ok: false, error: 'សូមបញ្ចូលឈ្មោះចូលប្រើ និងលេខសម្ងាត់។' };
    }

    const account = accounts.find((a) => normalizeUsername(a.username) === cleanUser);
    if (!account) {
      return { ok: false, error: 'ឈ្មោះចូលប្រើ ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ។' };
    }
    if (account.isActive === false) {
      return { ok: false, error: 'គណនីនេះត្រូវបានផ្អាកដំណើរការដោយ Admin។' };
    }

    const inputHash = await hashPassword(password);
    if (inputHash !== account.passwordHash) {
      return { ok: false, error: 'ឈ្មោះចូលប្រើ ឬលេខសម្ងាត់មិនត្រឹមត្រូវទេ។' };
    }

    localStorage.setItem(AUTH_STORAGE_KEY, account.id);
    setAuthUserId(account.id);
    await logActivity('login', `បានចូលប្រើប្រាស់កម្មវិធី (@${account.username})`, undefined, account.id, account);
    return { ok: true };
  };

  const logout = async () => {
    const actor = currentUser;
    if (actor) {
      await logActivity('logout', `បានចាកចេញពីកម្មវិធី (@${actor.username})`, undefined, actor.id, actor);
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthUserId(null);
  };

  const createAccount = async (input: CreateAccountInput): Promise<{ ok: boolean; error?: string }> => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, error: 'មានតែ Admin ប៉ុណ្ណោះដែលអាចបង្កើតគណនីថ្មីបាន។' };
    }
    const cleanUser = normalizeUsername(input.username);
    const cleanName = input.displayName.trim();
    if (!cleanUser || !cleanName || input.password.length < 4) {
      return { ok: false, error: 'សូមបំពេញព័ត៌មានឱ្យគ្រប់ និងលេខសម្ងាត់យ៉ាងតិច 4 ខ្ទង់។' };
    }
    if (accounts.some((a) => normalizeUsername(a.username) === cleanUser)) {
      return { ok: false, error: `ឈ្មោះចូលប្រើ "${cleanUser}" មានរួចហើយ! សូមប្រើឈ្មោះផ្សេង។` };
    }

    const passwordHash = await hashPassword(input.password);
    const docRef = await addDoc(collection(db, 'accounts'), {
      username: cleanUser,
      displayName: cleanName,
      passwordHash,
      role: input.role,
      isActive: true,
      createdAt: Date.now(),
      createdByName: currentUser.displayName,
    });

    await logActivity(
      'account_create',
      `បានបង្កើតគណនីថ្មី "${cleanName}" (@${cleanUser})`,
      `សិទ្ធិ: ${input.role === 'admin' ? 'Admin' : 'សមាជិក'}`,
      docRef.id
    );
    return { ok: true };
  };

  const updateAccount = async (id: string, input: UpdateAccountInput): Promise<{ ok: boolean; error?: string }> => {
    const target = accounts.find((a) => a.id === id);
    if (!target) return { ok: false, error: 'រកមិនឃើញគណនីនេះទេ។' };

    const isSelf = currentUser?.id === id;
    const isAdmin = currentUser?.role === 'admin';
    if (!isAdmin && !isSelf) {
      return { ok: false, error: 'អ្នកមិនមានសិទ្ធិកែប្រែគណនីនេះទេ។' };
    }

    const payload: Record<string, any> = {};
    const changes: string[] = [];

    if (input.displayName !== undefined && input.displayName.trim() && input.displayName.trim() !== target.displayName) {
      payload.displayName = input.displayName.trim();
      changes.push(`ឈ្មោះ: ${target.displayName} → ${payload.displayName}`);
    }
    if (isAdmin && input.role !== undefined && input.role !== target.role) {
      if (target.role === 'admin' && input.role !== 'admin') {
        const activeAdmins = accounts.filter((a) => a.role === 'admin' && a.isActive !== false && a.id !== id);
        if (activeAdmins.length === 0) {
          return { ok: false, error: 'មិនអាចដកសិទ្ធិ Admin ចុងក្រោយគេបានទេ។' };
        }
      }
      payload.role = input.role;
      changes.push(`សិទ្ធិ: ${target.role} → ${input.role}`);
    }
    if (isAdmin && input.isActive !== undefined && input.isActive !== (target.isActive !== false)) {
      if (!input.isActive && id === currentUser?.id) {
        return { ok: false, error: 'អ្នកមិនអាចបិទគណនីខ្លួនឯងដែលកំពុងប្រើបានទេ។' };
      }
      payload.isActive = input.isActive;
      changes.push(input.isActive ? 'បើកដំណើរការគណនី' : 'ផ្អាកដំណើរការគណនី');
    }
    if (input.password && input.password.length >= 4) {
      payload.passwordHash = await hashPassword(input.password);
      changes.push('ប្តូរលេខសម្ងាត់');
    }

    if (Object.keys(payload).length === 0) return { ok: true };

    await updateDoc(doc(db, 'accounts', id), payload);
    await logActivity(
      'account_update',
      `បានកែប្រែគណនី "${payload.displayName || target.displayName}" (@${target.username})`,
      changes.join(' • '),
      id
    );
    return { ok: true };
  };

  const deleteAccount = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, error: 'មានតែ Admin ប៉ុណ្ណោះដែលអាចលុបគណនីបាន។' };
    }
    if (id === currentUser.id) {
      return { ok: false, error: 'អ្នកមិនអាចលុបគណនីខ្លួនឯងដែលកំពុងប្រើបានទេ។' };
    }
    const target = accounts.find((a) => a.id === id);
    if (!target) return { ok: false, error: 'រកមិនឃើញគណនីនេះទេ។' };
    if (target.role === 'admin') {
      const otherAdmins = accounts.filter((a) => a.role === 'admin' && a.id !== id && a.isActive !== false);
      if (otherAdmins.length === 0) {
        return { ok: false, error: 'មិនអាចលុប Admin ចុងក្រោយគេបានទេ។' };
      }
    }

    await deleteDoc(doc(db, 'accounts', id));
    await logActivity(
      'account_delete',
      `បានលុបគណនី "${target.displayName}" (@${target.username})`,
      undefined,
      id
    );
    return { ok: true };
  };

  const clearActivityLogs = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const snap = await getDocs(collection(db, 'activity_logs'));
    const docsList = snap.docs;
    for (let i = 0; i < docsList.length; i += 400) {
      const batch = writeBatch(db);
      docsList.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await logActivity('settings_update', 'បានសម្អាតកំណត់ត្រាសកម្មភាពចាស់ៗទាំងអស់');
  };

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const actorName = currentUser?.displayName || currentUser?.username;
    const payload = {
      ...tx,
      ...(currentUser?.id && !tx.createdById ? { createdById: currentUser.id } : {}),
      ...(actorName && !tx.createdByName ? { createdByName: actorName } : {}),
    };
    const ref = await addDoc(collection(db, 'transactions'), payload);
    const detailsParts = [`ថ្ងៃ: ${tx.date}`];
    if (tx.description?.trim()) detailsParts.push(tx.description.trim());
    await logActivity('tx_create', `បានបន្ថែម ${formatTxLogSummary(payload)}`, detailsParts.join(' • '), ref.id);
  };

  const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
    const existing = transactions.find((t) => t.id === id);
    const actorName = currentUser?.displayName || currentUser?.username;
    const payload = {
      ...tx,
      ...(currentUser?.id ? { updatedById: currentUser.id } : {}),
      ...(actorName ? { updatedByName: actorName } : {}),
      updatedAt: Date.now(),
    };
    await updateDoc(doc(db, 'transactions', id), payload);

    const merged = existing ? { ...existing, ...payload } : payload;
    const oldDesc = existing ? formatTxLogSummary(existing) : '';
    const newDesc = formatTxLogSummary(merged);
    const detail = existing && oldDesc !== newDesc ? `ពី ${oldDesc} → ${newDesc}` : merged.description || undefined;
    await logActivity('tx_update', `បានកែប្រែ ${newDesc}`, detail, id);
  };

  const deleteTransaction = async (id: string) => {
    const existing = transactions.find((t) => t.id === id);
    await deleteDoc(doc(db, 'transactions', id));
    const summary = existing ? `បានលុប ${formatTxLogSummary(existing)}` : 'បានលុបប្រតិបត្តិការមួយ';
    const detail = existing
      ? `ថ្ងៃ: ${existing.date}${existing.createdByName ? ` • ម្ចាស់ដើម: ${existing.createdByName}` : ''}${existing.description ? ` • ${existing.description}` : ''}`
      : undefined;
    await logActivity('tx_delete', summary, detail, id);
  };

  const addBudget = async (bg: Omit<Budget, 'id'>) => {
    const ref = await addDoc(collection(db, 'budgets'), bg);
    await logActivity('budget_create', `បានបង្កើតថវិកា "${bg.name}"`, `${bg.limitAmount.toLocaleString()} ${bg.currency}`, ref.id);
  };

  const updateBudget = async (id: string, bg: Partial<Budget>) => {
    const existing = budgets.find((b) => b.id === id);
    await updateDoc(doc(db, 'budgets', id), bg);
    await logActivity('budget_update', `បានកែប្រែថវិកា "${bg.name || existing?.name || ''}"`, undefined, id);
  };

  const deleteBudget = async (id: string) => {
    const existing = budgets.find((b) => b.id === id);
    await deleteDoc(doc(db, 'budgets', id));
    await logActivity('budget_delete', `បានលុបថវិកា "${existing?.name || id}"`, undefined, id);
  };

  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const ref = await addDoc(collection(db, 'categories'), cat);
    await logActivity('category_create', `បានបន្ថែមប្រភេទ "${cat.name}"`, cat.type === 'income' ? 'ចំណូល' : 'ចំណាយ', ref.id);
  };

  const updateCategory = async (id: string, cat: Partial<Category>) => {
    const existing = categories.find((c) => c.id === id);
    await updateDoc(doc(db, 'categories', id), cat);
    await logActivity('category_update', `បានកែប្រែប្រភេទ "${cat.name || existing?.name || ''}"`, undefined, id);
  };

  const deleteCategory = async (id: string) => {
    const existing = categories.find((c) => c.id === id);
    await deleteDoc(doc(db, 'categories', id));
    await logActivity('category_delete', `បានលុបប្រភេទ "${existing?.name || id}"`, undefined, id);
  };

  const saveGoogleSheetSettings = async (webAppUrl: string, sheetViewLink: string) => {
    const cleanUrl = webAppUrl.trim();
    const cleanViewLink = sheetViewLink.trim();
    setGoogleSheetSettings({ webAppUrl: cleanUrl, sheetViewLink: cleanViewLink });
    localStorage.setItem('g_apps_script_url', cleanUrl);
    localStorage.setItem('g_sheet_view_link', cleanViewLink);
    await setDoc(doc(db, 'settings', 'google_sheet_sync'), {
      webAppUrl: cleanUrl,
      sheetViewLink: cleanViewLink,
      updatedAt: Date.now()
    });
    await logActivity('settings_update', 'បានធ្វើបច្ចុប្បន្នភាពការកំណត់ Google Sheet Sync');
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

  const restoreBackup = async (backupData: any): Promise<boolean> => {
    try {
      const promises: Promise<void>[] = [];
      
      if (backupData.transactions && Array.isArray(backupData.transactions)) {
        for (const t of backupData.transactions) {
          const { id, ...data } = t;
          if (id) promises.push(setDoc(doc(db, 'transactions', id), data));
        }
      }
      
      if (backupData.categories && Array.isArray(backupData.categories)) {
        for (const c of backupData.categories) {
          const { id, ...data } = c;
          if (id) promises.push(setDoc(doc(db, 'categories', id), data));
        }
      }
      
      if (backupData.budgets && Array.isArray(backupData.budgets)) {
        for (const b of backupData.budgets) {
          const { id, ...data } = b;
          if (id) promises.push(setDoc(doc(db, 'budgets', id), data));
        }
      }
      
      await Promise.all(promises);

      if (backupData.settings) {
        if (backupData.settings.exchangeRate) setExchangeRate(backupData.settings.exchangeRate);
        if (backupData.settings.isDarkMode !== undefined) setIsDarkMode(backupData.settings.isDarkMode);
        if (backupData.settings.currencyMode) setCurrencyMode(backupData.settings.currencyMode);
        if (backupData.settings.googleSheetSettings) {
          await saveGoogleSheetSettings(
            backupData.settings.googleSheetSettings.webAppUrl || '',
            backupData.settings.googleSheetSettings.sheetViewLink || ''
          );
        }
      }

      const txCount = Array.isArray(backupData.transactions) ? backupData.transactions.length : 0;
      await logActivity('backup_restore', `បាន Restore ទិន្នន័យ Backup (${txCount} ប្រតិបត្តិការ)`);
      
      return true;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      categories,
      budgets,
      accounts,
      accountsLoaded,
      currentUser,
      activityLogs,
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
      getDayOnly,
      restoreBackup,
      googleSheetSettings,
      saveGoogleSheetSettings,
      createInitialAdmin,
      login,
      logout,
      createAccount,
      updateAccount,
      deleteAccount,
      logActivity,
      clearActivityLogs
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
