import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  Moon,
  Sun,
  Laptop,
  Mic,
  Volume2,
  Check,
  KeyRound,
  Shield,
  HelpCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InstallModal } from './InstallModal';

interface ProfileScreenProps {
  onNavigateBack: () => void;
  onAdminLogin: () => void;
  onStartTutorial?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateBack,
  onAdminLogin,
  onStartTutorial
}) => {
  const { userProfile, updateUserProfile, weeklyGoal, updateWeeklyGoal } = useApp();

  const [name, setName] = useState(userProfile.name);
  const [major, setMajor] = useState(userProfile.major);
  const [notificationMinutes, setNotificationMinutes] = useState(userProfile.notificationMinutes || 10);
  const [targetWeeklyHours, setTargetWeeklyHours] = useState(weeklyGoal.targetHoursPerWeek || 20);
  const [theme, setTheme] = useState(userProfile.themePreference || "SYSTEM");
  const [voiceType, setVoiceType] = useState(userProfile.voiceReminderType || "STANDARD");
  const [adminTaps, setAdminTaps] = useState(0);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      major: major.trim(),
      notificationMinutes,
      themePreference: theme,
      voiceReminderType: voiceType
    });
    updateWeeklyGoal(targetWeeklyHours);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateUserProfile({ profileImagePath: reader.result as string });
      };
      reader.readAsDataURL(file);
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

  return (
    <div className="min-h-screen bg-[#0B0B10] text-white flex flex-col pb-24">
      {/* Header */}
      <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#15151E] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="min-w-[48px] min-h-[48px] -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Profile & Settings</h1>
        </div>

        <button
          onClick={handleSave}
          className="min-h-[44px] px-4 py-2 bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 max-w-lg mx-auto w-full space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-[#7C5CFC] via-[#00D4A1] to-[#7C5CFC] p-1 cursor-pointer group shadow-2xl"
          >
            <div className="w-full h-full rounded-full bg-[#15151E] flex items-center justify-center overflow-hidden relative">
              {userProfile.profileImagePath ? (
                <img
                  src={userProfile.profileImagePath}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-extrabold text-white">
                  {name.charAt(0).toUpperCase() || "S"}
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-400 mt-2">Tap photo to change avatar</span>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-[#15151E] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              Student Details
            </h3>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5 uppercase">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5 uppercase">
                Major / Field of Study
              </label>
              <input
                type="text"
                value={major}
                onChange={e => setMajor(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full bg-[#1D1D29] border border-white/10 focus:border-[#7C5CFC] rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase">
                  Weekly Study Target
                </label>
                <span className="text-xs font-bold text-[#7C5CFC]">
                  {targetWeeklyHours} hours/week
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={targetWeeklyHours}
                onChange={e => setTargetWeeklyHours(Number(e.target.value))}
                className="w-full accent-[#7C5CFC] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase">
                  Class & Exam Alert Advance
                </label>
                <span className="text-xs font-bold text-[#00D4A1]">
                  {notificationMinutes} minutes before
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={notificationMinutes}
                onChange={e => setNotificationMinutes(Number(e.target.value))}
                className="w-full accent-[#00D4A1] cursor-pointer"
              />
            </div>
          </div>

          {/* Theme & Voice Settings */}
          <div className="bg-[#15151E] border border-white/5 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
              Preferences
            </h3>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2 uppercase">
                Display Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "DARK", label: "Dark", icon: Moon },
                  { id: "LIGHT", label: "Light", icon: Sun },
                  { id: "SYSTEM", label: "System", icon: Laptop }
                ].map(t => {
                  const Icon = t.icon;
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id as any);
                        updateUserProfile({ themePreference: t.id as any });
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-[#7C5CFC] bg-[#7C5CFC]/15 text-[#7C5CFC]'
                          : 'border-white/5 bg-white/[0.02] text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2 uppercase">
                Voice Chimes & Prompts
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "STANDARD", label: "Standard Chimes", icon: Volume2 },
                  { id: "CUSTOM", label: "Custom Voice", icon: Mic }
                ].map(v => {
                  const Icon = v.icon;
                  const isSelected = voiceType === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVoiceType(v.id as any)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-[#00D4A1] bg-[#00D4A1]/15 text-[#00D4A1]'
                          : 'border-white/5 bg-white/[0.02] text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-13 bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-[0.99] text-white font-bold rounded-2xl shadow-xl shadow-[#7C5CFC]/25 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>Save Profile Settings</span>
          </button>
        </form>

        {isSavedToast && (
          <div className="p-3 bg-[#10B981]/20 border border-[#10B981]/40 rounded-2xl text-center text-xs font-bold text-[#10B981] animate-in fade-in">
            Settings saved successfully!
          </div>
        )}

        {/* Install Android App / APK Section */}
        <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D4A1]/15 text-[#00D4A1] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">Install Android App</span>
              <span className="text-xs text-gray-400">WebAPK & standalone APK guide</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-[#7C5CFC]/20"
          >
            <span>Install</span>
          </button>
        </div>

        {/* Help & Guided Tour Section */}
        {onStartTutorial && (
          <div className="bg-[#15151E] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Interactive App Tour</span>
                <span className="text-xs text-gray-400">Revisit features and tips</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onNavigateBack();
                onStartTutorial();
              }}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00D4A1]" />
              <span>Start Tour</span>
            </button>
          </div>
        )}

        {/* Admin Link & 7-Tap Secret Trigger */}
        <div className="pt-6 text-center space-y-2">
          <button
            type="button"
            onClick={onAdminLogin}
            className="text-xs text-gray-500 hover:text-gray-300 inline-flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Open Admin Panel</span>
          </button>

          <br />

          <button
            type="button"
            onClick={handleVersionTap}
            className="text-[11px] text-gray-600 hover:text-gray-500 transition-colors select-none cursor-pointer"
          >
            ES Planner v2.0 {adminTaps > 0 ? `(${adminTaps}/7)` : ''}
          </button>
        </div>
      </main>

      {/* Android Install & APK Packaging Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
