import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { UserAccount } from '../../types/finance';
import { ShieldCheck, User, UserPlus, Edit2, Trash2, LogOut, KeyRound } from 'lucide-react';
import { AccountModal } from './AccountModal';

export const AccountManagementSection: React.FC = () => {
  const { currentUser, accounts, deleteAccount, logout } = useFinance();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  const handleCreateNew = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEdit = (acc: UserAccount) => {
    setEditingAccount(acc);
    setIsAccountModalOpen(true);
  };

  const handleDelete = async (acc: UserAccount) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុបគណនី "${acc.displayName}" (@${acc.username}) មែនទេ?`)) return;
    const res = await deleteAccount(acc.id);
    if (!res.ok && res.error) {
      alert(res.error);
    }
  };

  const handleLogout = async () => {
    if (confirm('តើអ្នកចង់ចាកចេញពីគណនីនេះមែនទេ?')) {
      await logout();
    }
  };

  return (
    <>
      {/* My Account Card */}
      <div className="glass-panel p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md flex-shrink-0 ${
                isAdmin
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}
            >
              {currentUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{currentUser.displayName}</h4>
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    isAdmin
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  <span>{isAdmin ? 'Admin' : 'សមាជិក'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ឈ្មោះចូលប្រើ៖ <span className="font-mono font-bold">@{currentUser.username}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleEdit(currentUser)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>កែឈ្មោះ / លេខសម្ងាត់</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ចាកចេញ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Only: Family Accounts Management */}
      {isAdmin && (
        <div className="glass-panel p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>គ្រប់គ្រងគណនីសមាជិក ({accounts.length})</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                មានតែ Admin ប៉ុណ្ណោះដែលអាចបង្កើត កែប្រែ ឬលុបគណនីឱ្យសមាជិកគ្រួសារប្រើប្រាស់
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>បង្កើតគណនីថ្មី</span>
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {accounts.map((acc) => {
              const isSelf = acc.id === currentUser.id;
              const active = acc.isActive !== false;
              return (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-colors gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0 ${
                        acc.role === 'admin'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}
                    >
                      {acc.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          {acc.displayName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            acc.role === 'admin'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {acc.role === 'admin' ? 'Admin' : 'សមាជិក'}
                        </span>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                            គណនីខ្ញុំ
                          </span>
                        )}
                        {!active && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                            បានផ្អាក
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">@{acc.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(acc)}
                      className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-500 transition-colors cursor-pointer"
                      title="កែប្រែគណនី"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDelete(acc)}
                        className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors cursor-pointer"
                        title="លុបគណនី"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        editingAccount={editingAccount}
      />
    </>
  );
};
