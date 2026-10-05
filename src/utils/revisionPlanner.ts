import { Exam, Course, StudySession } from '../types';
import {
  ExamRevisionSettings,
  ExamRevisionPlan,
  RevisionBlock,
  DayTask,
  TimeSlot
} from '../types/planner';
import { PracticeOverallStats, PracticeQuestion } from '../types/practice';
import { findFreeSlotsForDate, parseTimeString } from './freeSlotFinder';

export const DEFAULT_REVISION_SETTINGS: ExamRevisionSettings = {
  studyWindowStart: "16:00",
  studyWindowEnd: "21:00",
  maxHoursPerDay: 2,
  blockMinutes: 50,
  breakMinutes: 10,
  daysOff: [], // e.g. [7] for Sunday off
  allowLightExamDayReview: false
};

export interface GeneratePlanOptions {
  exam: Exam;
  allExams?: Exam[];
  courses?: Course[];
  classes?: Course[];
  existingStudySessions?: StudySession[];
  dayTasks?: DayTask[];
  practiceOverallStats?: PracticeOverallStats;
  questionBank?: PracticeQuestion[];
  settings?: Partial<ExamRevisionSettings>;
  existingPlan?: ExamRevisionPlan;
  currentDate?: Date;
}

/**
 * Extracts distinct topics for a course from the question bank and practice stats,
 * weighted by weakness (lower accuracy = higher weight / more blocks).
 */
export function getWeightedCourseTopics(
  courseName: string,
  questionBank: PracticeQuestion[] = [],
  practiceStats?: PracticeOverallStats
): { topic: string; weight: number; isWeak: boolean }[] {
  const normCourse = courseName.toLowerCase().trim();

  // Find questions matching course
  const courseQuestions = questionBank.filter(
    q => (q.courseName && q.courseName.toLowerCase().trim() === normCourse) ||
         (q.subject && q.subject.toLowerCase().trim() === normCourse)
  );

  const distinctTopics = Array.from(
    new Set(courseQuestions.map(q => q.category.trim()).filter(Boolean))
  );

  // If no topics found in questions, check practice stats topic breakdown
  if (distinctTopics.length === 0 && practiceStats?.topicBreakdown) {
    practiceStats.topicBreakdown.forEach(t => {
      distinctTopics.push(t.topic);
    });
  }

  // If still empty, supply course-focused foundation topics
  if (distinctTopics.length === 0) {
    return [
      { topic: `Core ${courseName} Concepts`, weight: 2, isWeak: false },
      { topic: `${courseName} Problem Solving`, weight: 2, isWeak: true },
      { topic: `${courseName} Exam Practice`, weight: 1, isWeak: false }
    ];
  }

  const weakSet = new Set((practiceStats?.needsPracticeTopics || []).map(t => t.toLowerCase()));
  const statsMap = new Map((practiceStats?.topicBreakdown || []).map(t => [t.topic.toLowerCase(), t.accuracy]));

  return distinctTopics.map(topic => {
    const isWeak = weakSet.has(topic.toLowerCase());
    const accuracy = statsMap.get(topic.toLowerCase());

    let weight = 1; // At least 1 block per topic (Rule 3)
    if (isWeak || (accuracy !== undefined && accuracy < 60)) {
      weight = 3; // Weak topics return ~7, 3, 1 days before exam (Rule 4)
    } else if (accuracy !== undefined && accuracy < 80) {
      weight = 2;
    }

    return { topic, weight, isWeak };
  });
}

/**
 * Generates an Exam Revision Plan adhering to all 10 rules.
 */
