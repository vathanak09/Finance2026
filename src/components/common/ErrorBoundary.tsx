import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React tree:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleClearAndReload = () => {
    localStorage.clear();
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">មានបញ្ហាក្នុងការបង្ហាញទិន្នន័យ</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              កម្មវិធីបានជួបប្រទះបញ្ហាបច្ចេកទេសមួយចំនួន។ សូមព្យាយាម Refresh ឡើងវិញ ឬសម្អាត Cache។
            </p>
            {this.state.error && (
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] text-rose-300 font-mono text-left max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ព្យាយាមម្តងទៀត</span>
              </button>
              <button
                onClick={this.handleClearAndReload}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                សម្អាត & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
