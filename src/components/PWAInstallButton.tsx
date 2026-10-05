import React, { useState } from 'react';
import { Download, Smartphone, Check, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'nav';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'secondary'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running in standalone PWA/WebAPK mode, hide button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // Only show when browser allows installing (or on iOS where standard browser prompt is unavailable)
  if (!isInstallable && !isIOS) {
    return null;
  }

  if (justInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B7A50]/15 dark:bg-[#00D4A1]/20 text-[#0B7A50] dark:text-[#00D4A1] text-xs font-bold">
        <Check className="w-3.5 h-3.5" />
        <span>Installed!</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'primary' ? (
        <button
          onClick={handleInstallClick}
          className={`min-h-[44px] px-4 rounded-xl bg-[#6D4AFF] hover:bg-[#5B3FE0] dark:bg-[#7C5CFC] dark:hover:bg-[#6c4be8] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${className}`}
          title="Install ES Planner"
        >
          <Download className="w-4 h-4" />
          <span>Install app</span>
        </button>
      ) : variant === 'nav' ? (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left bg-[rgba(109,74,255,0.08)] dark:bg-white/[0.04] text-[#5B3FE0] dark:text-gray-300 hover:text-[#14161F] dark:hover:text-white hover:bg-[rgba(109,74,255,0.15)] dark:hover:bg-white/[0.08] border border-[#6D4AFF]/20 dark:border-white/5 active:scale-98 cursor-pointer ${className}`}
          title="Install ES Planner"
        >
          <Download className="w-4 h-4 text-[#5B3FE0] dark:text-[#7C5CFC]" />
          <span className="flex-1">Install app</span>
          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-[#6D4AFF]/15 text-[#5B3FE0] dark:bg-[#7C5CFC]/20 dark:text-[#7C5CFC]">
            PWA
          </span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`min-h-[40px] px-3 rounded-xl bg-[#EEF0F8] hover:bg-[#E2E5F2] dark:bg-white/5 dark:hover:bg-white/10 active:scale-95 border border-[#D9DCE8] dark:border-white/10 text-[#14161F] dark:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${className}`}
          title="Install ES Planner"
        >
          <Download className="w-3.5 h-3.5 text-[#5B3FE0] dark:text-[#00D4A1]" />
          <span>Install app</span>
        </button>
      )}

      {/* iOS install instructions modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#15151E] dark:bg-[#15151E] light:bg-[#FFFFFF] border border-[#D9DCE8] dark:border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D9DCE8] dark:border-white/10">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#5B3FE0] dark:text-[#7C5CFC]" />
                <h3 className="text-sm font-bold text-[#14161F] dark:text-white">
                  Install on iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="text-xs text-[#555A70] dark:text-gray-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Tap the <strong className="text-[#14161F] dark:text-white">Share</strong> button in Safari's toolbar.
              </li>
              <li>
                Scroll down and tap <strong className="text-[#5B3FE0] dark:text-[#7C5CFC]">Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong className="text-[#14161F] dark:text-white">Add</strong> in the top-right corner.
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#6D4AFF] dark:bg-[#7C5CFC] text-white font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
