import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { ActivityAction } from '../../types/finance';
import { History, Search, PlusCircle, Edit2, Trash2, Shield, LogIn, Settings2, User } from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

type ActionFilter = 'all' | 'tx_create' | 'tx_update' | 'tx_delete' | 'auth_account' | 'other';

export const ActivityLogSection: React.FC = () => {
  const { activityLogs, accounts, currentUser, clearActivityLogs } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [visibleCount, setVisibleCount] = useState(20);

  const actorOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: 'all', label: 'គ្រប់គណនី' }];
    const seen = new Set<string>();

    accounts.forEach((acc) => {
      seen.add(acc.id);
      opts.push({ value: acc.id, label: acc.displayName });
    });

    activityLogs.forEach((log) => {
      if (log.actorId && !seen.has(log.actorId)) {
        seen.add(log.actorId);
        opts.push({ value: log.actorId, label: log.actorName });
      }
    });

    return opts;
  }, [accounts, activityLogs]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return activityLogs.filter((log) => {
      if (actorFilter !== 'all' && log.actorId !== actorFilter) return false;

      if (actionFilter === 'tx_create' && log.action !== 'tx_create') return false;
      if (actionFilter === 'tx_update' && log.action !== 'tx_update') return false;
      if (actionFilter === 'tx_delete' && log.action !== 'tx_delete') return false;
      if (
        actionFilter === 'auth_account' &&
        !['login', 'logout', 'account_create', 'account_update', 'account_delete'].includes(log.action)
      ) {
        return false;
      }
      if (
        actionFilter === 'other' &&
        ![
          'budget_create',
          'budget_update',
          'budget_delete',
          'category_create',
          'category_update',
          'category_delete',
          'settings_update',
          'backup_restore',
        ].includes(log.action)
      ) {
        return false;
      }

      if (q) {
        const haystack = `${log.actorName} ${log.actorUsername || ''} ${log.summary} ${log.details || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [activityLogs, actorFilter, actionFilter, searchTerm]);

  const formatTimestamp = (ms: number) => {
    const d = new Date(ms);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}-${month}-${year} • ${String(hours).padStart(2, '0')}:${mins} ${period}`;
  };

  const getActionBadge = (action: ActivityAction) => {
    if (action === 'tx_create' || action === 'budget_create' || action === 'category_create') {
      return {
        icon: <PlusCircle className="w-4 h-4" />,
        bg: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
      };
    }
    if (action === 'tx_update' || action === 'budget_update' || action === 'category_update') {
      return {
        icon: <Edit2 className="w-4 h-4" />,
        bg: 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
      };
    }
    if (action === 'tx_delete' || action === 'budget_delete' || action === 'category_delete' || action === 'account_delete') {
      return {
        icon: <Trash2 className="w-4 h-4" />,
        bg: 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
      };
    }
    if (action === 'account_create' || action === 'account_update') {
      return {
        icon: <Shield className="w-4 h-4" />,
        bg: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
      };
    }
    if (action === 'login' || action === 'logout') {
      return {
        icon: <LogIn className="w-4 h-4" />,
        bg: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
      };
    }
    return {
      icon: <Settings2 className="w-4 h-4" />,
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    };
  };

  const handleClearLogs = async () => {
    if (!confirm('តើអ្នកពិតជាចង់សម្អាតកំណត់ត្រាសកម្មភាព (Activity Logs) ទាំងអស់មែនទេ?')) return;
    await clearActivityLogs();
  };

  const visibleLogs = filteredLogs.slice(0, visibleCount);

  return (
    <div className="glass-panel p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-500" />
            <span>កំណត់ត្រាសកម្មភាព (Activity Log)</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            តាមដានការបញ្ចូល កែប្រែ លុបប្រតិបត្តិការ និងសកម្មភាពគណនី ({filteredLogs.length})
          </p>
        </div>

        {currentUser?.role === 'admin' && activityLogs.length > 0 && (
          <button
            type="button"
            onClick={handleClearLogs}
            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-900/50 text-xs font-bold transition-colors cursor-pointer"
          >
            សម្អាត Log
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ស្វែងរកក្នុង Log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <CustomSelect<string>
          value={actorFilter}
          onChange={setActorFilter}
          options={actorOptions}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
        />

        <CustomSelect<ActionFilter>
          value={actionFilter}
          onChange={setActionFilter}
          options={[
            { value: 'all', label: 'គ្រប់សកម្មភាព' },
            { value: 'tx_create', label: 'បន្ថែមប្រតិបត្តិការ' },
            { value: 'tx_update', label: 'កែប្រែប្រតិបត្តិការ' },
            { value: 'tx_delete', label: 'លុបប្រតិបត្តិការ' },
            { value: 'auth_account', label: 'គណនី & Login' },
            { value: 'other', label: 'ការកំណត់ & ផ្សេងៗ' },
          ]}
          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
        />
      </div>

      {/* Log Feed */}
      <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
        {visibleLogs.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 font-medium">
            មិនទាន់មានកំណត់ត្រាសកម្មភាពនៅឡើយទេ
          </div>
        ) : (
          visibleLogs.map((log) => {
            const badge = getActionBadge(log.action);
            return (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 flex items-start space-x-3"
              >
                <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${badge.bg}`}>{badge.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="inline-flex items-center space-x-1 text-xs font-extrabold text-slate-800 dark:text-white">
                      <User className="w-3 h-3 text-emerald-500" />
                      <span>{log.actorName}</span>
                      {log.actorUsername && (
                        <span className="text-[10px] font-mono font-normal text-slate-400">
                          (@{log.actorUsername})
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {formatTimestamp(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1 leading-snug">
                    {log.summary}
                  </p>
                  {log.details && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredLogs.length > visibleCount && (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => prev + 25)}
          className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
        >
          បង្ហាញបន្ថែម ({filteredLogs.length - visibleCount} ទៀត)
        </button>
      )}
    </div>
  );
};
