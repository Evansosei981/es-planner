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
import { DEFAULT_QUESTION_BANK } from '../practice/PracticeConstants';

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
  deleteCourse: (id: number) => void;
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

// Initial seed data if first time
const SEED_COURSES: Course[] = [
  {
    id: 1,
    name: "Data Structures & Algorithms",
    lecturer: "Dr. Evans Asante",
    room: "CS Lab 3",
    colorIndex: 0,
    dayOfWeek: 1, // Monday
    startHour: 9,
    startMinute: 0,
    endHour: 11,
    endMinute: 30
  },
  {
    id: 2,
    name: "Linear Algebra & Calculus",
    lecturer: "Prof. Mensah",
    room: "Math Hall B",
    colorIndex: 1,
    dayOfWeek: 2, // Tuesday
    startHour: 10,
    startMinute: 0,
    endHour: 12,
    endMinute: 0
  },
  {
    id: 3,
    name: "Database Systems",
    lecturer: "Dr. Osei",
    room: "Lecture Room 4",
    colorIndex: 4,
    dayOfWeek: 3, // Wednesday
    startHour: 14,
    startMinute: 0,
    endHour: 16,
    endMinute: 0
  },
  {
    id: 4,
    name: "Computer Architecture",
    lecturer: "Ing. Boateng",
    room: "Tech Hall 1",
    colorIndex: 5,
    dayOfWeek: 4, // Thursday
    startHour: 11,
    startMinute: 0,
    endHour: 13,
    endMinute: 0
  },
  {
    id: 5,
    name: "Operating Systems",
    lecturer: "Dr. Evans Asante",
    room: "CS Lab 1",
    colorIndex: 8,
    dayOfWeek: 5, // Friday
    startHour: 8,
    startMinute: 30,
    endHour: 10,
    endMinute: 30
  }
];

const SEED_SESSIONS: StudySession[] = [
  {
    id: 101,
    courseId: 1,
    courseName: "Data Structures & Algorithms",
    colorIndex: 0,
    dayOfWeek: 1,
    startHour: 16,
    startMinute: 0,
    durationMinutes: 90,
    completed: true,
    dateMillis: Date.now() - 86400000
  },
  {
    id: 102,
    courseId: 2,
    courseName: "Linear Algebra & Calculus",
    colorIndex: 1,
    dayOfWeek: 2,
    startHour: 15,
    startMinute: 0,
    durationMinutes: 60,
    completed: true,
    dateMillis: Date.now() - 43200000
  },
  {
    id: 103,
    courseId: 3,
    courseName: "Database Systems",
    colorIndex: 4,
    dayOfWeek: 3,
    startHour: 18,
    startMinute: 0,
    durationMinutes: 90,
    completed: false,
    dateMillis: Date.now()
  },
  {
    id: 104,
    courseId: 1,
    courseName: "Data Structures & Algorithms",
    colorIndex: 0,
    dayOfWeek: 4,
    startHour: 17,
    startMinute: 0,
    durationMinutes: 75,
    completed: false,
    dateMillis: Date.now() + 86400000
  },
  {
    id: 105,
    courseId: 5,
    courseName: "Operating Systems",
    colorIndex: 8,
    dayOfWeek: 5,
    startHour: 14,
    startMinute: 0,
    durationMinutes: 60,
    completed: false,
    dateMillis: Date.now() + 172800000
  }
];

const SEED_EXAMS: Exam[] = [
  {
    id: 201,
    courseName: "Data Structures & Algorithms",
    examTitle: "Mid-Semester Examination",
    timestampMillis: Date.now() + 86400000 * 4 + 3600000 * 3, // in 4 days
    colorIndex: 0
  },
  {
    id: 202,
    courseName: "Linear Algebra & Calculus",
    examTitle: "Quiz 2 - Eigenvalues & Vectors",
    timestampMillis: Date.now() + 86400000 * 8, // in 8 days
    colorIndex: 1
  },
  {
    id: 203,
    courseName: "Database Systems",
    examTitle: "SQL & Normalization Practical",
    timestampMillis: Date.now() + 86400000 * 14, // in 14 days
    colorIndex: 4
  }
];

