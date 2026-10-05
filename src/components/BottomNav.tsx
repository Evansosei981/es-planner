import React from 'react';
import { Home, Calendar, BookOpen, GraduationCap, TrendingUp, Flame } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BottomNavProps {
  currentTab: number;
  onTabChange: (index: number) => void;
  onOpenEvansAi: () => void;
  onOpenDailyPractice?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenEvansAi,
  onOpenDailyPractice
}) => {
  const { practiceStreak, todayPracticeResult } = useApp();

  const tabs = [
    { label: "Home", icon: Home, index: 0 },
    { label: "Classes", icon: Calendar, index: 1 },
    { label: "Journal", icon: BookOpen, index: 2 },
    { label: "Study", icon: GraduationCap, index: 3 },
    { label: "Progress", icon: TrendingUp, index: 4 }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-4 px-4 sm:px-8 max-w-lg mx-auto">
      {/* Floating Action: Only one primary floating action (Evans) */}
      <div className="flex justify-end items-center mb-3 pointer-events-auto pr-1">
        <button
          onClick={onOpenEvansAi}
          className="group relative flex items-center gap-2.5 h-12 pl-2.5 pr-4 rounded-full bg-[#7C5CFC] hover:bg-[#6c4be8] active:scale-95 text-white shadow-xl shadow-[#7C5CFC]/35 transition-all border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          title="Evans Study Tutor"
          aria-label="Evans study tutor"
        >
          <img
            src="/assistant_avatar.png"
            alt="Evans"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30 shrink-0"
          />
          <span className="text-xs font-extrabold tracking-tight">Evans</span>
          <span className="w-2 h-2 rounded-full bg-[#00D4A1] absolute top-1.5 right-2" />
        </button>
      </div>

      {/* Modern Curved Nav Bar */}
      <nav className="pointer-events-auto bg-[#121218]/95 dark:bg-[#121218]/95 backdrop-blur-xl border border-white/10 dark:border-white/10 rounded-full px-3 py-2 shadow-2xl flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isSelected = currentTab === tab.index;
          return (
            <button
              key={tab.index}
              onClick={() => onTabChange(tab.index)}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2.5 rounded-full transition-all relative select-none ${
                isSelected
                  ? 'text-[#5B3FE0] dark:text-[#7C5CFC] font-extrabold'
                  : 'text-[#555A70] hover:text-[#14161F] dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              aria-label={tab.label}
              aria-current={isSelected ? 'page' : undefined}
            >
              <div
                className={`p-1.5 rounded-full transition-colors ${
                  isSelected
                    ? 'bg-[rgba(109,74,255,0.12)] text-[#5B3FE0] dark:bg-[#7C5CFC]/15 dark:text-[#7C5CFC]'
                    : 'text-[#555A70] dark:text-gray-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className={`text-[10px] tracking-tight leading-tight ${
                isSelected
                  ? 'font-black text-[#5B3FE0] dark:text-[#7C5CFC]'
                  : 'font-medium text-[#555A70] dark:text-gray-400'
              }`}>
                {tab.label}
              </span>
              {isSelected && (
                <span className="w-1 h-1 rounded-full bg-[#5B3FE0] dark:bg-[#7C5CFC] absolute bottom-1" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
