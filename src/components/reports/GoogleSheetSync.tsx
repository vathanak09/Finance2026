import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings, ExternalLink } from 'lucide-react';
import type { Transaction, Category } from '../../types/finance';

interface GoogleSheetSyncProps {
  filteredTxs: Transaction[];
  categories: Category[];
}

export const GoogleSheetSync: React.FC<GoogleSheetSyncProps> = ({ filteredTxs, categories }) => {
  const [sheetLink, setSheetLink] = useState(localStorage.getItem('g_sheet_link') || '');
  const [clientId, setClientId] = useState(localStorage.getItem('g_client_id') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);

  useEffect(() => {
    // Load Google Identity Services script
    if (document.getElementById('gsi-script')) {
      setIsGsiLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGsiLoaded(true);
    document.body.appendChild(script);
  }, []);

  const saveSettings = () => {
    localStorage.setItem('g_sheet_link', sheetLink);
    localStorage.setItem('g_client_id', clientId);
    setIsSettingsOpen(false);
    alert('ការកំណត់ត្រូវបានរក្សាទុក!');
  };

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleSync = () => {
    if (!sheetLink || !clientId) {
      alert('សូមបញ្ចូល Google Client ID និង Sheet Link នៅក្នុង Setting ជាមុនសិន!');
      setIsSettingsOpen(true);
      return;
    }

    const spreadsheetId = extractSpreadsheetId(sheetLink);
    if (!spreadsheetId) {
      alert('Google Sheet Link មិនត្រឹមត្រូវទេ!');
      return;
    }

    if (!isGsiLoaded || !(window as any).google) {
      alert('កំពុងទាញយក Google Services... សូមរង់ចាំបន្តិច');
      return;
    }

    setIsSyncing(true);

    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: async (response: any) => {
        if (response.error) {
          alert('បរាជ័យក្នុងការភ្ជាប់គណនី Google!');
          setIsSyncing(false);
          return;
        }

        const accessToken = response.access_token;
        await syncDataToSheet(spreadsheetId, accessToken);
      },
    });

    client.requestAccessToken({ prompt: '' });
  };

  const syncDataToSheet = async (spreadsheetId: string, accessToken: string) => {
    try {
      // 1. Prepare data
      const values = [
        ['ID', 'Date', 'Time', 'Type', 'Category', 'Amount', 'Currency', 'Description', 'Created At'] // Header
      ];

      filteredTxs.forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        values.push([
          t.id,
          t.date,
          t.time || '',
          t.type === 'income' ? 'Income' : 'Expense',
          cat ? cat.name : t.categoryId,
          t.amount.toString(),
          t.currency,
          t.description || '',
          t.createdAt ? new Date(t.createdAt).toLocaleString() : ''
        ]);
      });

      // 2. Clear existing sheet (optional, but good for "Sync current data")
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1:clear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // 3. Update with new data
      const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values,
        }),
      });

      if (!updateResponse.ok) {
        const err = await updateResponse.json();
        throw new Error(err.error?.message || 'Update failed');
      }

      alert('បាន Sync ទិន្នន័យទៅកាន់ Google Sheet ជោគជ័យ!');
    } catch (error: any) {
      console.error(error);
      alert(`មានបញ្ហា: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-200">Google Sheet Sync</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">បញ្ជូនទិន្នន័យ (ដែលបាន Filter) ទៅកាន់ Google Sheet</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          title="ការកំណត់ (Settings)"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0f9d58] hover:bg-[#0b8043] text-white font-bold rounded-lg shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'កំពុង Sync...' : 'Sync Now'}</span>
        </button>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">ការកំណត់ Google Sheet</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Google Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="ឧ. 1234...apps.googleusercontent.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500"
                />
                <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1">
                  <span>បង្កើត Client ID ទីនេះ</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Google Sheet Link</label>
                <input
                  type="text"
                  value={sheetLink}
                  onChange={(e) => setSheetLink(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                >
                  បិទ
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-1 py-2 bg-[#0f9d58] hover:bg-[#0b8043] text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  រក្សាទុក
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
