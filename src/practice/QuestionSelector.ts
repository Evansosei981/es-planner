import { PracticeQuestion, PracticeAttempt } from '../types/practice';
import { TextHash } from './TextHash';
import { DEFAULT_QUESTION_BANK } from './PracticeConstants';

export const QuestionSelector = {
  /**
   * Intelligently selects daily practice questions based on:
   * 1. Daily target count
   * 2. Available questions in bank
   * 3. Student past performance per topic (prioritizing topics with lower accuracy)
   * 4. Recent attempt history (avoid repeating recently solved questions)
   * 5. Topic and difficulty variety
   * 6. Deterministic seeding with dayKey for consistent daily presentation
   */
  selectDailyQuestions(
    allQuestions: PracticeQuestion[] = DEFAULT_QUESTION_BANK,
    dayKey: string,
    enrolledCourseNames: string[] = [],
    count: number = 3,
    pastAttempts: PracticeAttempt[] = [],
    allowAiGenerated: boolean = false,
    specificCourse?: string
  ): PracticeQuestion[] {
    if (!allQuestions || allQuestions.length === 0) return [];

    // Filter by specific course if user selected one
    let pool = allQuestions;
    if (specificCourse && specificCourse !== 'all' && specificCourse !== 'ALL') {
      const courseFiltered = allQuestions.filter(
        q => q.courseName.toLowerCase() === specificCourse.toLowerCase()
      );
      if (courseFiltered.length > 0) {
        pool = courseFiltered;
      }
    }

    // Filter AI-generated questions if user has disabled them
    if (!allowAiGenerated) {
      const nonAi = pool.filter(q => !q.isAiGenerated);
      if (nonAi.length > 0) pool = nonAi;
    }

    // 1. Calculate accuracy and weakness by topic from past attempts
    const topicStats: Record<string, { total: number; correct: number }> = {};
    const recentlyAnsweredQuestionIds = new Set<string>();

    // Scan attempts from the past 7 days (or last 30 attempts)
    const recentAttempts = pastAttempts.slice(0, 50);
    recentAttempts.forEach(att => {
      recentlyAnsweredQuestionIds.add(att.questionId);
      if (att.topic) {
        if (!topicStats[att.topic]) {
          topicStats[att.topic] = { total: 0, correct: 0 };
        }
        topicStats[att.topic].total += 1;
        if (att.isCorrect) {
          topicStats[att.topic].correct += 1;
        }
      }
    });

    // 2. Score and weight questions
    const seed = TextHash.hash(dayKey);

    const scoredQuestions = pool.map(q => {
      let weight = 100;

      // Prefer enrolled courses if specified
      if (enrolledCourseNames.length > 0) {
        const matchesCourse = enrolledCourseNames.some(
          c => c.toLowerCase() === q.courseName.toLowerCase()
        );
        if (matchesCourse) weight += 50;
      }

      // Adaptive weight: If student struggles on this question's topic (< 60% accuracy), boost weight
      const topicStat = topicStats[q.category];
      if (topicStat && topicStat.total >= 2) {
        const accuracy = topicStat.correct / topicStat.total;
        if (accuracy < 0.5) {
          weight += 80; // High weakness boost
        } else if (accuracy < 0.75) {
          weight += 40; // Moderate weakness boost
        } else {
          weight -= 20; // Mastered topic: deprioritize slightly to give room to weaker topics
        }
      }

      // Deprioritize recently answered questions to prevent annoying repetition
      if (recentlyAnsweredQuestionIds.has(q.id)) {
        weight -= 70;
      }

      // Deterministic jitter using TextHash of question id + dayKey
      const jitter = (TextHash.hash(q.id + seed) % 60) - 30;
      const finalScore = weight + jitter;

      return { question: q, score: finalScore };
    });

    // 3. Sort by computed adaptive score descending
    scoredQuestions.sort((a, b) => b.score - a.score);

    // 4. Ensure topic and difficulty diversity among top picks
    const selected: PracticeQuestion[] = [];
    const usedTopics = new Set<string>();

    // Pass 1: Select top questions ensuring different topics
    for (const item of scoredQuestions) {
      if (selected.length >= count) break;
      if (!usedTopics.has(item.question.category)) {
        selected.push(item.question);
        usedTopics.add(item.question.category);
      }
    }

    // Pass 2: Fill remaining slots if target count not met
    if (selected.length < count) {
      for (const item of scoredQuestions) {
        if (selected.length >= count) break;
        if (!selected.some(s => s.id === item.question.id)) {
          selected.push(item.question);
        }
      }
    }

    // If pool has fewer questions than requested, return available pool (do NOT invent fake questions)
    return selected;
  },

  /**
   * On-demand practice filter by course or topic
   */
  selectPracticeByCourse(
    allQuestions: PracticeQuestion[] = DEFAULT_QUESTION_BANK,
    courseName?: string,
    count: number = 5
  ): PracticeQuestion[] {
    let pool = allQuestions;
    if (courseName && courseName !== 'ALL') {
      const filtered = allQuestions.filter(
        q => q.courseName.toLowerCase() === courseName.toLowerCase()
      );
      if (filtered.length > 0) pool = filtered;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
};
