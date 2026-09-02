export type Currency = 'USD' | 'KHR';
export type TransactionType = 'income' | 'expense';
export type TabType = 'dashboard' | 'transactions' | 'reports' | 'budgets' | 'settings' | 'apps' | 'income_calculator';
export type CurrencyMode = 'MERGED_USD' | 'MERGED_KHR' | 'USD_ONLY' | 'KHR_ONLY';
export type TimePreset = 'today' | 'last_month' | 'this_month' | 'this_year' | 'all' | 'custom';

export interface Transaction {
  id: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  categoryId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  createdAt?: number; // timestamp in ms
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
  categoryId?: string;
  categoryIds?: string[];
  limitAmount: number;
  currency: Currency;
  startDate: string;
  endDate: string;
  description?: string;
}
