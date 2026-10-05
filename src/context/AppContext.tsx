import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Course,
  Exam,
  StudySession,
  LearningNote,
  UserProfile,
  WeeklyGoal,
  CourseStudyStats,
  AiChatSession,
  AiChatMessage
} from '../types';
import {
  PracticeQuestion,
  PracticeStreak,
  DailyPracticeResult,
  PracticeReminderPrefs,
  PracticeAttempt,
  PracticeSettings,
  StudentRecordedResource,
  PracticeOverallStats
} from '../types/practice';
import {
  DayTask,
  DayPlannerPrefs,
  ExamRevisionPlan,
  RevisionBlock
} from '../types/planner';
import { autoFitDayTasks, processTaskRollovers } from '../utils/dayPlanner';
import { parseTimeString } from '../utils/freeSlotFinder';
import { SecurityManager } from '../utils/security';
import { PracticeRepository } from '../practice/PracticeRepository';
import { QuestionSelector } from '../practice/QuestionSelector';
import { DayKey } from '../practice/DayKey';
import { DuplicateDetector } from '../practice/DuplicateDetector';
import { LocalQuestionParser } from '../practice/LocalQuestionParser';
import { DEFAULT_QUESTION_BANK, STARTER_PACK_QUESTIONS } from '../practice/PracticeConstants';
import {
  sanitizeTitle,
  normalizeCompareText,
  detectDuplicateClass,
  detectDuplicateExam,
  detectDuplicateQuestion,
  validateClassTime,
  validateExamDate,
  scanDataIssues
} from '../utils/dataSanitizer';
import { ensureCleanDataVersion, CURRENT_DATA_VERSION } from '../utils/versionMigration';

// Run version migration before app state initializes
ensureCleanDataVersion();

interface AppContextType {
  courses: Course[];
  studySessions: StudySession[];
  exams: Exam[];
  learningNotes: LearningNote[];
  userProfile: UserProfile;
  weeklyGoal: WeeklyGoal;
  isActivated: boolean;
  currentTime: number;
  
  // AI Chat state
  aiChatSessions: AiChatSession[];
  aiChatMessages: AiChatMessage[];
  currentAiSessionId: number | null;
  isGeneratingAi: boolean;
  
  // Actions
  addCourse: (course: Omit<Course, 'id'>) => Course;
  deleteCourse: (id: number, orphanAction?: 'delete' | 'unassign') => void;
  addStudySession: (session: Omit<StudySession, 'id' | 'completed' | 'dateMillis'>) => StudySession;
  toggleSessionComplete: (id: number) => void;
  deleteStudySession: (id: number) => void;
  addExam: (exam: Omit<Exam, 'id'>) => Exam;
  updateExam: (id: number, updates: Partial<Exam>) => void;
  deleteExam: (id: number) => void;
  addLearningNote: (note: Omit<LearningNote, 'id' | 'dateMillis'>) => LearningNote;
  deleteLearningNote: (id: number) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  updateWeeklyGoal: (hours: number) => void;
  completeOnboarding: (name: string, major: string, notificationMins: number) => void;
  setActivated: (activated: boolean) => void;

  // Data & Privacy / Clean Management
  resetAllData: () => void;
  clearPracticeDataOnly: () => void;
  clearJournalOnly: () => void;
  exportAllData: () => string;
  fixDataAuditIssues: () => { fixedDuplicates: number; fixedOrphans: number };

  // Day Planner & Exam Revision Planner
  dayTasks: DayTask[];
  dayPlannerPrefs: DayPlannerPrefs;
  revisionPlans: Record<number, ExamRevisionPlan>;
  tasksNeedingDecision: DayTask[];
  addDayTask: (task: Omit<DayTask, 'id' | 'createdAt' | 'completed' | 'rolloverCount' | 'dateKey'> & { dateKey?: string }) => DayTask;
  updateDayTask: (id: string, updates: Partial<DayTask>) => void;
  deleteDayTask: (id: string) => void;
  toggleDayTaskComplete: (id: string) => void;
  autoFitTodayTasks: () => { fittedCount: number; unfittedCount: number };
  resolveTaskRollover: (taskId: string, action: 'keep' | 'shorten' | 'drop', newMinutes?: number) => void;
  updateDayPlannerPrefs: (updates: Partial<DayPlannerPrefs>) => void;
  saveExamRevisionPlan: (plan: ExamRevisionPlan) => void;
  deleteExamRevisionPlan: (examId: number) => void;
  updateRevisionBlock: (examId: number, blockId: number, updates: Partial<RevisionBlock>) => void;
  
  // AI Actions
  createNewAiSession: () => AiChatSession;
  loadAiSession: (id: number) => void;
  deleteAiSession: (id: number) => void;
  sendAiMessage: (prompt: string) => Promise<void>;

  // Practice & Quiz State
  practiceStreak: PracticeStreak;
  questionBank: PracticeQuestion[];
  resources: StudentRecordedResource[];
  practiceSettings: PracticeSettings;
  todayPracticeResult: DailyPracticeResult | null;
  practiceReminder: PracticeReminderPrefs;
  dailyQuestions: PracticeQuestion[];
  practiceOverallStats: PracticeOverallStats;
  isOnline: boolean;
  completeDailyPractice: (
    attempts: PracticeAttempt[],
    score: number,
    total: number
  ) => { result: DailyPracticeResult; updatedStreak: PracticeStreak };
  updatePracticeReminder: (prefs: Partial<PracticeReminderPrefs>) => void;
  updatePracticeSettings: (settings: Partial<PracticeSettings>) => void;
  addCustomQuestion: (question: Omit<PracticeQuestion, 'id'>) => PracticeQuestion;
  deleteQuestion: (id: string) => void;
  updateQuestion: (id: string, updates: Partial<PracticeQuestion>) => void;
  toggleBookmarkQuestion: (id: string) => void;
  deleteResource: (id: string, deleteExtractedQuestions?: boolean) => void;
  loadStarterQuestionPack: () => void;
  processUploadedResource: (resourceData: {
    title: string;
    courseName: string;
    fileType: 'pdf' | 'image' | 'text' | 'document';
    fileName: string;
    text?: string;
    fileData?: string;
    mimeType?: string;
  }) => Promise<{ success: boolean; count: number; error?: string }>;
  
