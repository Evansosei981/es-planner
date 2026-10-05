import { PracticeStreak } from '../types/practice';
import { DayKey } from './DayKey';

export const StreakCalculator = {
  recordPracticeCompletion(
    currentStreakData: PracticeStreak,
    completionDate: Date = new Date()
  ): PracticeStreak {
    const todayKey = DayKey.fromDate(completionDate);
    const lastDay = currentStreakData.lastCompletedDay;

    // Already completed today: keep streak unchanged
    if (lastDay === todayKey) {
      return currentStreakData;
    }

    const yesterdayKey = DayKey.getYesterdayKey();

    let newCurrentStreak = 1;
    if (lastDay === yesterdayKey) {
      newCurrentStreak = currentStreakData.currentStreak + 1;
    }

    const newLongestStreak = Math.max(
      currentStreakData.longestStreak,
      newCurrentStreak
    );

    return {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastCompletedDay: todayKey
    };
  },

  getCurrentStreakStatus(streakData: PracticeStreak): {
    streak: number;
    isCompletedToday: boolean;
    isActive: boolean;
  } {
    const todayKey = DayKey.getTodayKey();
    const yesterdayKey = DayKey.getYesterdayKey();
    const last = streakData.lastCompletedDay;

    if (last === todayKey) {
      return {
        streak: streakData.currentStreak,
        isCompletedToday: true,
        isActive: true
      };
    }

    if (last === yesterdayKey) {
      return {
        streak: streakData.currentStreak,
        isCompletedToday: false,
        isActive: true
      };
    }

    // Streak expired / zero
    return {
      streak: 0,
      isCompletedToday: false,
      isActive: false
    };
  }
};
