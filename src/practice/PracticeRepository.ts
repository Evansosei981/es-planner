import {
  PracticeQuestion,
  PracticeStreak,
  DailyPracticeResult,
  PracticeReminderPrefs,
  PracticeAttempt,
  PracticeSettings,
  StudentRecordedResource,
  PracticeOverallStats,
  PracticeTopicStats
} from '../types/practice';
import { DEFAULT_QUESTION_BANK, DEFAULT_REMINDER_TIME } from './PracticeConstants';
import { StreakCalculator } from './StreakCalculator';
import { DayKey } from './DayKey';

const STORAGE_KEY_QUESTIONS = "es_practice_questions";
const STORAGE_KEY_RESOURCES = "es_practice_resources";
const STORAGE_KEY_SETTINGS = "es_practice_settings";
const STORAGE_KEY_STREAK = "es_practice_streak";
const STORAGE_KEY_RESULTS = "es_practice_results";
const STORAGE_KEY_ATTEMPTS = "es_practice_attempts_history";
const STORAGE_KEY_SYNC_QUEUE = "es_practice_sync_queue";

export const PracticeRepository = {
  // --- Questions ---
  loadQuestions(): PracticeQuestion[] {
    const saved = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveQuestions(questions: PracticeQuestion[]): void {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
  },

  deleteQuestion(id: string): PracticeQuestion[] {
    const current = this.loadQuestions();
    const updated = current.filter(q => q.id !== id);
    this.saveQuestions(updated);
    return updated;
  },

  updateQuestion(id: string, updates: Partial<PracticeQuestion>): PracticeQuestion[] {
    const current = this.loadQuestions();
    const updated = current.map(q => (q.id === id ? { ...q, ...updates } : q));
    this.saveQuestions(updated);
    return updated;
  },

  toggleBookmarkQuestion(id: string): PracticeQuestion[] {
    const current = this.loadQuestions();
    const updated = current.map(q => (q.id === id ? { ...q, isBookmarked: !q.isBookmarked } : q));
    this.saveQuestions(updated);
    return updated;
  },

  // --- Student Resources ---
  loadResources(): StudentRecordedResource[] {
    const saved = localStorage.getItem(STORAGE_KEY_RESOURCES);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveResources(resources: StudentRecordedResource[]): void {
    localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(resources));
  },

  addResource(resource: StudentRecordedResource): void {
    const current = this.loadResources();
    this.saveResources([resource, ...current]);
  },

  updateResource(id: string, updates: Partial<StudentRecordedResource>): StudentRecordedResource[] {
    const current = this.loadResources();
    const updated = current.map(r => (r.id === id ? { ...r, ...updates } : r));
    this.saveResources(updated);
    return updated;
  },

  deleteResource(id: string, deleteExtractedQuestions: boolean = false): {
    resources: StudentRecordedResource[];
    questions: PracticeQuestion[];
  } {
    const resources = this.loadResources().filter(r => r.id !== id);
    this.saveResources(resources);

    let questions = this.loadQuestions();
    if (deleteExtractedQuestions) {
      questions = questions.filter(q => q.sourceResourceId !== id);
      this.saveQuestions(questions);
    }

    return { resources, questions };
  },

  // --- Practice Settings ---
  loadSettings(): PracticeSettings {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!saved) {
      return {
        dailyTarget: 3,
        reminderEnabled: true,
        reminderTime: DEFAULT_REMINDER_TIME,
        allowAiGeneratedQuestions: false,
        preferredCourse: 'all'
      };
    }
    try {
      const parsed = JSON.parse(saved);
      return {
        dailyTarget: 3,
        reminderEnabled: true,
        reminderTime: DEFAULT_REMINDER_TIME,
        allowAiGeneratedQuestions: false,
        preferredCourse: 'all',
        ...parsed
      };
    } catch {
      return {
        dailyTarget: 3,
        reminderEnabled: true,
        reminderTime: DEFAULT_REMINDER_TIME,
        allowAiGeneratedQuestions: false,
        preferredCourse: 'all'
      };
    }
  },

  saveSettings(settings: PracticeSettings): void {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  },

  // --- Streak ---
  loadStreak(): PracticeStreak {
    const saved = localStorage.getItem(STORAGE_KEY_STREAK);
    if (!saved) {
      return { currentStreak: 0, longestStreak: 0, lastCompletedDay: null };
    }
    try {
      return JSON.parse(saved);
    } catch {
      return { currentStreak: 0, longestStreak: 0, lastCompletedDay: null };
    }
  },

  saveStreak(streak: PracticeStreak): void {
    localStorage.setItem(STORAGE_KEY_STREAK, JSON.stringify(streak));
  },

  // --- Results & Attempts ---
  loadResults(): DailyPracticeResult[] {
    const saved = localStorage.getItem(STORAGE_KEY_RESULTS);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  },

  saveResults(results: DailyPracticeResult[]): void {
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
  },

  loadAttempts(): PracticeAttempt[] {
    const saved = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  },

  saveAttempts(attempts: PracticeAttempt[]): void {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    // Cap at 100 recent attempts and strip large image data on attempts older than 14 days
    const trimmed = attempts.slice(0, 100).map(att => {
      if (att.timestamp && att.timestamp < fourteenDaysAgo && att.answerImageUrl) {
        return { ...att, answerImageUrl: undefined };
      }
      return att;
    });

    try {
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(trimmed));
    } catch {
      // If quota is still pressed, strip all image payloads from older attempts
      const lean = trimmed.map(a => ({ ...a, answerImageUrl: undefined }));
      try {
        localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(lean));
      } catch (err) {
        console.warn("Storage quota exceeded for attempts history", err);
      }
    }
  },

  // --- Record Daily Completion ---
  recordDailyResult(
    attempts: PracticeAttempt[],
    score: number,
    total: number
  ): { result: DailyPracticeResult; updatedStreak: PracticeStreak } {
    const dayKey = DayKey.getTodayKey();
    const newResult: DailyPracticeResult = {
      dayKey,
      completed: true,
      score,
      total,
      timestamp: Date.now(),
      attempts
    };

    // Save results
    const results = this.loadResults().filter(r => r.dayKey !== dayKey);
    results.unshift(newResult);
    this.saveResults(results);

    // Save individual attempts to attempts history for topic analytics
    const pastAttempts = this.loadAttempts();
    this.saveAttempts([...attempts, ...pastAttempts]);

    // Update streak
    const currentStreak = this.loadStreak();
    const updatedStreak = StreakCalculator.recordPracticeCompletion(currentStreak);
    this.saveStreak(updatedStreak);

    // Enqueue for offline sync
    this.enqueueSync({
      type: 'DAILY_RESULT',
      payload: { result: newResult, streak: updatedStreak }
    });

    return { result: newResult, updatedStreak };
  },

  // --- Reminders ---
  loadReminderPrefs(): PracticeReminderPrefs {
    const settings = this.loadSettings();
    return {
      enabled: settings.reminderEnabled,
      time: settings.reminderTime
    };
  },

  saveReminderPrefs(prefs: PracticeReminderPrefs): void {
    const settings = this.loadSettings();
    this.saveSettings({
      ...settings,
      reminderEnabled: prefs.enabled,
      reminderTime: prefs.time
    });
  },

  // --- Analytics & Statistics ---
  calculateOverallStats(dailyTarget: number = 3): PracticeOverallStats {
    const attempts = this.loadAttempts();
    const streak = this.loadStreak();
    const results = this.loadResults();
    const today = DayKey.getTodayKey();
    const todayResult = results.find(r => r.dayKey === today);

    const totalSolved = attempts.length;
    const correctCount = attempts.filter(a => a.isCorrect).length;
    const incorrectCount = totalSolved - correctCount;
    const accuracyPercentage = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;

    // Topic performance breakdown
    const topicMap: Record<string, { total: number; correct: number }> = {};
    const difficultyMap = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 }
    };

    attempts.forEach(att => {
      const topic = att.topic || 'General';
      if (!topicMap[topic]) {
        topicMap[topic] = { total: 0, correct: 0 };
      }
      topicMap[topic].total += 1;
      if (att.isCorrect) topicMap[topic].correct += 1;

      if (att.difficulty && difficultyMap[att.difficulty]) {
        difficultyMap[att.difficulty].total += 1;
        if (att.isCorrect) difficultyMap[att.difficulty].correct += 1;
      }
    });

    const topicBreakdown: PracticeTopicStats[] = Object.keys(topicMap).map(topic => {
      const data = topicMap[topic];
      const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      let status: 'needs_practice' | 'moderate' | 'strong' = 'moderate';
      if (acc < 60) status = 'needs_practice';
      else if (acc >= 75) status = 'strong';

      return {
        topic,
        totalAttempts: data.total,
        correctAttempts: data.correct,
        accuracy: acc,
        status
      };
    });

    topicBreakdown.sort((a, b) => a.accuracy - b.accuracy);

    const needsPracticeTopics = topicBreakdown
      .filter(t => t.status === 'needs_practice' || (t.totalAttempts >= 2 && t.accuracy < 60))
      .map(t => t.topic)
      .slice(0, 4);

    const strongTopics = topicBreakdown
      .filter(t => t.status === 'strong' || (t.totalAttempts >= 2 && t.accuracy >= 75))
      .map(t => t.topic)
      .slice(0, 4);

    return {
      totalSolved,
      correctCount,
      incorrectCount,
      accuracyPercentage,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      completedToday: todayResult ? todayResult.attempts.length : 0,
      dailyTarget,
      topicBreakdown,
      needsPracticeTopics,
      strongTopics,
      difficultyBreakdown: difficultyMap
    };
  },

  // --- Offline Sync Queue ---
  enqueueSync(item: { type: string; payload: any }): void {
    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_KEY_SYNC_QUEUE) || '[]');
      queue.push({ ...item, timestamp: Date.now() });
      localStorage.setItem(STORAGE_KEY_SYNC_QUEUE, JSON.stringify(queue));
    } catch {
      // Ignore
    }
  },

  async flushSyncQueue(): Promise<boolean> {
    if (!navigator.onLine) return false;
    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_KEY_SYNC_QUEUE) || '[]');
      if (queue.length === 0) return true;

      const res = await fetch('/api/practice/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: queue })
      });

      if (res.ok) {
        localStorage.removeItem(STORAGE_KEY_SYNC_QUEUE);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
};
