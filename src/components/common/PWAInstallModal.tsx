import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, Smartphone, Laptop, CheckCircle, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-2xl space-y-5 animate-scale-up text-slate-900 dark:text-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Logo & Title */}
        <div className="flex items-center space-x-4">
          <img src="/icon.svg" alt="App Logo" className="w-16 h-16 rounded-2xl shadow-xl shadow-emerald-500/20 flex-shrink-0" />
          <div>
            <h3 className="font-extrabold text-lg leading-tight">ដំឡើងកម្មវិធីលើឧបករណ៍</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Khmer Smart Finance App</p>
          </div>
        </div>

        {/* Content based on Platform */}
        {isInstalled ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              កម្មវិធីនេះត្រូវបានដំឡើងនៅលើឧបករណ៍របស់អ្នករួចរាល់ហើយ!
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Safari Guide */
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span>របៀបដំឡើងលើ iPhone / iPad (iOS):</span>
            </div>
            
            <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 list-decimal list-inside">
              <li className="flex items-start space-x-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">១.</span>
                <span>ចុចលើប៊ូតុង <strong>Share</strong> <Share className="w-3.5 h-3.5 inline text-blue-500 mx-1 -mt-0.5" /> នៅបាតក្រោមនៃ Safari</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">២.</span>
                <span>អូសចុះក្រោម រួចជ្រើសរើស <strong>«Add to Home Screen»</strong> <PlusSquare className="w-3.5 h-3.5 inline text-emerald-500 mx-1 -mt-0.5" /></span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">៣.</span>
                <span>ចុច <strong>Add</strong> នៅខាងស្តាំលើ ដើម្បីដាក់ Icon លើ Home Screen</span>
              </li>
            </ol>
          </div>
        ) : deferredPrompt ? (
          /* Android / Windows 1-Click Install */
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              ចុចប៊ូតុងខាងក្រោមដើម្បីដំឡើង Shortcut App លើទូរស័ព្ទ Android ឬកុំព្យូទ័រ Windows របស់អ្នក ប្រើប្រាស់បានលឿនដូច App ធម្មតា!
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full py-3 bg-[#00a884] hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>ដំឡើង App ឥឡូវនេះ (Install Now)</span>
            </button>
          </div>
        ) : (
          /* Generic Guide for Android/Windows/Chrome */
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200">
              <Laptop className="w-4 h-4 text-emerald-500" />
              <span>របៀបដំឡើងលើ Android & Windows:</span>
            </div>
            <ul className="space-y-2">
              <li>• <strong>លើ Android (Chrome):</strong> ចុច Menu (ចុច ៣ ចុច <strong>⋮</strong>) ខាងស្តាំលើ ➔ រើសយក <strong>«Install app»</strong> ឬ <strong>«Add to Home screen»</strong></li>
              <li>• <strong>លើ Windows (Chrome/Edge):</strong> ចុចលើ Icon <Download className="w-3.5 h-3.5 inline text-emerald-500 mx-1" /> នៅខាងស្តាំនៃ Address Bar ➔ ចុច <strong>«Install»</strong></li>
            </ul>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
