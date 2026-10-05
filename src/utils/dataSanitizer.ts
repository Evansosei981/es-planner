import { Course, Exam, StudySession, LearningNote } from '../types';
import { PracticeQuestion } from '../types/practice';

/**
 * Trims whitespace, collapses duplicate spaces, and capitalizes titles consistently.
 * Example: "data structures " -> "Data Structures"
 */
export function sanitizeTitle(input: string): string {
  if (!input) return "";
  const cleaned = input.trim().replace(/\s+/g, ' ');
  const minorWords = new Set(['and', 'or', 'the', 'of', 'in', 'for', 'with', 'on', 'at', 'to', 'a', 'an']);

  return cleaned
    .split(' ')
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (lower === '&') return '&';
      // Keep minor words lowercase unless it's the first word
      if (index > 0 && minorWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Normalize text for case-insensitive and whitespace-insensitive comparison
 */
export function normalizeCompareText(input: string): string {
  return (input || '').toLowerCase().trim().replace(/[\s\-_]+/g, ' ');
}

/**
 * Detect duplicate classes (same normalized name, day and start time)
 */
export function detectDuplicateClass(
  courses: Course[],
  name: string,
  dayOfWeek: number,
  startHour: number,
  startMinute: number,
  excludeId?: number
): Course | null {
  const normName = normalizeCompareText(name);
  return courses.find(c => {
    if (excludeId !== undefined && c.id === excludeId) return false;
    return (
      normalizeCompareText(c.name) === normName &&
      c.dayOfWeek === dayOfWeek &&
      c.startHour === startHour &&
      c.startMinute === startMinute
    );
  }) || null;
}

/**
 * Detect duplicate exams (same course, same title, and same calendar date)
 */
export function detectDuplicateExam(
  exams: Exam[],
  courseName: string,
  examTitle: string,
  timestampMillis: number,
  excludeId?: number
): Exam | null {
  const normCourse = normalizeCompareText(courseName);
  const normTitle = normalizeCompareText(examTitle);
  const targetDate = new Date(timestampMillis).toDateString();

  return exams.find(e => {
    if (excludeId !== undefined && e.id === excludeId) return false;
    const examDate = new Date(e.timestampMillis).toDateString();
    return (
      normalizeCompareText(e.courseName) === normCourse &&
      normalizeCompareText(e.examTitle) === normTitle &&
      examDate === targetDate
    );
  }) || null;
}

/**
 * Detect duplicate practice questions by comparing normalized question text
 */
export function detectDuplicateQuestion(
  questions: PracticeQuestion[],
  questionText: string,
  excludeId?: string
): PracticeQuestion | null {
  const norm = normalizeCompareText(questionText.replace(/[^a-zA-Z0-9\s]/g, ''));
  return questions.find(q => {
    if (excludeId && q.id === excludeId) return false;
    const qNorm = normalizeCompareText(q.question.replace(/[^a-zA-Z0-9\s]/g, ''));
    return qNorm === norm;
  }) || null;
}

/**
 * Time validation: End time must strictly follow start time
 */
export function validateClassTime(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): { valid: boolean; error?: string } {
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;

  if (endTotal <= startTotal) {
    return {
      valid: false,
      error: "End time must be after start time."
    };
  }
  return { valid: true };
}

/**
 * Validate exam date (warns if date is in the past)
 */
export function validateExamDate(timestampMillis: number): { isPast: boolean; warning?: string } {
  const now = Date.now();
  // Allow a small grace buffer of 1 hour
  if (timestampMillis < now - 3600000) {
    return {
      isPast: true,
      warning: "This exam date appears to be in the past."
    };
  }
  return { isPast: false };
}

export interface DataAuditReport {
  duplicateClasses: { courseA: Course; courseB: Course }[];
  duplicateExams: { examA: Exam; examB: Exam }[];
  duplicateQuestions: { questionA: PracticeQuestion; questionB: PracticeQuestion }[];
  orphanedSessions: StudySession[];
  orphanedExams: Exam[];
  orphanedNotes: LearningNote[];
  orphanedQuestions: PracticeQuestion[];
  totalIssuesCount: number;
}

/**
 * Inspects all entities for duplicates and orphaned references
 */
export function scanDataIssues(
  courses: Course[],
  studySessions: StudySession[],
  exams: Exam[],
  learningNotes: LearningNote[],
  questionBank: PracticeQuestion[]
): DataAuditReport {
  const courseNames = new Set(courses.map(c => normalizeCompareText(c.name)));
  const courseIds = new Set(courses.map(c => c.id));

  // 1. Duplicate classes
  const duplicateClasses: { courseA: Course; courseB: Course }[] = [];
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const a = courses[i];
      const b = courses[j];
      if (
        normalizeCompareText(a.name) === normalizeCompareText(b.name) &&
        a.dayOfWeek === b.dayOfWeek &&
        a.startHour === b.startHour &&
        a.startMinute === b.startMinute
      ) {
        duplicateClasses.push({ courseA: a, courseB: b });
      }
    }
  }

  // 2. Duplicate exams
  const duplicateExams: { examA: Exam; examB: Exam }[] = [];
  for (let i = 0; i < exams.length; i++) {
    for (let j = i + 1; j < exams.length; j++) {
      const a = exams[i];
      const b = exams[j];
      if (
        normalizeCompareText(a.courseName) === normalizeCompareText(b.courseName) &&
        normalizeCompareText(a.examTitle) === normalizeCompareText(b.examTitle) &&
        new Date(a.timestampMillis).toDateString() === new Date(b.timestampMillis).toDateString()
      ) {
        duplicateExams.push({ examA: a, examB: b });
      }
    }
  }

  // 3. Duplicate questions
  const duplicateQuestions: { questionA: PracticeQuestion; questionB: PracticeQuestion }[] = [];
  for (let i = 0; i < questionBank.length; i++) {
    for (let j = i + 1; j < questionBank.length; j++) {
      const a = questionBank[i];
      const b = questionBank[j];
      const aNorm = normalizeCompareText(a.question.replace(/[^a-zA-Z0-9\s]/g, ''));
      const bNorm = normalizeCompareText(b.question.replace(/[^a-zA-Z0-9\s]/g, ''));
      if (aNorm === bNorm) {
        duplicateQuestions.push({ questionA: a, questionB: b });
      }
    }
  }

  // 4. Orphaned sessions (where courseId or courseName no longer exists)
  const orphanedSessions = courses.length > 0
    ? studySessions.filter(
        s => s.courseId !== 0 && !courseIds.has(s.courseId) && !courseNames.has(normalizeCompareText(s.courseName))
      )
    : [];

  // 5. Orphaned exams (where courseName no longer exists)
  const orphanedExams = courses.length > 0
    ? exams.filter(e => e.courseName && !courseNames.has(normalizeCompareText(e.courseName)))
    : [];

  // 6. Orphaned notes
  const orphanedNotes = courses.length > 0
    ? learningNotes.filter(
        n => n.type === 'COURSE' && n.relatedId && !courseIds.has(n.relatedId)
      )
    : [];

  // 7. Orphaned questions (referencing a specific course name that does not exist)
  const orphanedQuestions = courses.length > 0
    ? questionBank.filter(
        q => q.courseName && q.courseName !== 'General' && !courseNames.has(normalizeCompareText(q.courseName))
      )
    : [];

  const totalIssuesCount =
    duplicateClasses.length +
    duplicateExams.length +
    duplicateQuestions.length +
    orphanedSessions.length +
    orphanedExams.length +
    orphanedNotes.length +
    orphanedQuestions.length;

  return {
    duplicateClasses,
    duplicateExams,
    duplicateQuestions,
    orphanedSessions,
    orphanedExams,
    orphanedNotes,
    orphanedQuestions,
    totalIssuesCount
  };
}
