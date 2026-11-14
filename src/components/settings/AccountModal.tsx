import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Lock, ShieldCheck, Eye, EyeOff, UserPlus, Save } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import type { AccountRole, UserAccount } from '../../types/finance';
import { CustomSelect } from '../common/CustomSelect';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount: UserAccount | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, editingAccount }) => {
  const { currentUser, createAccount, updateAccount } = useFinance();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AccountRole>('member');
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isEditingSelf = Boolean(editingAccount && currentUser && editingAccount.id === currentUser.id);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setPassword('');
    setShowPassword(false);

    if (editingAccount) {
      setDisplayName(editingAccount.displayName);
      setUsername(editingAccount.username);
      setRole(editingAccount.role);
      setIsActive(editingAccount.isActive !== false);
    } else {
      setDisplayName('');
      setUsername('');
      setRole('member');
      setIsActive(true);
    }
  }, [isOpen, editingAccount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('សូមបញ្ចូលឈ្មោះបង្ហាញ។');
      return;
    }

    if (!editingAccount) {
      if (!username.trim()) {
        setError('សូមបញ្ចូលឈ្មោះចូលប្រើ (Username)។');
        return;
      }
      if (password.length < 4) {
        setError('លេខសម្ងាត់ត្រូវមានយ៉ាងតិច 4 ខ្ទង់ ឬ 4 តួអក្សរ។');
        return;
      }

      setSaving(true);
      try {
        const res = await createAccount({ username, displayName, password, role });
        if (!res.ok) {
          setError(res.error || 'មិនអាចបង្កើតគណនីបានទេ។');
          return;
        }
        onClose();
      } finally {
        setSaving(false);
      }
      return;
    }

    if (password && password.length < 4) {
      setError('លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 4 ខ្ទង់ ឬ 4 តួអក្សរ។');
      return;
    }

    setSaving(true);
    try {
      const res = await updateAccount(editingAccount.id, {
        displayName,
        ...(isAdmin ? { role, isActive } : {}),
        ...(password ? { password } : {}),
      });
      if (!res.ok) {
        setError(res.error || 'មិនអាចរក្សាទុកការកែប្រែបានទេ។');
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              {editingAccount ? <User className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {editingAccount ? 'កែប្រែព័ត៌មានគណនី' : 'បង្កើតគណនីសមាជិកថ្មី'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-bold text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              ឈ្មោះបង្ហាញលើប្រតិបត្តិការ (Display Name) *
            </label>
            <input
              type="text"
              required
              placeholder="ឧ. សុខា, ម្តាយ, បងប្រុស"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              ឈ្មោះចូលប្រើ (Username) {!editingAccount && '*'}
            </label>
            <input
              type="text"
              required={!editingAccount}
              disabled={Boolean(editingAccount)}
              placeholder="ឧ. sokha"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              {editingAccount ? 'លេខសម្ងាត់ថ្មី (ទុកទទេបើមិនចង់ប្តូរ)' : 'លេខសម្ងាត់ (Password / PIN) *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required={!editingAccount}
                placeholder="យ៉ាងតិច 4 ខ្ទង់ ឬ 4 តួអក្សរ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  តួនាទី (Role)
                </label>
                <CustomSelect<AccountRole>
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: 'member', label: 'សមាជិក (Member)' },
                    { value: 'admin', label: 'អ្នកគ្រប់គ្រង (Admin)' },
                  ]}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>

              {editingAccount && !isEditingSelf && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    ស្ថានភាពគណនី
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {isActive ? 'កំពុងដំណើរការ (Active)' : 'បានផ្អាក (Disabled)'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              {editingAccount ? <Save className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{saving ? 'កំពុងរក្សាទុក...' : editingAccount ? 'រក្សាទុក' : 'បង្កើតគណនី'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
