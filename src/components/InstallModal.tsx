import React, { useState } from 'react';
import { Download, Smartphone, X, Check, ExternalLink, Sparkles, ShieldCheck, ArrowRight, Share2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'instant' | 'apk'>('instant');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-66arwelysnbd7cpaf7wogm-388248858728.europe-west2.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDirectInstall = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#15151E] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Mobile handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <header className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Install ES Planner (Android & Mobile)
              </h2>
              <p className="text-xs text-gray-400">
                Install as a native Android app on your phone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 flex items-center justify-center -mr-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Tab selection */}
        <div className="flex border-b border-white/10 pt-3 pb-2 gap-4 shrink-0">
          <button
            onClick={() => setActiveTab('instant')}
            className={`pb-2 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'instant' ? 'text-[#7C5CFC]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Android Install (WebAPK)</span>
            {activeTab === 'instant' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C5CFC] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-2 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'apk' ? 'text-[#7C5CFC]' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Standalone APK Package</span>
            {activeTab === 'apk' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C5CFC] rounded-full" />
            )}
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4">
          {activeTab === 'instant' ? (
            <div className="space-y-4">
              {/* Status banner */}
              {isInstalled ? (
                <div className="bg-[#00D4A1]/15 border border-[#00D4A1]/30 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00D4A1]/20 text-[#00D4A1] flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      App is Already Installed!
                    </span>
                    <span className="text-[11px] text-gray-300">
                      ES Planner is running in standalone mode on your device.
                    </span>
                  </div>
                </div>
              ) : isInstallable ? (
                <div className="bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-[#7C5CFC]" />
                    <span>One-Tap Android Installation Ready</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Android will generate a native WebAPK with full offline capabilities, home screen icon, and zero browser navigation bar.
                  </p>
                  <button
                    onClick={handleDirectInstall}
                    className="w-full min-h-[48px] rounded-2xl bg-[#7C5CFC] hover:bg-[#6c4be8] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#7C5CFC]/25 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App on Device</span>
                  </button>
                </div>
              ) : null}

              {/* Instructions for Android Chrome & Samsung Internet */}
              <div className="bg-[#181824] border border-white/5 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-extrabold text-white block">
                  How to install on your Android phone:
                </span>
                <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Open this app in <strong className="text-white">Google Chrome</strong> or Samsung Internet on your Android device.
                  </li>
                  <li>
                    Tap the browser menu <strong className="text-white">(⋮ 3 dots)</strong> in the top-right or bottom-right corner.
                  </li>
                  <li>
                    Select <strong className="text-[#00D4A1]">"Install app"</strong> or <strong className="text-[#00D4A1]">"Add to Home screen"</strong>.
                  </li>
                  <li>
                    Android automatically generates and registers a genuine <strong className="text-white">WebAPK</strong> onto your phone with an app icon in your app drawer!
                  </li>
                </ol>
              </div>

              {/* iOS instructions */}
              {isIOS && (
                <div className="bg-[#181824] border border-white/5 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-white block">
                    Installing on iPhone / iPad (Safari):
                  </span>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Tap the <strong className="text-white">Share button</strong> (square with arrow pointing up) at the bottom of Safari, then scroll down and tap <strong className="text-[#7C5CFC]">"Add to Home Screen"</strong>.
                  </p>
                </div>
              )}

              {/* Copy app link */}
              <div className="bg-[#1D1D29] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] text-gray-400 block">App Web Address</span>
                  <span className="text-xs font-mono text-white truncate block">
                    {currentUrl}
                  </span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="min-h-[40px] px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00D4A1]" />
                      <span className="text-[#00D4A1]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-gray-300">
              <div className="bg-[#181824] border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#00D4A1]" />
                  <span>Package into Standalone Signed APK / AAB</span>
                </div>
                <p className="leading-relaxed">
                  Because this cloud development environment is a Node/React sandbox, native Android compilation (Java JDK & Android SDK) is done using Google's official PWA-to-APK tools:
                </p>

                <div className="space-y-3 pt-1">
                  <div className="bg-[#14141E] p-3 rounded-xl border border-white/5 space-y-1.5">
                    <span className="text-white font-bold block flex items-center justify-between">
                      <span>Method 1: PWABuilder (Recommended - 1 Click)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D4A1]/20 text-[#00D4A1] font-bold">Easiest</span>
                    </span>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Go to <strong className="text-white">pwabuilder.com</strong>, paste the app URL, and click <strong className="text-white">"Package for Android"</strong> to download a signed APK or Google Play Store bundle.
                    </p>
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C5CFC] hover:underline pt-1"
                    >
                      <span>Visit PWABuilder.com</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="bg-[#14141E] p-3 rounded-xl border border-white/5 space-y-1.5">
                    <span className="text-white font-bold block flex items-center justify-between">
                      <span>Method 2: Google Bubblewrap CLI (TWA)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] font-bold">Developer</span>
                    </span>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Google's official CLI packages any PWA into a production Android APK project:
                    </p>
                    <pre className="bg-[#0B0B10] p-2.5 rounded-lg text-[10px] font-mono text-gray-300 overflow-x-auto">
                      npx @bubblewrap/cli init --manifest={currentUrl}/manifest.webmanifest{'\n'}
                      npx @bubblewrap/cli build
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-400">
            PWA & WebAPK compliant
          </span>
          <button
            onClick={onClose}
            className="min-h-[40px] px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-bold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
