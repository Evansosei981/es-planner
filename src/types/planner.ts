// Types for Free-Slot Finder, Exam Revision Planner, and Day Planner

export interface TimeSlot {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface FreeSlot extends TimeSlot {
  durationMinutes: number;
}

export interface ExamRevisionSettings {
  studyWindowStart: string; // e.g. "16:00"
  studyWindowEnd: string;   // e.g. "21:00"
  maxHoursPerDay: number;   // e.g. 2
  blockMinutes: number;     // e.g. 50
  breakMinutes: number;     // e.g. 10
  daysOff: number[];        // 1=Mon, ..., 7=Sun (or specific day of week)
  allowLightExamDayReview: boolean; // default false
}

export interface RevisionBlock {
  id: number;
  examId: number;
  courseId: number;
  courseName: string;
  topic: string;
  dateMillis: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  completed: boolean;
  isPracticeReview: boolean;
  dayNumber: number; // 1-7
  formattedDate: string; // "YYYY-MM-DD"
}

export interface ExamRevisionPlan {
  examId: number;
  examTitle: string;
  courseName: string;
  examDateMillis: number;
  settings: ExamRevisionSettings;
  blocks: RevisionBlock[];
  unallocatedBlocksCount: number;
  warningMessage?: string;
  readinessSummary: string; // e.g. "4 days left, 6 blocks planned"
  createdAt: number;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export interface DayTask {
  id: string;
  title: string;
  estimatedMinutes: number; // e.g. 25, 45, 60
  priority: TaskPriority;
  courseName?: string;
  isTopPriority: boolean; // max 3 per day
  completed: boolean;
  scheduledTime?: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  };
  rolloverCount: number;
  dateKey: string; // "YYYY-MM-DD"
  createdAt: number;
}

export interface DayPlannerPrefs {
  morningNudgeEnabled: boolean;
  morningNudgeTime: string; // e.g. "08:00"
  lastNudgeDateKey?: string;
  defaultStudyWindowStart: string; // "16:00"
  defaultStudyWindowEnd: string;   // "21:00"
}
