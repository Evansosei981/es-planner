import React, { useState } from 'react';
import { Lock, Copy, Check, MessageCircle, KeyRound, ShieldAlert } from 'lucide-react';
import { SecurityManager } from '../utils/security';
import { useApp } from '../context/AppContext';

interface ActivationScreenProps {
  onAdminLogin: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onAdminLogin }) => {
  const { setActivated } = useApp();
  const hardwareId = SecurityManager.getHardwareId();
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminTaps, setAdminTaps] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(hardwareId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = `Hi Evans, my Hardware ID is ${hardwareId}. Can I get an activation code for ES Planner?`;
    const url = `https://api.whatsapp.com/send?phone=233201461362&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (SecurityManager.verifyActivationCode(hardwareId, codeInput)) {
      setActivated(true);
    } else {
      setErrorMessage("Invalid Activation Code");
    }
  };

  const handleVersionTap = () => {
    const next = adminTaps + 1;
    if (next >= 7) {
      setAdminTaps(0);
      onAdminLogin();
    } else {
      setAdminTaps(next);
    }
  };

  // Pre-generate valid code for quick demo reference
  const validCode = SecurityManager.generateActivationCode(hardwareId);

  return (
    <div className="min-h-screen bg-[#0B0B10] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#15151E] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#7C5CFC]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#00D4A1]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#7C5CFC]/15 flex items-center justify-center mb-5 text-[#7C5CFC] shadow-lg shadow-[#7C5CFC]/20">
            <Lock className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            App Activation
          </h1>
          <p className="text-sm text-gray-400 max-w-xs mb-6">
            To unlock ES Planner, please send your Hardware ID to Evans for your personalized key.
          </p>

          <div className="w-full mb-4 text-left">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Your Hardware ID
            </label>
            <div className="flex items-center justify-between bg-[#1D1D29] border border-white/5 rounded-2xl px-4 py-3.5">
              <span className="font-mono text-xl font-bold tracking-widest text-[#7C5CFC]">
                {hardwareId}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5 active:scale-95"
                title="Copy ID"
              >
                {copied ? <Check className="w-5 h-5 text-[#00D4A1]" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full h-12 bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.99] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all mb-6"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Send ID via WhatsApp</span>
          </button>

          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <div className="text-left">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Enter Activation Code
              </label>
              <input
                type="text"
                value={codeInput}
                onChange={e => {
                  setCodeInput(e.target.value.toUpperCase());
                  setErrorMessage(null);
                }}
                placeholder="XXX-YYY-ZZZ"
                className={`w-full bg-[#1D1D29] border ${
                  errorMessage ? 'border-red-500' : 'border-white/10 focus:border-[#7C5CFC]'
                } rounded-2xl px-4 py-3 text-center font-mono text-lg tracking-widest uppercase text-white placeholder-gray-600 outline-none transition-colors`}
              />
              {errorMessage && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {errorMessage}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-13 bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.99] text-white font-bold rounded-2xl shadow-xl shadow-[#7C5CFC]/25 transition-all text-base"
            >
              Unlock App
            </button>
          </form>

          {/* Quick autofill helper for easy testing */}
          <div className="w-full mt-4 p-3 bg-white/[0.03] border border-white/5 rounded-2xl text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Quick Demo Code:</span>
              <button
                type="button"
                onClick={() => setCodeInput(validCode)}
                className="text-[#00D4A1] hover:underline font-mono font-bold"
              >
                Autofill ({validCode})
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onAdminLogin}
              className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
            >
              <KeyRound className="w-3 h-3" />
              <span>Admin Key Generator</span>
            </button>

            {/* Secret 7-tap trigger matching Android */}
            <button
              type="button"
              onClick={handleVersionTap}
              className="text-[11px] text-gray-600 hover:text-gray-500 transition-colors cursor-pointer select-none"
            >
              ES Planner v2.0 {adminTaps > 0 ? `(${adminTaps}/7)` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
