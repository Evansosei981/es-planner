import React from 'react';
import {
  Home,
  Calendar,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Flame,
  MessageSquare,
  User,
  Wifi,
  WifiOff,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';

interface DesktopNavProps {
  currentTab: number;
  onTabChange: (index: number) => void;
  onOpenEvansAi: () => void;
  onOpenDailyPractice: () => void;
  onProfileClick: () => void;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({
  currentTab,
  onTabChange,
  onOpenEvansAi,
  onOpenDailyPractice,
  onProfileClick
}) => {
  const { userProfile, practiceStreak, todayPracticeResult, isOnline } = useApp();

  const navItems = [
    { label: "Home", icon: Home, index: 0 },
    { label: "Classes", icon: Calendar, index: 1 },
    { label: "Journal", icon: BookOpen, index: 2 },
    { label: "Study", icon: GraduationCap, index: 3 },
    { label: "Progress", icon: TrendingUp, index: 4 }
  ];

  const studentName = userProfile.name.trim() || "Student";

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#101017] border-r border-white/5 h-screen sticky top-0 shrink-0 p-5 select-none z-30">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 mb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C5CFC] to-[#00D4A1] flex items-center justify-center font-black text-white shadow-lg shadow-[#7C5CFC]/20">
            ES
          </div>
          <div>
            <span className="text-base font-extrabold text-white tracking-tight block">
              ES Planner
            </span>
            <span className="text-[11px] font-semibold text-gray-400">
              University Workspace
            </span>
          </div>
        </div>

        {/* Online / Offline status badge */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold ${
            isOnline
              ? 'text-[#00D4A1] bg-[#00D4A1]/10'
              : 'text-[#F59E0B] bg-[#F59E0B]/10'
          }`}
          title={isOnline ? 'Online & Synced' : 'Offline Mode'}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="space-y-1.5 flex-1">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isSelected = currentTab === item.index;

          return (
            <button
              key={item.index}
              onClick={() => onTabChange(item.index)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${
                isSelected
                  ? 'bg-[rgba(109,74,255,0.12)] text-[#5B3FE0] border border-[#6D4AFF]/25 font-bold shadow-sm dark:bg-[#7C5CFC]/15 dark:text-white dark:border-[#7C5CFC]/30'
                  : 'text-[#555A70] hover:text-[#14161F] hover:bg-[#EEF0F8] dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isSelected ? 'text-[#5B3FE0] dark:text-[#7C5CFC]' : 'text-[#555A70] dark:text-gray-400'
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#5B3FE0] dark:bg-[#7C5CFC]" />
              )}
            </button>
          );
        })}

        {/* Daily Practice Action Item */}
        <div className="pt-4 mt-4 border-t border-white/5">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Daily Habits
          </div>
          <button
            onClick={onOpenDailyPractice}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#1A1A26] to-[#14141E] hover:from-[#222233] hover:to-[#1A1A26] border border-white/10 text-white font-semibold text-xs shadow-md transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🦈</span>
              <div className="text-left">
                <span className="block font-bold text-white group-hover:text-[#00D4A1] transition-colors">
                  Daily Practice
                </span>
                <span className="text-[10px] text-gray-400">
                  {todayPracticeResult?.completed ? 'Target finished' : 'Daily questions ready'}
                </span>
              </div>
            </div>

            {practiceStreak.currentStreak > 0 && (
              <span className="flex items-center gap-1 text-[#FF7A00] font-black text-xs bg-[#FF7A00]/15 px-2 py-0.5 rounded-full">
                <Flame className="w-3.5 h-3.5 fill-[#FF7A00]" />
                {practiceStreak.currentStreak}
              </span>
            )}
          </button>
        </div>

        {/* Evans Assistant Launcher */}
        <div className="pt-2">
          <button
            onClick={onOpenEvansAi}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#7C5CFC] hover:bg-[#6c4be8] text-white font-bold text-xs shadow-lg shadow-[#7C5CFC]/25 transition-all"
          >
            <img
              src="/assistant_avatar.png"
              alt="Evans"
              className="w-5 h-5 rounded-full object-cover ring-1 ring-white/40"
            />
            <span className="flex-1 text-left font-bold">Evans</span>
            <Sparkles className="w-4 h-4 text-white/80" />
          </button>
        </div>

        {/* In-app Install PWA Button (appears when browser allows installing) */}
        <div className="pt-2">
          <PWAInstallButton variant="nav" />
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="pt-4 border-t border-white/5">
        <button
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors text-left group"
        >
          {userProfile.profileImagePath ? (
            <img
              src={userProfile.profileImagePath}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center font-bold text-sm">
              {studentName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-white block truncate group-hover:text-[#7C5CFC] transition-colors">
              {studentName}
            </span>
            <span className="text-[11px] text-gray-400 block truncate">
              {userProfile.major || "University Student"}
            </span>
          </div>
          <User className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
        </button>
      </div>
    </aside>
  );
};