  // Derived state
  totalStudyMinutes: number;
  completedSessionsCount: number;
  courseStats: CourseStudyStats[];
  todaySchedule: Array<{
    type: 'class' | 'study';
    data: Course | StudySession;
    startMinutes: number;
  }>;
  upcomingExams: Exam[];
}

const AppContext = createContext<AppContextType | null>(null);

// Clean State: All collections start completely empty with zero sample data
const EMPTY_COURSES: Course[] = [];
const EMPTY_SESSIONS: StudySession[] = [];
const EMPTY_EXAMS: Exam[] = [];
const EMPTY_NOTES: LearningNote[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load or initialize state from localStorage
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem("es_courses");
    return saved ? JSON.parse(saved) : EMPTY_COURSES;
  });

  const [studySessions, setStudySessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem("es_study_sessions");
    return saved ? JSON.parse(saved) : EMPTY_SESSIONS;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem("es_exams");
    return saved ? JSON.parse(saved) : EMPTY_EXAMS;
  });

  const [learningNotes, setLearningNotes] = useState<LearningNote[]>(() => {
    const saved = localStorage.getItem("es_notes");
    return saved ? JSON.parse(saved) : EMPTY_NOTES;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("es_user_profile");
    if (saved) return JSON.parse(saved);
    return {
      id: 1,
      name: "",
      major: "",
      notificationMinutes: 10,
      themePreference: "SYSTEM",
      hasCompletedOnboarding: false,
      voiceReminderType: "STANDARD",
      customVoiceFilePath: null,
      profileImagePath: null
    };
  });

  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>(() => {
    const saved = localStorage.getItem("es_weekly_goal");
    return saved ? JSON.parse(saved) : { id: 1, targetHoursPerWeek: 0 };
  });

  // Practice & Quiz State
  const [questionBank, setQuestionBank] = useState<PracticeQuestion[]>(() => {
    return PracticeRepository.loadQuestions();
  });

  const [practiceStreak, setPracticeStreak] = useState<PracticeStreak>(() => {
    return PracticeRepository.loadStreak();
  });

  const [practiceResults, setPracticeResults] = useState<DailyPracticeResult[]>(() => {
    return PracticeRepository.loadResults();
  });

  const [practiceReminder, setPracticeReminder] = useState<PracticeReminderPrefs>(() => {
    return PracticeRepository.loadReminderPrefs();
  });

  const [resources, setResources] = useState<StudentRecordedResource[]>(() => {
    return PracticeRepository.loadResources();
  });

  const [practiceSettings, setPracticeSettings] = useState<PracticeSettings>(() => {
    return PracticeRepository.loadSettings();
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Online / Offline synchronization listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      PracticeRepository.flushSyncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isActivated, setIsActivated] = useState<boolean>(() => {
    return SecurityManager.isAppActivated();
  });

  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // AI Chat state
  const [aiChatSessions, setAiChatSessions] = useState<AiChatSession[]>(() => {
    const saved = localStorage.getItem("es_ai_sessions");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [currentAiSessionId, setCurrentAiSessionId] = useState<number | null>(() => {
    const saved = localStorage.getItem("es_ai_sessions");
    if (saved) {
      try {
        const list = JSON.parse(saved);
        return list.length > 0 ? list[0].id : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [aiChatMessages, setAiChatMessages] = useState<AiChatMessage[]>(() => {
    const saved = localStorage.getItem("es_ai_messages");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Day Planner & Exam Revision State
  const [dayTasks, setDayTasks] = useState<DayTask[]>(() => {
    const saved = localStorage.getItem("es_day_tasks");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [dayPlannerPrefs, setDayPlannerPrefs] = useState<DayPlannerPrefs>(() => {
    const saved = localStorage.getItem("es_day_planner_prefs");
    return saved ? JSON.parse(saved) : {
      morningNudgeEnabled: true,
      morningNudgeTime: "08:00",
      defaultStudyWindowStart: "16:00",
      defaultStudyWindowEnd: "21:00"
    };
  });

  const [revisionPlans, setRevisionPlans] = useState<Record<number, ExamRevisionPlan>>(() => {
    const saved = localStorage.getItem("es_revision_plans");
    return saved ? JSON.parse(saved) : {};
  });

  const [tasksNeedingDecision, setTasksNeedingDecision] = useState<DayTask[]>([]);

  // Task rollover check on mount / date change
  useEffect(() => {
    const today = DayKey.getTodayKey();
    const { updatedTasks, tasksNeedingDecision: needingDecision, rolledCount } = processTaskRollovers(dayTasks, today);
    if (rolledCount > 0) {
      setDayTasks(updatedTasks);
    }
    if (needingDecision.length > 0) {
      setTasksNeedingDecision(needingDecision);
    }
  }, []);

  // Sync dayTasks, dayPlannerPrefs, revisionPlans to localStorage
  useEffect(() => {
    localStorage.setItem("es_day_tasks", JSON.stringify(dayTasks));
  }, [dayTasks]);

  useEffect(() => {
    localStorage.setItem("es_day_planner_prefs", JSON.stringify(dayPlannerPrefs));
  }, [dayPlannerPrefs]);

  useEffect(() => {
    localStorage.setItem("es_revision_plans", JSON.stringify(revisionPlans));
  }, [revisionPlans]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("es_courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("es_study_sessions", JSON.stringify(studySessions));
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem("es_exams", JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem("es_notes", JSON.stringify(learningNotes));
  }, [learningNotes]);

  useEffect(() => {
    localStorage.setItem("es_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("es_weekly_goal", JSON.stringify(weeklyGoal));
  }, [weeklyGoal]);

  useEffect(() => {
    localStorage.setItem("es_ai_sessions", JSON.stringify(aiChatSessions));
  }, [aiChatSessions]);

  useEffect(() => {
    localStorage.setItem("es_ai_messages", JSON.stringify(aiChatMessages));
  }, [aiChatMessages]);

  // Keep theme synced with document class (dark/light)
  useEffect(() => {
    const applyTheme = () => {
      const theme = userProfile.themePreference;
      const isDark =
        theme === "DARK" ||
        (theme === "SYSTEM" && window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.documentElement.style.colorScheme = "light";
      }

      // Sync status/system bar meta theme-color with active theme
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute("content", isDark ? "#0B0B10" : "#F6F7FB");
      }
    };

    applyTheme();

    if (userProfile.themePreference === "SYSTEM") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [userProfile.themePreference]);

  // Reactive clock updating every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const addCourse = (course: Omit<Course, 'id'>): Course => {
    const sanitizedName = sanitizeTitle(course.name);
    const sanitizedLecturer = course.lecturer ? sanitizeTitle(course.lecturer) : '';
    const sanitizedRoom = course.room ? course.room.trim().replace(/\s+/g, ' ') : '';
    const newCourse: Course = {
      ...course,
      name: sanitizedName,
      lecturer: sanitizedLecturer,
      room: sanitizedRoom,
      id: Date.now()
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  };

  const deleteCourse = (id: number, orphanAction: 'delete' | 'unassign' = 'unassign') => {
    const target = courses.find(c => c.id === id);
    const courseName = target?.name;

    setCourses(prev => prev.filter(c => c.id !== id));

    if (orphanAction === 'delete') {
      setStudySessions(prev => prev.filter(s => s.courseId !== id && s.courseName !== courseName));
      setExams(prev => prev.filter(e => e.courseName !== courseName));
      setLearningNotes(prev => prev.filter(n => !(n.type === 'COURSE' && n.relatedId === id)));
      setQuestionBank(prev => {
        const updated = prev.filter(q => q.courseName !== courseName);
        PracticeRepository.saveQuestions(updated);
        return updated;
      });
    } else {
      // Reassign to "General Study" so no references are broken
      setStudySessions(prev => prev.map(s => {
        if (s.courseId === id || s.courseName === courseName) {
          return { ...s, courseId: 0, courseName: "General Study" };
        }
        return s;
      }));
      setExams(prev => prev.map(e => {
        if (e.courseName === courseName) {
          return { ...e, courseName: "General" };
        }
        return e;
      }));
      setQuestionBank(prev => {
        const updated = prev.map(q => {
          if (q.courseName === courseName) {
            return { ...q, courseName: "General" };
          }
          return q;
        });
        PracticeRepository.saveQuestions(updated);
        return updated;
      });
    }
  };

  const addStudySession = (session: Omit<StudySession, 'id' | 'completed' | 'dateMillis'>): StudySession => {
    const newSession: StudySession = {
      ...session,
      courseName: sanitizeTitle(session.courseName || "General Study"),
      id: Date.now(),
      completed: false,
      dateMillis: Date.now()
    };
    setStudySessions(prev => [...prev, newSession]);
    return newSession;
  };

  const toggleSessionComplete = (id: number) => {
    setStudySessions(prev =>
      prev.map(s => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const deleteStudySession = (id: number) => {
    setStudySessions(prev => prev.filter(s => s.id !== id));
  };

  const addExam = (exam: Omit<Exam, 'id'>): Exam => {
    const sanitizedCourse = sanitizeTitle(exam.courseName);
    const sanitizedTitle = sanitizeTitle(exam.examTitle);
    const newExam: Exam = {
      ...exam,
      courseName: sanitizedCourse,
      examTitle: sanitizedTitle,
      id: Date.now()
    };
    setExams(prev => [...prev, newExam]);
    return newExam;
  };

  const updateExam = (id: number, updates: Partial<Exam>) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    // If exam title or course changed, update associated revision plan
    if (revisionPlans[id] && (updates.examTitle || updates.courseName || updates.timestampMillis)) {
      setRevisionPlans(prev => {
        const current = prev[id];
        if (!current) return prev;
        return {
          ...prev,
          [id]: {
            ...current,
            examTitle: updates.examTitle || current.examTitle,
            courseName: updates.courseName || current.courseName,
            examDateMillis: updates.timestampMillis || current.examDateMillis
          }
        };
      });
    }
  };

  const deleteExam = (id: number) => {
    setExams(prev => prev.filter(e => e.id !== id));
    // Also remove its revision plan and revision blocks from study sessions
    setRevisionPlans(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setStudySessions(prev => prev.filter(s => s.examId !== id));
  };

  // Day Planner Handlers
  const addDayTask = (task: Omit<DayTask, 'id' | 'createdAt' | 'completed' | 'rolloverCount' | 'dateKey'> & { dateKey?: string }): DayTask => {
    const newTask: DayTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      completed: false,
      rolloverCount: 0,
      dateKey: task.dateKey || DayKey.getTodayKey(),
      createdAt: Date.now()
    };
    setDayTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateDayTask = (id: string, updates: Partial<DayTask>) => {
    setDayTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteDayTask = (id: string) => {
    setDayTasks(prev => prev.filter(t => t.id !== id));
    setTasksNeedingDecision(prev => prev.filter(t => t.id !== id));
  };

  const toggleDayTaskComplete = (id: string) => {
    setDayTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const autoFitTodayTasks = (): { fittedCount: number; unfittedCount: number } => {
    const today = new Date();
    const todayKey = DayKey.getTodayKey();
    const todayTasksList = dayTasks.filter(t => t.dateKey === todayKey);

    const { hour: sH, minute: sM } = parseTimeString(dayPlannerPrefs.defaultStudyWindowStart);
    const { hour: eH, minute: eM } = parseTimeString(dayPlannerPrefs.defaultStudyWindowEnd);

    const { fittedTasks, unfittedTasks } = autoFitDayTasks({
      date: today,
      tasks: todayTasksList,
      studyWindow: { startHour: sH, startMinute: sM, endHour: eH, endMinute: eM },
      classes: courses,
      exams,
      studySessions,
      bufferMinutes: 10
    });

    const fittedMap = new Map([...fittedTasks, ...unfittedTasks].map(t => [t.id, t]));
    setDayTasks(prev => prev.map(t => fittedMap.get(t.id) || t));

    return {
      fittedCount: fittedTasks.filter(t => !t.completed && t.scheduledTime).length,
      unfittedCount: unfittedTasks.length
    };
  };

  const resolveTaskRollover = (taskId: string, action: 'keep' | 'shorten' | 'drop', newMinutes?: number) => {
    if (action === 'drop') {
      deleteDayTask(taskId);
    } else {
      setDayTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          estimatedMinutes: action === 'shorten' && newMinutes ? newMinutes : t.estimatedMinutes,
          rolloverCount: 0 // Reset rollover after student consciously decides
        };
      }));
      setTasksNeedingDecision(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const updateDayPlannerPrefs = (updates: Partial<DayPlannerPrefs>) => {
    setDayPlannerPrefs(prev => ({ ...prev, ...updates }));
  };

  // Exam Revision Planner Handlers
  const saveExamRevisionPlan = (plan: ExamRevisionPlan) => {
    // 1. Save revision plan
    setRevisionPlans(prev => ({
      ...prev,
      [plan.examId]: plan
    }));

    // 2. Rule 10: Blocks are saved as normal study sessions tagged with the exam,
    // so existing reminders and the Study screen work!
    const targetCourse = courses.find(c => c.name.toLowerCase() === plan.courseName.toLowerCase());
    const courseId = targetCourse?.id || 1;
    const colorIndex = targetCourse?.colorIndex || 0;

    // Remove any previous uncompleted revision blocks for this exam before adding new ones
    setStudySessions(prev => {
      const filtered = prev.filter(s => !(s.examId === plan.examId && !s.completed));
      const newStudySessions: StudySession[] = plan.blocks.map(b => ({
        id: b.id,
        courseId,
        courseName: b.courseName,
        colorIndex,
        dayOfWeek: b.dayNumber,
        startHour: b.startHour,
        startMinute: b.startMinute,
        durationMinutes: b.durationMinutes,
        completed: b.completed,
        dateMillis: b.dateMillis,
        examId: b.examId,
        examTitle: plan.examTitle,
        topic: b.topic,
        isRevisionBlock: true
      }));

      return [...filtered, ...newStudySessions];
    });
  };

  const deleteExamRevisionPlan = (examId: number) => {
    setRevisionPlans(prev => {
      const next = { ...prev };
      delete next[examId];
      return next;
    });
    setStudySessions(prev => prev.filter(s => s.examId !== examId));
  };

  const updateRevisionBlock = (examId: number, blockId: number, updates: Partial<RevisionBlock>) => {
    setRevisionPlans(prev => {
      const current = prev[examId];
      if (!current) return prev;
      return {
        ...prev,
        [examId]: {
          ...current,
          blocks: current.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
        }
      };
    });

    // Also update corresponding studySession
    setStudySessions(prev => prev.map(s => {
      if (s.id === blockId) {
        return {
          ...s,
          startHour: updates.startHour !== undefined ? updates.startHour : s.startHour,
          startMinute: updates.startMinute !== undefined ? updates.startMinute : s.startMinute,
          durationMinutes: updates.durationMinutes !== undefined ? updates.durationMinutes : s.durationMinutes,
          completed: updates.completed !== undefined ? updates.completed : s.completed,
          topic: updates.topic !== undefined ? updates.topic : s.topic
        };
      }
      return s;
    }));
  };

  const addLearningNote = (note: Omit<LearningNote, 'id' | 'dateMillis'>): LearningNote => {
    const newNote: LearningNote = {
      ...note,
      title: sanitizeTitle(note.title),
      content: note.content.trim(),
      id: Date.now(),
      dateMillis: Date.now()
    };
    setLearningNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const deleteLearningNote = (id: number) => {
    setLearningNotes(prev => prev.filter(n => n.id !== id));
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  const updateWeeklyGoal = (hours: number) => {
    setWeeklyGoal({ id: 1, targetHoursPerWeek: hours });
  };

  const completeOnboarding = (name: string, major: string, notificationMins: number) => {
    setUserProfile(prev => ({
      ...prev,
      name,
      major,
      notificationMinutes: notificationMins,
      hasCompletedOnboarding: true
    }));
  };

  const setActivated = (activated: boolean) => {
    SecurityManager.setAppActivated(activated);
    setIsActivated(activated);
  };

  // AI Chat operations
  const createNewAiSession = (): AiChatSession => {
    const newSession: AiChatSession = {
      id: Date.now(),
      title: "New Chat",
      timestamp: Date.now()
    };
    setAiChatSessions(prev => [newSession, ...prev]);
    setCurrentAiSessionId(newSession.id);
    return newSession;
  };

  const loadAiSession = (id: number) => {
    setCurrentAiSessionId(id);
  };

  const deleteAiSession = (id: number) => {
    setAiChatSessions(prev => prev.filter(s => s.id !== id));
    setAiChatMessages(prev => prev.filter(m => m.sessionId !== id));
    if (currentAiSessionId === id) {
      const remaining = aiChatSessions.filter(s => s.id !== id);
      if (remaining.length > 0) {
        setCurrentAiSessionId(remaining[0].id);
      } else {
        const fresh: AiChatSession = { id: Date.now(), title: "New Chat", timestamp: Date.now() };
        setAiChatSessions([fresh]);
        setCurrentAiSessionId(fresh.id);
      }
    }
  };

  const sendAiMessage = async (prompt: string) => {
    let sessionId = currentAiSessionId;
    if (!sessionId) {
      const fresh = createNewAiSession();
      sessionId = fresh.id;
    }

    const userMsg: AiChatMessage = {
      id: Date.now(),
      sessionId,
      text: prompt,
      isUser: true,
      timestamp: Date.now()
    };

    const loadingMsgId = Date.now() + 1;
    const loadingMsg: AiChatMessage = {
      id: loadingMsgId,
      sessionId,
      text: "...",
      isUser: false,
      timestamp: Date.now() + 1,
      isLoading: true
    };

    setAiChatMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsGeneratingAi(true);

    try {
      const currentHistory = aiChatMessages.filter(m => m.sessionId === sessionId);
      const studentContext = {
        studentName: userProfile.name || "Student",
        major: userProfile.major,
        courses: courses.map(c => ({ name: c.name, lecturer: c.lecturer, room: c.room })),
        upcomingExams: upcomingExams.map(e => ({
          title: e.examTitle,
          course: e.courseName,
          daysLeft: Math.max(0, Math.ceil((e.timestampMillis - currentTime) / (1000 * 60 * 60 * 24)))
        })),
        weakTopics: practiceOverallStats.needsPracticeTopics,
        todayClasses: todaySchedule.map(s => s.type === 'class' ? (s.data as Course).name : (s.data as StudySession).courseName)
      };

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          history: currentHistory.map(m => ({ isUser: m.isUser, text: m.text })),
          studentContext
        })
      });

      if (!res.ok) {
        throw new Error("Network request failed");
      }

      const data = await res.json();
      const replyText = data.text || "I'm here to assist you! What shall we review next?";

      setAiChatMessages(prev =>
        prev
          .filter(m => m.id !== loadingMsgId)
          .concat({
            id: Date.now() + 2,
            sessionId: sessionId!,
            text: replyText,
            isUser: false,
            timestamp: Date.now() + 2
          })
      );

      // Auto update title if first message
      setAiChatSessions(prev =>
        prev.map(s => {
          if (s.id === sessionId && s.title === "New Chat") {
            const shortTitle = prompt.length > 24 ? prompt.slice(0, 24) + "..." : prompt;
            return { ...s, title: shortTitle };
          }
          return s;
        })
      );
    } catch {
      setAiChatMessages(prev =>
        prev
          .filter(m => m.id !== loadingMsgId)
          .concat({
            id: Date.now() + 2,
            sessionId: sessionId!,
            text: "Couldn't reach Evans. Check your connection.",
            isUser: false,
            isError: true,
            timestamp: Date.now() + 2
          })
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Practice Operations
  const completeDailyPractice = (
    attempts: PracticeAttempt[],
    score: number,
    total: number
  ) => {
    const { result, updatedStreak } = PracticeRepository.recordDailyResult(
      attempts,
      score,
      total
    );
    setPracticeResults(prev => [result, ...prev.filter(r => r.dayKey !== result.dayKey)]);
    setPracticeStreak(updatedStreak);
    return { result, updatedStreak };
  };

  const updatePracticeReminder = (prefs: Partial<PracticeReminderPrefs>) => {
    setPracticeReminder(prev => {
      const updated = { ...prev, ...prefs };
      PracticeRepository.saveReminderPrefs(updated);
      return updated;
    });
  };

  const updatePracticeSettings = (settings: Partial<PracticeSettings>) => {
    setPracticeSettings(prev => {
      const updated = { ...prev, ...settings };
      PracticeRepository.saveSettings(updated);
      return updated;
    });
  };

  const addCustomQuestion = (q: Omit<PracticeQuestion, 'id'>): PracticeQuestion => {
    const newQ: PracticeQuestion = {
      ...q,
      id: `custom-${Date.now()}`,
      courseName: sanitizeTitle(q.courseName || 'General'),
      category: sanitizeTitle(q.category || 'General'),
      question: q.question.trim().replace(/\s+/g, ' ')
    };
    setQuestionBank(prev => {
      const updated = [newQ, ...prev];
      PracticeRepository.saveQuestions(updated);
      return updated;
    });
    return newQ;
  };

  const deleteQuestion = (id: string) => {
    const updated = PracticeRepository.deleteQuestion(id);
    setQuestionBank(updated);
  };

  const updateQuestion = (id: string, updates: Partial<PracticeQuestion>) => {
    const updated = PracticeRepository.updateQuestion(id, updates);
    setQuestionBank(updated);
  };

  const toggleBookmarkQuestion = (id: string) => {
    const updated = PracticeRepository.toggleBookmarkQuestion(id);
    setQuestionBank(updated);
  };

  const deleteResource = (id: string, deleteExtractedQuestions: boolean = false) => {
    const { resources: updatedResources, questions: updatedQuestions } =
      PracticeRepository.deleteResource(id, deleteExtractedQuestions);
    setResources(updatedResources);
    if (deleteExtractedQuestions) {
      setQuestionBank(updatedQuestions);
    }
  };

  const loadStarterQuestionPack = () => {
    const current = questionBank;
    const missing = STARTER_PACK_QUESTIONS.filter(
      defQ => !current.some(q => q.id === defQ.id)
    );
    const updated = [...missing, ...current];
    PracticeRepository.saveQuestions(updated);
    setQuestionBank(updated);
  };

  // Data & Privacy Management
  const resetAllData = () => {
    const keysToRemove = [
      "es_courses",
      "es_study_sessions",
      "es_exams",
      "es_notes",
      "es_learning_notes",
      "es_user_profile",
      "es_weekly_goal",
      "es_day_tasks",
      "es_day_planner_prefs",
      "es_exam_revision_plans",
      "es_practice_questions",
      "es_practice_resources",
      "es_practice_settings",
      "es_practice_streak",
      "es_practice_results",
      "es_practice_attempts_history",
      "es_practice_sync_queue",
      "es_ai_sessions",
      "es_ai_messages",
      "es_active_tab",
      "es_has_seen_tutorial"
    ];
    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // Ignore
      }
    });

    setCourses([]);
    setStudySessions([]);
    setExams([]);
    setLearningNotes([]);
    setQuestionBank([]);
    setResources([]);
    setPracticeResults([]);
    setDayTasks([]);
    setRevisionPlans({});
    setAiChatSessions([]);
    setAiChatMessages([]);
    setCurrentAiSessionId(null);
    setPracticeStreak({ currentStreak: 0, longestStreak: 0, lastCompletedDay: null });
    setPracticeSettings({
      dailyTarget: 3,
      reminderEnabled: true,
      reminderTime: "20:00",
      allowAiGeneratedQuestions: false,
      preferredCourse: 'all'
    });
    setWeeklyGoal({ id: 1, targetHoursPerWeek: 0 });
    setUserProfile({
      id: 1,
      name: "",
      major: "",
      notificationMinutes: 10,
      themePreference: "SYSTEM",
      hasCompletedOnboarding: false,
      voiceReminderType: "STANDARD",
      customVoiceFilePath: null,
      profileImagePath: null
    });
  };

  const clearPracticeDataOnly = () => {
    const practiceKeys = [
      "es_practice_questions",
      "es_practice_resources",
      "es_practice_streak",
      "es_practice_results",
      "es_practice_attempts_history",
      "es_practice_sync_queue"
    ];
    practiceKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {
        // Ignore
      }
    });
    setQuestionBank([]);
    setResources([]);
    setPracticeResults([]);
    setPracticeStreak({ currentStreak: 0, longestStreak: 0, lastCompletedDay: null });
  };

  const clearJournalOnly = () => {
    try {
      localStorage.removeItem("es_notes");
    } catch {
      // Ignore
    }
    setLearningNotes([]);
  };

  const exportAllData = (): string => {
    const backup = {
      exportDate: new Date().toISOString(),
      version: CURRENT_DATA_VERSION,
      courses,
      studySessions,
      exams,
      learningNotes,
      userProfile,
      weeklyGoal,
      dayTasks,
      dayPlannerPrefs,
      revisionPlans,
      questionBank,
      resources,
      practiceSettings,
      practiceStreak,
      practiceResults
    };
    return JSON.stringify(backup, null, 2);
  };

  const fixDataAuditIssues = (): { fixedDuplicates: number; fixedOrphans: number } => {
    const seenClasses = new Set<string>();
    const cleanCourses: Course[] = [];
    let fixedDuplicates = 0;
    courses.forEach(c => {
      const key = `${normalizeCompareText(c.name)}_${c.dayOfWeek}_${c.startHour}_${c.startMinute}`;
      if (!seenClasses.has(key)) {
        seenClasses.add(key);
        cleanCourses.push(c);
      } else {
        fixedDuplicates++;
      }
    });

    const seenExams = new Set<string>();
    const cleanExams: Exam[] = [];
    exams.forEach(e => {
      const key = `${normalizeCompareText(e.courseName)}_${normalizeCompareText(e.examTitle)}_${new Date(e.timestampMillis).toDateString()}`;
      if (!seenExams.has(key)) {
        seenExams.add(key);
        cleanExams.push(e);
      } else {
        fixedDuplicates++;
      }
    });

    const seenQuestions = new Set<string>();
    const cleanQuestions: PracticeQuestion[] = [];
    questionBank.forEach(q => {
      const key = normalizeCompareText(q.question.replace(/[^a-zA-Z0-9\s]/g, ''));
      if (!seenQuestions.has(key)) {
        seenQuestions.add(key);
        cleanQuestions.push(q);
      } else {
        fixedDuplicates++;
      }
    });

    const validCourseNames = new Set(cleanCourses.map(c => normalizeCompareText(c.name)));
    const validCourseIds = new Set(cleanCourses.map(c => c.id));
    let fixedOrphans = 0;

    const cleanSessions = studySessions.map(s => {
      if (s.courseId !== 0 && !validCourseIds.has(s.courseId) && !validCourseNames.has(normalizeCompareText(s.courseName))) {
        fixedOrphans++;
        return { ...s, courseId: 0, courseName: "General Study" };
      }
      return s;
    });

    setCourses(cleanCourses);
    setExams(cleanExams);
    setQuestionBank(cleanQuestions);
    PracticeRepository.saveQuestions(cleanQuestions);
    setStudySessions(cleanSessions);

    return { fixedDuplicates, fixedOrphans };
  };

  const processUploadedResource = async (resourceData: {
    title: string;
    courseName: string;
    fileType: 'pdf' | 'image' | 'text' | 'document';
    fileName: string;
    text?: string;
    fileData?: string;
    mimeType?: string;
  }): Promise<{ success: boolean; count: number; error?: string }> => {
    const resourceId = `res-${Date.now()}`;
    const newResource: StudentRecordedResource = {
      id: resourceId,
      title: resourceData.title || resourceData.fileName || 'Uploaded Material',
      fileType: resourceData.fileType,
      fileName: resourceData.fileName,
      fileSize: resourceData.text ? resourceData.text.length : 1024,
      fileData: resourceData.fileType === 'image' ? resourceData.fileData : undefined,
      uploadedAt: Date.now(),
      status: 'reading',
      questionsCount: 0,
      detectedTopics: []
    };

    // Add pending resource to state & storage
    PracticeRepository.addResource(newResource);
    setResources(prev => [newResource, ...prev]);

    try {
      // Step 1: reading -> extracting
      PracticeRepository.updateResource(resourceId, { status: 'extracting' });
      setResources(prev =>
        prev.map(r => (r.id === resourceId ? { ...r, status: 'extracting' } : r))
      );

      let extractedQuestions: PracticeQuestion[] = [];
      let detectedTopics: string[] = [];

      // Try AI extraction endpoint first
      if (isOnline) {
        try {
          const res = await fetch('/api/ai/extract-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: resourceData.text,
              fileData: resourceData.fileData,
              mimeType: resourceData.mimeType,
              fileName: resourceData.fileName,
              resourceTitle: resourceData.title,
              courseName: resourceData.courseName
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.questions) && data.questions.length > 0) {
              extractedQuestions = data.questions.map((q: any, idx: number) => ({
                ...q,
                id: `ai-ext-${Date.now()}-${idx}`,
                sourceResourceId: resourceId,
                sourceResourceName: resourceData.title || resourceData.fileName,
                courseName: resourceData.courseName,
                imageUrl: resourceData.fileType === 'image' && resourceData.fileData ? resourceData.fileData : (q.imageUrl || undefined),
                createdAt: Date.now()
              }));
              detectedTopics = data.detectedTopics || [];
            }
          }
        } catch (apiErr) {
          console.warn('Backend extraction network error, trying local parser fallback', apiErr);
        }
      }

      // If AI did not return questions, use local smart fallback parser
      if (extractedQuestions.length === 0 && resourceData.text) {
        extractedQuestions = LocalQuestionParser.parseTextToQuestions(
          resourceData.text,
          resourceData.courseName,
          resourceId,
          resourceData.title || resourceData.fileName
        ).map(q => ({
          ...q,
          imageUrl: resourceData.fileType === 'image' && resourceData.fileData ? resourceData.fileData : undefined
        }));
        detectedTopics = Array.from(new Set(extractedQuestions.map(q => q.category)));
      }

      if (extractedQuestions.length === 0) {
        // Fallback: create 1 starter review question from document title if parsing could not split
        extractedQuestions = [
          {
            id: `manual-ext-${Date.now()}`,
            courseName: resourceData.courseName,
            subject: resourceData.courseName,
            category: 'Core Concepts',
            difficulty: 'medium',
            question: `Review and solve the exercise shown in the uploaded image "${resourceData.title}". What is the final calculated result or answer?`,
            type: 'short_answer',
            options: [],
            correctAnswer: 'Review uploaded problem',
            explanation: `Refer to the uploaded image for the problem statement and step-by-step solution.`,
            sourceResourceId: resourceId,
            sourceResourceName: resourceData.title,
            imageUrl: resourceData.fileType === 'image' && resourceData.fileData ? resourceData.fileData : undefined,
            createdAt: Date.now()
          }
        ];
        detectedTopics = ['Core Concepts'];
      }

      // Duplicate detection against existing question bank
      const nonDuplicateQuestions: PracticeQuestion[] = [];
      const currentBank = PracticeRepository.loadQuestions();

      for (const q of extractedQuestions) {
        const dup = DuplicateDetector.findDuplicateQuestion(q.question, currentBank);
        if (!dup) {
          nonDuplicateQuestions.push(q);
        }
      }

      // Update question bank
      const updatedBank = [...nonDuplicateQuestions, ...currentBank];
      PracticeRepository.saveQuestions(updatedBank);
      setQuestionBank(updatedBank);

      // Mark resource as completed
      const updatedRes = PracticeRepository.updateResource(resourceId, {
        status: 'completed',
        questionsCount: nonDuplicateQuestions.length,
        detectedTopics,
        extractedQuestionIds: nonDuplicateQuestions.map(q => q.id)
      });
      setResources(updatedRes);

      return { success: true, count: nonDuplicateQuestions.length };
    } catch (err: any) {
      const errorMsg = err?.message || 'We could not process this resource. Please try again or upload a clearer file.';
      const updatedRes = PracticeRepository.updateResource(resourceId, {
        status: 'failed',
        errorMessage: errorMsg
      });
      setResources(updatedRes);
      return { success: false, count: 0, error: errorMsg };
    }
  };

  const todayPracticeResult = useMemo(() => {
    const today = DayKey.getTodayKey();
    return practiceResults.find(r => r.dayKey === today) || null;
  }, [practiceResults]);

  const dailyQuestions = useMemo(() => {
    const today = DayKey.getTodayKey();
    const enrolledCourseNames = courses.map(c => c.name);
    const pastAttempts = PracticeRepository.loadAttempts();
    return QuestionSelector.selectDailyQuestions(
      questionBank,
      today,
      enrolledCourseNames,
      practiceSettings.dailyTarget,
      pastAttempts,
      practiceSettings.allowAiGeneratedQuestions,
      practiceSettings.preferredCourse
    );
  }, [
    questionBank,
    courses,
    practiceSettings.dailyTarget,
    practiceSettings.allowAiGeneratedQuestions,
    practiceSettings.preferredCourse
  ]);

  const practiceOverallStats = useMemo(() => {
    return PracticeRepository.calculateOverallStats(practiceSettings.dailyTarget);
  }, [practiceResults, questionBank, practiceStreak, practiceSettings.dailyTarget]);

  // Derived calculations
  const totalStudyMinutes = useMemo(() => {
    return studySessions
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [studySessions]);

  const completedSessionsCount = useMemo(() => {
    return studySessions.filter(s => s.completed).length;
  }, [studySessions]);

  const courseStats = useMemo(() => {
    const map = new Map<number, CourseStudyStats>();
    courses.forEach(c => {
      map.set(c.id, {
        courseId: c.id,
        courseName: c.name,
        colorIndex: c.colorIndex,
        totalMinutes: 0
      });
    });

    studySessions
      .filter(s => s.completed)
      .forEach(s => {
        const existing = map.get(s.courseId);
        if (existing) {
          existing.totalMinutes += s.durationMinutes;
        } else {
          map.set(s.courseId, {
            courseId: s.courseId,
            courseName: s.courseName,
            colorIndex: s.colorIndex,
            totalMinutes: s.durationMinutes
          });
        }
      });

    return Array.from(map.values()).filter(c => c.totalMinutes > 0);
  }, [courses, studySessions]);

  const todaySchedule = useMemo(() => {
    const now = new Date();
    // JS getDay(): 0 is Sunday, 1 is Monday ...
    const jsDay = now.getDay();
    const currentDow = jsDay === 0 ? 7 : jsDay;

    const todaysCourses = courses
      .filter(c => c.dayOfWeek === currentDow)
      .map(c => ({
        type: 'class' as const,
        data: c,
        startMinutes: c.startHour * 60 + c.startMinute
      }));

    const todaysSessions = studySessions
      .filter(s => s.dayOfWeek === currentDow)
      .map(s => ({
        type: 'study' as const,
        data: s,
        startMinutes: s.startHour * 60 + s.startMinute
      }));

    return [...todaysCourses, ...todaysSessions].sort((a, b) => a.startMinutes - b.startMinutes);
  }, [courses, studySessions]);

  const upcomingExams = useMemo(() => {
    const now = Date.now();
    return exams
      .filter(e => e.timestampMillis >= now - 86400000)
      .sort((a, b) => a.timestampMillis - b.timestampMillis);
  }, [exams]);

  return (
    <AppContext.Provider
      value={{
        courses,
        studySessions,
        exams,
        learningNotes,
        userProfile,
        weeklyGoal,
        isActivated,
        currentTime,
        aiChatSessions,
        aiChatMessages,
        currentAiSessionId,
        isGeneratingAi,
        addCourse,
        deleteCourse,
        addStudySession,
        toggleSessionComplete,
        deleteStudySession,
        addExam,
        updateExam,
        deleteExam,
        addLearningNote,
        deleteLearningNote,
        updateUserProfile,
        updateWeeklyGoal,
        completeOnboarding,
        setActivated,

        // Day Planner & Exam Revision Planner
        dayTasks,
        dayPlannerPrefs,
        revisionPlans,
        tasksNeedingDecision,
        addDayTask,
        updateDayTask,
        deleteDayTask,
        toggleDayTaskComplete,
        autoFitTodayTasks,
        resolveTaskRollover,
        updateDayPlannerPrefs,
        saveExamRevisionPlan,
        deleteExamRevisionPlan,
        updateRevisionBlock,

        createNewAiSession,
        loadAiSession,
        deleteAiSession,
        sendAiMessage,
        totalStudyMinutes,
        completedSessionsCount,
        courseStats,
        todaySchedule,
        upcomingExams,
        practiceStreak,
        questionBank,
        resources,
        practiceSettings,
        todayPracticeResult,
        practiceReminder,
        dailyQuestions,
        practiceOverallStats,
        isOnline,
        completeDailyPractice,
        updatePracticeReminder,
        updatePracticeSettings,
        addCustomQuestion,
        deleteQuestion,
        updateQuestion,
        toggleBookmarkQuestion,
        deleteResource,
        loadStarterQuestionPack,
        processUploadedResource,

        // Data & Privacy Management
        resetAllData,
        clearPracticeDataOnly,
        clearJournalOnly,
        exportAllData,
        fixDataAuditIssues
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
