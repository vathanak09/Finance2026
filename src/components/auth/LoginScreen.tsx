import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, LogIn, Moon, Sun, UserPlus } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { accounts, accountsLoaded, login, createInitialAdmin, isDarkMode, setIsDarkMode } = useFinance();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isInitialSetup = accountsLoaded && accounts.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isInitialSetup) {
      if (!displayName.trim() || !username.trim()) {
        setError('សូមបញ្ចូលឈ្មោះបង្ហាញ និងឈ្មោះចូលប្រើ។');
        return;
      }
      if (password.length < 4) {
        setError('លេខសម្ងាត់ត្រូវមានយ៉ាងតិច 4 ខ្ទង់ ឬ 4 តួអក្សរ។');
        return;
      }
      if (password !== confirmPassword) {
        setError('ការបញ្ជាក់លេខសម្ងាត់មិនដូចគ្នាទេ។');
        return;
      }

      setSubmitting(true);
      try {
        const res = await createInitialAdmin(username, displayName, password);
        if (!res.ok) setError(res.error || 'មិនអាចបង្កើតគណនីបានទេ។');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(username, password);
      if (!res.ok) setError(res.error || 'ការចូលប្រើបរាជ័យ។');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 relative overflow-hidden transition-colors">
      {/* Background Glows */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500/15 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Theme Toggle */}
      <button
        type="button"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-300 hover:scale-105 transition-all cursor-pointer z-20"
        title={isDarkMode ? 'ប្តូរទៅពន្លឺភ្លឺ' : 'ប្តូរទៅពន្លឺងងឹត'}
      >
        {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
      </button>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          {/* App Branding */}
          <div className="flex flex-col items-center text-center space-y-3">
            <img
              src="/icon.svg"
              alt="Logo"
              className="w-16 h-16 rounded-2xl shadow-lg shadow-emerald-500/25 object-contain"
            />
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">សៀវភៅហិរញ្ញវត្ថុ</h1>
              <p className="text-xs font-extrabold tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mt-0.5">
                Smart Finance • Family Edition
              </p>
            </div>
          </div>

          {!accountsLoaded ? (
            <div className="py-10 flex flex-col items-center space-y-3">
              <div className="w-9 h-9 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                កំពុងភ្ជាប់ទៅកាន់ប្រព័ន្ធគណនី...
              </p>
            </div>
          ) : (
            <>
              {isInitialSetup ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start space-x-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    <p className="font-bold">បង្កើតគណនី Admin ដំបូងគេ</p>
                    <p className="mt-0.5 opacity-90">
                      មិនទាន់មានគណនីក្នុងប្រព័ន្ធទេ។ សូមបង្កើតគណនី Admin ដើម្បីគ្រប់គ្រង និងបង្កើតគណនីឱ្យសមាជិកគ្រួសារ។
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-white">ចូលប្រើប្រាស់គណនី</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    វាយឈ្មោះចូលប្រើ និងលេខសម្ងាត់ ដើម្បីកត់ត្រាឈ្មោះលើប្រតិបត្តិការ
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {isInitialSetup && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      ឈ្មោះបង្ហាញលើប្រតិបត្តិការ (Display Name)
                    </label>
                    <div className="relative">
                      <UserPlus className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="ឧ. វឌ្ឍនៈ"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    ឈ្មោះចូលប្រើ (Username)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      placeholder={isInitialSetup ? 'ឧ. admin' : 'បញ្ចូលឈ្មោះចូលប្រើ'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    លេខសម្ងាត់ (Password / PIN)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={isInitialSetup ? 'new-password' : 'current-password'}
                      placeholder="••••••"
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

                {isInitialSetup && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      បញ្ជាក់លេខសម្ងាត់ម្តងទៀត
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        placeholder="••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  {isInitialSetup ? <ShieldCheck className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>
                    {submitting
                      ? 'កំពុងដំណើរការ...'
                      : isInitialSetup
                      ? 'បង្កើតគណនី Admin & ចូលប្រើប្រាស់'
                      : 'ចូលប្រើប្រាស់ (Login)'}
                  </span>
                </button>
              </form>

              {!isInitialSetup && (
                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  មិនទាន់មានគណនីមែនទេ? សូមទាក់ទង <span className="font-bold text-emerald-600 dark:text-emerald-400">Admin</span> ដើម្បីបង្កើតគណនីឱ្យអ្នក។
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
