import { PracticeQuestion } from '../types/practice';

export const DAILY_QUESTIONS_COUNT = 3;
export const DEFAULT_REMINDER_TIME = "20:00";

// Clean state: Bank starts completely empty with zero questions
export const DEFAULT_QUESTION_BANK: PracticeQuestion[] = [];

// Clean state: Starter pack is empty so zero sample/seed data exists
export const STARTER_PACK_QUESTIONS: PracticeQuestion[] = [];
