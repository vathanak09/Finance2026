import React, { useState } from 'react';
import { RefreshCw, Settings, ExternalLink, Copy, Check, FileSpreadsheet, X, HelpCircle } from 'lucide-react';
import type { Transaction, Category } from '../../types/finance';

interface GoogleSheetSyncProps {
  filteredTxs: Transaction[];
  categories: Category[];
}

export const GoogleSheetSync: React.FC<GoogleSheetSyncProps> = ({ filteredTxs, categories }) => {
  const [webAppUrl, setWebAppUrl] = useState(localStorage.getItem('g_apps_script_url') || '');
  const [sheetViewLink, setSheetViewLink] = useState(localStorage.getItem('g_sheet_view_link') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const appsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = JSON.parse(e.postData.contents);
    
    // Clear existing data
    sheet.clear();
    
    if (rows && rows.length > 0) {
      // Write all rows at once
      sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      
      // Header styling
      var headerRange = sheet.getRange(1, 1, 1, rows[0].length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0f9d58");
      headerRange.setFontColor("#ffffff");
      
      // Auto resize columns
      sheet.autoResizeColumns(1, rows[0].length);
    }
    
    return ContentService.createTextOutput("Success")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput("Error: " + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Web App ដំណើរការដោយជោគជ័យ! រួចរាល់ក្នុងការ Sync ទិន្នន័យ។");
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = () => {
    localStorage.setItem('g_apps_script_url', webAppUrl.trim());
    localStorage.setItem('g_sheet_view_link', sheetViewLink.trim());
    setIsSettingsOpen(false);
    setSyncStatus({ type: 'success', message: 'បានរក្សាទុកការកំណត់ជោគជ័យ!' });
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleSync = async () => {
    const savedUrl = localStorage.getItem('g_apps_script_url');
    if (!savedUrl) {
      setIsSettingsOpen(true);
      return;
    }

    if (filteredTxs.length === 0) {
      alert('មិនមានទិន្នន័យត្រូវ Sync ទេ!');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      // Format rows: Header + Data
      const rows: (string | number)[][] = [
        ['No', 'Date', 'Time', 'Type', 'Category', 'Amount', 'Currency', 'Description']
      ];

      filteredTxs.forEach((t, index) => {
        const cat = categories.find(c => c.id === t.categoryId);
        rows.push([
          index + 1,
          t.date,
          t.time || '',
          t.type === 'income' ? 'Income' : 'Expense',
          cat ? cat.name : t.categoryId,
          t.amount,
          t.currency,
          t.description || ''
        ]);
      });

      // Send to Google Apps Script Web App
      await fetch(savedUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(rows),
      });

      setSyncStatus({
        type: 'success',
        message: `បាន Sync ទិន្នន័យចំនួន ${filteredTxs.length} ជួរ ទៅកាន់ Google Sheet ជោគជ័យ!`
      });
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (error: any) {
      console.error('Google Sheet Sync Error:', error);
      setSyncStatus({
        type: 'error',
        message: `បរាជ័យក្នុងការ Sync: ${error.message || 'សូមពិនិត្យមើល Web App URL ឡើងវិញ'}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Sync Button */}
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
          title="Sync ទិន្នន័យដែលកំពុងបង្ហាញទៅ Google Sheet"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'កំពុង Sync...' : 'Sync Sheet'}</span>
        </button>

        {/* View Sheet Link (if provided) */}
        {sheetViewLink && (
          <a
            href={sheetViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-colors"
            title="បើកមើល Google Sheet ក្នុងផ្ទាំងថ្មី"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">បើក Sheet</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Settings Button */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
          title="ការកំណត់ Google Sheet (Settings)"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Status Toast Notification */}
        {syncStatus && (
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg animate-fade-in ${
              syncStatus.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
            }`}
          >
            {syncStatus.message}
          </span>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                    ការកំណត់ Google Sheet Sync
                  </h3>
                  <p className="text-[11px] text-slate-500">វិធីសាស្ត្រ Google Apps Script (ងាយស្រួល & លឿន)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Web App URL Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Apps Script Web App URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Sheet View Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Sheet Link (សម្រាប់ចុចបើកមើលផ្ទាល់ - មិនទាមទារ)
                </label>
                <input
                  type="text"
                  value={sheetViewLink}
                  onChange={(e) => setSheetViewLink(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Step-by-step instructions */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 sm:p-4 space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>របៀបបង្កើត Web App URL លើ Google Sheet របស់លោកអ្នក (តែ ២ នាទី)៖</span>
                </div>

                <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>បង្កើត Google Sheet ថ្មីមួយលើ Google Drive របស់អ្នក។</li>
                  <li>ចូល Menu <b>Extensions</b> &gt; <b>Apps Script</b>។</li>
                  <li>លុបកូដចាស់ចោលទាំងអស់ រួច <b>Paste កូដខាងក្រោមនេះ</b> ចូល។</li>
                  <li>ចុច <b>Deploy</b> (ខាងលើស្តាំ) &gt; ជ្រើសយក <b>New deployment</b>។</li>
                  <li>ត្រង់ Select type ចុចរូប Gear ⚙️ រើសយក <b>Web app</b>។</li>
                  <li>ត្រង់កន្លែង <b>Who has access</b> ត្រូវប្ដូរទៅជា <b>Anyone</b> (សំខាន់បំផុត!)។</li>
                  <li>ចុច <b>Deploy</b> រួច Copy យក <b>Web app URL</b> មកបិទភ្ជាប់ (Paste) ក្នុងប្រអប់ខាងលើ។</li>
                </ol>

                {/* Code Block with Copy Button */}
                <div className="relative mt-2">
                  <div className="flex items-center justify-between bg-slate-800 text-slate-300 px-3 py-1.5 rounded-t-lg text-[11px] font-mono">
                    <span>Code.gs</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'បានចម្លង!' : 'ចម្លងកូដ (Copy)'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-b-lg text-[10px] font-mono overflow-x-auto max-h-40 leading-normal">
                    {appsScriptCode}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={saveSettings}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                រក្សាទុក
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
