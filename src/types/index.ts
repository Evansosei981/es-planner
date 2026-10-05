export interface Course {
  id: number;
  name: string;
  lecturer: string;
  room: string;
  colorIndex: number;
  dayOfWeek: number; // 1 = Monday, ..., 7 = Sunday
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface Exam {
  id: number;
  courseName: string;
  examTitle: string; // e.g. "Mid Sem", "Final Exam", "Quiz 1"
  timestampMillis: number;
  colorIndex: number;
}

export interface StudySession {
  id: number;
  courseId: number;
  courseName: string;
  colorIndex: number;
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  completed: boolean;
  dateMillis: number;
  examId?: number;
  examTitle?: string;
  topic?: string;
  isRevisionBlock?: boolean;
}

export interface LearningNote {
  id: number;
  relatedId: number;
  type: "COURSE" | "STUDY_SESSION";
  title: string;
  content: string;
  videoUri?: string | null;
  audioUri?: string | null;
  dateMillis: number;
}

export interface UserProfile {
  id: number;
  name: string;
  major: string;
  notificationMinutes: number;
  themePreference: "SYSTEM" | "DARK" | "LIGHT";
  hasCompletedOnboarding: boolean;
  voiceReminderType: "STANDARD" | "CUSTOM";
  customVoiceFilePath?: string | null;
  profileImagePath?: string | null;
}

export interface WeeklyGoal {
  id: number;
  targetHoursPerWeek: number;
}

export interface CourseStudyStats {
  courseId: number;
  courseName: string;
  colorIndex: number;
  totalMinutes: number;
}

export interface AiChatSession {
  id: number;
  title: string;
  timestamp: number;
}

export interface AiChatMessage {
  id: number;
  sessionId: number;
  text: string;
  isUser: boolean;
  timestamp: number;
  isLoading?: boolean;
  isError?: boolean;
}
