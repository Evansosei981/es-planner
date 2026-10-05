import { PracticeQuestion, StudentRecordedResource } from '../types/practice';

export const DuplicateDetector = {
  /**
   * Normalizes text for similarity comparison (lowercase, alphanumeric only)
   */
  normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  },

  /**
   * Checks if a question with substantially identical text already exists
   */
  findDuplicateQuestion(
    newQuestionText: string,
    existingQuestions: PracticeQuestion[]
  ): PracticeQuestion | null {
    const normalizedNew = this.normalizeText(newQuestionText);
    if (!normalizedNew || normalizedNew.length < 5) return null;

    for (const q of existingQuestions) {
      const normalizedExisting = this.normalizeText(q.question);
      if (normalizedNew === normalizedExisting) {
        return q;
      }
      // Check 90%+ substring similarity for long questions
      if (normalizedNew.length > 30 && normalizedExisting.length > 30) {
        if (
          normalizedNew.includes(normalizedExisting.slice(0, 30)) ||
          normalizedExisting.includes(normalizedNew.slice(0, 30))
        ) {
          // Verify length similarity
          const lenDiff = Math.abs(normalizedNew.length - normalizedExisting.length);
          if (lenDiff < 10) return q;
        }
      }
    }
    return null;
  },

  /**
   * Checks if a resource with the same filename or title was already uploaded
   */
  findDuplicateResource(
    title: string,
    fileName: string,
    existingResources: StudentRecordedResource[]
  ): StudentRecordedResource | null {
    const normTitle = title.trim().toLowerCase();
    const normFile = fileName.trim().toLowerCase();
    return (
      existingResources.find(
        r =>
          r.title.trim().toLowerCase() === normTitle ||
          (normFile && r.fileName.trim().toLowerCase() === normFile)
      ) || null
    );
  }
};