export function generateExamRevisionPlan(options: GeneratePlanOptions): ExamRevisionPlan {
  const {
    exam,
    allExams = [],
    courses = [],
    classes = [],
    existingStudySessions = [],
    dayTasks = [],
    practiceOverallStats,
    questionBank = [],
    settings: customSettings = {},
    existingPlan,
    currentDate = new Date()
  } = options;

  const settings: ExamRevisionSettings = {
    ...DEFAULT_REVISION_SETTINGS,
    ...customSettings
  };

  const examDate = new Date(exam.timestampMillis);
  const now = new Date(currentDate);

  // Match course object if exists
  const course = courses.find(
    c => c.name.toLowerCase().trim() === exam.courseName.toLowerCase().trim()
  );
  const courseId = course?.id || 1;

  // Preserve existing completed blocks if regenerating (Rule 8)
  const completedBlocksMap = new Map<string, RevisionBlock>();
  if (existingPlan?.blocks) {
    for (const b of existingPlan.blocks) {
      if (b.completed) {
        completedBlocksMap.set(`${b.formattedDate}_${b.startHour}_${b.startMinute}`, b);
      }
    }
  }

  // 1. Determine days window: tomorrow (day + 1) to day before exam (Rule 1)
  const windowDays: Date[] = [];
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dayBeforeExam = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate() - 1);

  let iterDay = new Date(startDay);
  while (iterDay <= dayBeforeExam) {
    windowDays.push(new Date(iterDay));
    iterDay.setDate(iterDay.getDate() + 1);
  }

  // Optional light review on exam day if enabled
  if (settings.allowLightExamDayReview) {
    windowDays.push(new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate()));
  }

  const daysLeft = Math.max(0, Math.ceil((exam.timestampMillis - now.getTime()) / (1000 * 60 * 60 * 24)));

  // If exam is in under 24h, return immediate light review notice
  if (windowDays.length === 0) {
    return {
      examId: exam.id,
      examTitle: exam.examTitle,
      courseName: exam.courseName,
      examDateMillis: exam.timestampMillis,
      settings,
      blocks: [],
      unallocatedBlocksCount: 0,
      warningMessage: "Exam is in less than 24 hours. Focus on restful sleep and brief formula reviews.",
      readinessSummary: `${daysLeft === 0 ? "Today" : "Tomorrow"} · Light review recommended`,
      createdAt: Date.now()
    };
  }

  // 2. Extract weighted topics (Rule 3 & 9)
  const weightedTopics = getWeightedCourseTopics(exam.courseName, questionBank, practiceOverallStats);

  // Generate sequence of topic items to schedule
  const topicQueue: { topic: string; isPracticeReview: boolean; isWeak: boolean }[] = [];

  // Weak topics get priority
  weightedTopics.forEach(wt => {
    for (let w = 0; w < wt.weight; w++) {
      topicQueue.push({
        topic: wt.topic,
        isPracticeReview: false,
        isWeak: wt.isWeak
      });
    }
  });

  // Sort queue so weak topics are placed first
  topicQueue.sort((a, b) => (b.isWeak ? 1 : 0) - (a.isWeak ? 1 : 0));

  const totalRequiredBlocks = Math.max(topicQueue.length, windowDays.length);

  // 3. Multi-exam urgency check (Rule 6):
  // Filter other exams scheduled before this one to ensure we don't double book
  const otherExams = allExams.filter(e => e.id !== exam.id);
  // Exclude current exam's existing uncompleted revision blocks when recalculating
  const otherStudySessions = existingStudySessions.filter(
    s => !(s.examId === exam.id && !s.completed)
  );

  const scheduledBlocks: RevisionBlock[] = [];
  let topicQueueIndex = 0;
  let blockIdCounter = Date.now();

  const totalBlockDuration = settings.blockMinutes + settings.breakMinutes;
  const maxBlocksPerDay = Math.max(1, Math.floor((settings.maxHoursPerDay * 60) / totalBlockDuration));

  // Study window times
  const { hour: swStartH, minute: swStartM } = parseTimeString(settings.studyWindowStart);
  const { hour: swEndH, minute: swEndM } = parseTimeString(settings.studyWindowEnd);

  // Iterate over each day in window
  for (let dIdx = 0; dIdx < windowDays.length; dIdx++) {
    const dayDate = windowDays[dIdx];
    const jsDay = dayDate.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;

    // Days before exam countdown for this specific day
    const daysUntilExam = Math.max(0, Math.ceil((exam.timestampMillis - dayDate.getTime()) / (1000 * 60 * 60 * 24)));
    const isDayBeforeExam = daysUntilExam === 1;
    const isLastTwoDays = daysUntilExam <= 2;
    const isExamDay = daysUntilExam === 0;

    // Day before exam finishes by 20:00 (Rule 5)
    const effectiveWindowEndH = isDayBeforeExam ? Math.min(swEndH, 20) : swEndH;
    const effectiveWindowEndM = isDayBeforeExam && swEndH >= 20 ? 0 : swEndM;

    // Day before exam: max 2 blocks (Rule 5)
    const dayCapBlocks = isDayBeforeExam ? Math.min(2, maxBlocksPerDay) : isExamDay ? 1 : maxBlocksPerDay;

    // Find free slots for this day
    const freeSlots = findFreeSlotsForDate({
      date: dayDate,
      studyWindow: {
        startHour: swStartH,
        startMinute: swStartM,
        endHour: effectiveWindowEndH,
        endMinute: effectiveWindowEndM
      },
      classes,
      exams: otherExams,
      studySessions: otherStudySessions,
      dayTasks,
      daysOff: settings.daysOff,
      minDurationMinutes: settings.blockMinutes
    });

    let dayBlocksCount = 0;
    let lastTopicOnThisDay = '';

    for (const slot of freeSlots) {
      if (dayBlocksCount >= dayCapBlocks) break;

      let slotStartMinutes = slot.startHour * 60 + slot.startMinute;
      const slotEndMinutes = slot.endHour * 60 + slot.endMinute;

      while (slotStartMinutes + settings.blockMinutes <= slotEndMinutes && dayBlocksCount < dayCapBlocks) {
        const blockStartH = Math.floor(slotStartMinutes / 60);
        const blockStartM = slotStartMinutes % 60;
        const key = `${dateKey}_${blockStartH}_${blockStartM}`;

        // If block was already completed, keep it (Rule 8)
        if (completedBlocksMap.has(key)) {
          const compBlock = completedBlocksMap.get(key)!;
          scheduledBlocks.push(compBlock);
          dayBlocksCount++;
          lastTopicOnThisDay = compBlock.topic;
          slotStartMinutes += totalBlockDuration;
          continue;
        }

        // Determine topic for this block:
        let chosenTopic = "";
        let isPracticeReview = false;

        if (isLastTwoDays) {
          // Rule 5: Last 2 days: practice and reviewing mistakes only, no new topics.
          isPracticeReview = true;
          if (isDayBeforeExam) {
            chosenTopic = dayBlocksCount % 2 === 0
              ? "Final Formula & High-Yield Summary"
              : "Mistake Review & Weak Point Drill";
          } else {
            chosenTopic = dayBlocksCount % 2 === 0
              ? "Exam Simulation & Mock Practice"
              : "Practice Error Review & Formula Recap";
          }
        } else {
          // Select from topicQueue, never the same topic in two consecutive blocks on one day (Rule 3)
          let pickedIdx = -1;
          for (let q = topicQueueIndex; q < topicQueue.length; q++) {
            if (topicQueue[q].topic !== lastTopicOnThisDay) {
              pickedIdx = q;
              break;
            }
          }

          if (pickedIdx !== -1) {
            chosenTopic = topicQueue[pickedIdx].topic;
            isPracticeReview = topicQueue[pickedIdx].isPracticeReview;
            // Swap to maintain queue progress
            const item = topicQueue.splice(pickedIdx, 1)[0];
            topicQueue.push(item);
          } else if (topicQueue.length > 0) {
            chosenTopic = topicQueue[topicQueueIndex % topicQueue.length].topic;
            topicQueueIndex++;
          } else {
            chosenTopic = `Review ${exam.courseName}`;
          }
        }

        scheduledBlocks.push({
          id: ++blockIdCounter,
          examId: exam.id,
          courseId,
          courseName: exam.courseName,
          topic: chosenTopic,
          dateMillis: new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), blockStartH, blockStartM).getTime(),
          startHour: blockStartH,
          startMinute: blockStartM,
          durationMinutes: settings.blockMinutes,
          completed: false,
          isPracticeReview,
          dayNumber: dayOfWeek,
          formattedDate: dateKey
        });

        lastTopicOnThisDay = chosenTopic;
        dayBlocksCount++;
        slotStartMinutes += totalBlockDuration;
      }
    }
  }

  // 4. Capacity check & warning message (Rule 7)
  const unallocatedBlocksCount = Math.max(0, totalRequiredBlocks - scheduledBlocks.length);
  let warningMessage: string | undefined = undefined;

  if (unallocatedBlocksCount > 0) {
    const hoursNeeded = Math.ceil((unallocatedBlocksCount * totalBlockDuration) / 60);
    warningMessage = `${unallocatedBlocksCount} revision block${unallocatedBlocksCount > 1 ? 's' : ''} won't fit before the exam. Add ${hoursNeeded} hour${hoursNeeded > 1 ? 's' : ''} to your daily cap or adjust days off.`;
  }

  // 5. Readiness summary line
  const readinessSummary = `${daysLeft} days left, ${scheduledBlocks.length} blocks planned`;

  return {
    examId: exam.id,
    examTitle: exam.examTitle,
    courseName: exam.courseName,
    examDateMillis: exam.timestampMillis,
    settings,
    blocks: scheduledBlocks,
    unallocatedBlocksCount,
    warningMessage,
    readinessSummary,
    createdAt: Date.now()
  };
}
