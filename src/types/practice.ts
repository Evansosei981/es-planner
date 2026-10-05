export interface PracticeQuestion {
  id: string;
  userId?: string;
  courseName: string;
  subject?: string;
  category: string; // Topic (e.g. "Differentiation", "Graph Algorithms")
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string; // The correct answer text or option
  correctAnswerImageUrl?: string; // Optional image of the worked out solution
  explanation: string;
  sourceResourceId?: string;
  sourceResourceName?: string;
  sourcePage?: number | string;
  imageUrl?: string; // Captured image/diagram Base64 data URL or path
  isAiGenerated?: boolean;
  isBookmarked?: boolean;
  createdAt?: number;
}

export interface PracticeAttempt {
  questionId: string;
  selectedAnswer: string;
  answerImageUrl?: string; // Student's submitted image of handwritten solution or diagram
  isCorrect: boolean;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  courseName?: string;
  timestamp?: number;
}

export interface DailyPracticeResult {
  dayKey: string; // "YYYY-MM-DD"
  completed: boolean;
  score: number;
  total: number;
  timestamp: number;
  attempts: PracticeAttempt[];
}

export interface PracticeStreak {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDay: string | null; // "YYYY-MM-DD"
}

export interface PracticeReminderPrefs {
  enabled: boolean;
  time: string; // e.g. "20:00"
}

export interface PracticeSettings {
  dailyTarget: number; // 1, 2, 5, 10, etc.
  reminderEnabled: boolean;
  reminderTime: string; // "20:00"
  allowAiGeneratedQuestions: boolean;
  preferredCourse?: string; // 'all' or specific course name
}

export interface StudentRecordedResource {
  id: string;
  userId?: string;
  title: string;
  fileType: 'pdf' | 'image' | 'text' | 'document';
  fileName: string;
  fileSize: number;
  fileData?: string; // Stored image data URL for full visual inspection
  uploadedAt: number;
  status: 'uploading' | 'reading' | 'extracting' | 'completed' | 'failed';
  questionsCount: number;
  detectedTopics: string[];
  errorMessage?: string;
  extractedQuestionIds?: string[];
}

export interface PracticeTopicStats {
  topic: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  status: 'needs_practice' | 'moderate' | 'strong';
}

export interface PracticeOverallStats {
  totalSolved: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
  currentStreak: number;
  longestStreak: number;
  completedToday: number;
  dailyTarget: number;
  topicBreakdown: PracticeTopicStats[];
  needsPracticeTopics: string[];
  strongTopics: string[];
  difficultyBreakdown: {
    easy: { total: number; correct: number };
    medium: { total: number; correct: number };
    hard: { total: number; correct: number };
  };
}