const SEED_NOTES: LearningNote[] = [
  {
    id: 301,
    relatedId: 1,
    type: "COURSE",
    title: "Data Structures & Algorithms",
    content: "Covered AVL tree balance factors and single/double rotations. Remember: left-right rotation requires rotating child left then node right.",
    dateMillis: Date.now() - 86400000 * 2
  },
  {
    id: 302,
    relatedId: 101,
    type: "STUDY_SESSION",
    title: "Data Structures & Algorithms",
    content: "Solved 4 LeetCode tree problems. Red-Black tree insertion cases revisited. Ready for midterm!",
    dateMillis: Date.now() - 86400000
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load or initialize state from localStorage
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem("es_courses");
    return saved ? JSON.parse(saved) : SEED_COURSES;
  });

  const [studySessions, setStudySessions] = useState<StudySession[]>(() => {
    const saved = localStorage.getItem("es_study_sessions");
    return saved ? JSON.parse(saved) : SEED_SESSIONS;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem("es_exams");
    return saved ? JSON.parse(saved) : SEED_EXAMS;
  });

  const [learningNotes, setLearningNotes] = useState<LearningNote[]>(() => {
    const saved = localStorage.getItem("es_notes");
    return saved ? JSON.parse(saved) : SEED_NOTES;
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
    return saved ? JSON.parse(saved) : { id: 1, targetHoursPerWeek: 20 };
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
    const initialSession: AiChatSession = { id: 1, title: "New Chat", timestamp: Date.now() };
    return [initialSession];
  });

  const [currentAiSessionId, setCurrentAiSessionId] = useState<number | null>(() => {
    const saved = localStorage.getItem("es_ai_sessions");
    if (saved) {
      const list = JSON.parse(saved);
      return list.length > 0 ? list[0].id : null;
    }
    return 1;
  });

  const [aiChatMessages, setAiChatMessages] = useState<AiChatMessage[]>(() => {
    const saved = localStorage.getItem("es_ai_messages");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 1,
        sessionId: 1,
        text: "Hello! I am Evans, your personal academic assistant. How can I help you excel in your studies today?",
        isUser: false,
        timestamp: Date.now()
      }
    ];
  });

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Day Planner & Exam Revision State
  const [dayTasks, setDayTasks] = useState<DayTask[]>(() => {
    const saved = localStorage.getItem("es_day_tasks");
    if (saved) return JSON.parse(saved);
    const today = DayKey.getTodayKey();
    return [
      {
        id: "task-1",
        title: "Review Chapter 4 Graph Algorithms",
        estimatedMinutes: 45,
        priority: "high" as const,
        courseName: "Data Structures & Algorithms",
        isTopPriority: true,
        completed: false,
        rolloverCount: 0,
        dateKey: today,
        createdAt: Date.now() - 3600000 * 2
      },
      {
        id: "task-2",
        title: "Solve Linear Algebra Problem Set 3",
        estimatedMinutes: 50,
        priority: "medium" as const,
        courseName: "Linear Algebra & Calculus",
        isTopPriority: true,
        completed: false,
        rolloverCount: 0,
        dateKey: today,
        createdAt: Date.now() - 3600000
      },
      {
        id: "task-3",
        title: "Prepare Database Normalization summary",
        estimatedMinutes: 30,
        priority: "low" as const,
        courseName: "Database Systems",
        isTopPriority: false,
        completed: true,
        rolloverCount: 0,
        dateKey: today,
        createdAt: Date.now() - 3600000 * 3
      }
    ];
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
    const newCourse: Course = { ...course, id: Date.now() };
    setCourses(prev => [...prev, newCourse]);
    return newCourse;
  };

  const deleteCourse = (id: number) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    setStudySessions(prev => prev.filter(s => s.courseId !== id));
  };

  const addStudySession = (session: Omit<StudySession, 'id' | 'completed' | 'dateMillis'>): StudySession => {
    const newSession: StudySession = {
      ...session,
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
    const newExam: Exam = { ...exam, id: Date.now() };
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
      id: `custom-${Date.now()}`
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
    const missing = DEFAULT_QUESTION_BANK.filter(
      defQ => !current.some(q => q.id === defQ.id)
    );
    const updated = [...missing, ...current];
    PracticeRepository.saveQuestions(updated);
    setQuestionBank(updated);
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
        processUploadedResource
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
