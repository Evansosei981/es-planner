import React, { useState } from 'react';
import { ArrowLeft, Key, Copy, Check, ShieldCheck } from 'lucide-react';
import { SecurityManager } from '../utils/security';

interface AdminScreenProps {
  onNavigateBack: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({ onNavigateBack }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [inputHwId, setInputHwId] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const MASTER_PASSWORD = "Evans";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputHwId.trim()) {
      const code = SecurityManager.generateActivationCode(inputHwId);
      setGeneratedCode(code);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B10] text-white flex flex-col">
      {/* Top Bar */}
      <header className="px-6 py-5 border-b border-white/10 flex items-center gap-4 bg-[#15151E]">
        <button
          onClick={onNavigateBack}
          className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
      </header>

      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-md bg-[#15151E] border border-white/10 rounded-3xl p-8 shadow-2xl mt-4">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#00D4A1]/15 text-[#00D4A1] flex items-center justify-center mb-5">
                <Key className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">Enter Master Password</h2>
              <p className="text-sm text-gray-400 mb-6">
                Please enter the administrative password to access the code generation system.
              </p>

              <form onSubmit={handleLogin} className="w-full space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setAuthError(false);
                    }}
                    placeholder="Enter password (hint: Evans)"
                    className={`w-full bg-[#1D1D29] border ${
                      authError ? 'border-red-500' : 'border-white/10 focus:border-[#00D4A1]'
                    } rounded-2xl px-4 py-3 text-white outline-none transition-colors`}
                  />
                  {authError && (
                    <p className="text-xs text-red-400 mt-1.5 text-left">
                      Incorrect password. Please try again.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-[#00D4A1] hover:bg-[#00be90] active:scale-[0.99] text-black font-bold rounded-2xl shadow-lg shadow-[#00D4A1]/20 transition-all"
                >
                  Login
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold mb-1">Key Generator</h2>
              <p className="text-sm text-gray-400 mb-6">
                Enter a user's Hardware ID to generate their Activation Code.
              </p>

              <form onSubmit={handleGenerate} className="w-full space-y-4 text-left">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Hardware ID
                  </label>
                  <input
                    type="text"
                    value={inputHwId}
                    onChange={e => setInputHwId(e.target.value.toUpperCase())}
                    placeholder="e.g. A7B-9X2"
                    className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-2xl px-4 py-3 font-mono text-center uppercase text-white outline-none tracking-wider"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInputHwId(SecurityManager.getHardwareId())}
                    className="flex-1 py-2 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors"
                  >
                    Paste Current Device ID
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputHwId.trim()}
                  className="w-full h-12 bg-[#7C5CFC] hover:bg-[#6c4be8] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-[#7C5CFC]/20 transition-all"
                >
                  Generate Code
                </button>
              </form>

              {generatedCode && (
                <div className="w-full mt-8 pt-6 border-t border-white/10 text-left">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Generated Activation Code
                  </label>
                  <div className="flex items-center justify-between bg-[#1D1D29] border border-[#00D4A1]/30 rounded-2xl px-4 py-3.5">
                    <span className="font-mono text-xl font-bold tracking-widest text-[#00D4A1]">
                      {generatedCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                      title="Copy code"
                    >
                      {copied ? <Check className="w-5 h-5 text-[#00D4A1]" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
