import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Periodic check for new updates every hour
        setInterval(() => {
          r.update().catch(err => console.debug('SW update check:', err));
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.debug('SW registration error:', error);
    }
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom duration-300 max-w-sm w-[calc(100vw-2rem)]">
      <div className="bg-[#15151E] dark:bg-[#15151E] light:bg-[#FFFFFF] border border-[#7C5CFC]/40 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white dark:text-white light:text-[#14161F] truncate">
              New version available
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-400 light:text-[#555A70] truncate">
              Update to get the latest features
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-1.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-[#7C5CFC]/25 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
