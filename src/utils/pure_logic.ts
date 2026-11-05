/**
 * Pure business logic utilities for StudyMate AI:
 * - Password strength validation
 * - Spaced repetition interval calculations
 * - Study streak & analytics aggregations
 * - Quiz score calculations
 * - History filtering and searching
 */

export interface RevisionInterval {
  stage: number;
  daysToAdd: number;
  label: string;
}

export const REVISION_INTERVALS: RevisionInterval[] = [
  { stage: 1, daysToAdd: 1, label: '1 Day (First Review)' },
  { stage: 2, daysToAdd: 3, label: '3 Days (Reinforcement)' },
  { stage: 3, daysToAdd: 7, label: '7 Days (Consolidation)' },
  { stage: 4, daysToAdd: 14, label: '14 Days (Long-term Retention)' },
  { stage: 5, daysToAdd: 30, label: '30 Days (Mastery)' },
];

/**
 * Calculates the next revision date according to spaced repetition stage.
 */
export function calculateNextRevisionDate(currentStage: number, fromDate: Date = new Date()): { nextStage: number; nextDate: string } {
  const current = Math.max(1, Math.min(5, currentStage));
  const nextStage = Math.min(5, current + 1);
  const interval = REVISION_INTERVALS.find(r => r.stage === nextStage) || REVISION_INTERVALS[REVISION_INTERVALS.length - 1];
  
  const targetDate = new Date(fromDate.getTime());
  targetDate.setDate(targetDate.getDate() + interval.daysToAdd);
  
  return {
    nextStage,
    nextDate: targetDate.toISOString().split('T')[0],
  };
}

/**
 * Calculates quiz score and percentage.
 */
export function calculateQuizScore(userAnswers: Record<number, number>, correctAnswers: number[]): { score: number; total: number; percentage: number; passed: boolean } {
  const total = correctAnswers.length;
  if (total === 0) return { score: 0, total: 0, percentage: 0, passed: false };
  
  let score = 0;
  for (let i = 0; i < total; i++) {
    if (userAnswers[i] === correctAnswers[i]) {
      score++;
    }
  }
  
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 70;
  
  return { score, total, percentage, passed };
}

/**
 * Validates password strength.
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  return { isValid: true };
}

/**
 * Computes study streak (in consecutive days) given a list of activity ISO timestamps.
 */
export function calculateStudyStreak(activityDates: string[], referenceDate: Date = new Date()): number {
  if (!activityDates || activityDates.length === 0) return 0;

  // Extract unique YYYY-MM-DD dates in UTC
  const uniqueDates = new Set(
    activityDates.map(d => {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? '' : dt.toISOString().split('T')[0];
    }).filter(Boolean)
  );

  const refDayStr = referenceDate.toISOString().split('T')[0];
  const yesterday = new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // If there is activity today, start counting from today; otherwise if activity yesterday, count from yesterday.
  let currentDay = new Date(referenceDate.getTime());
  if (!uniqueDates.has(refDayStr)) {
    if (uniqueDates.has(yesterdayStr)) {
      currentDay = yesterday;
    } else {
      return 0; // Streak broken
    }
  }

  let streak = 0;
  while (true) {
    const dayStr = currentDay.toISOString().split('T')[0];
    if (uniqueDates.has(dayStr)) {
      streak++;
      // Go back one day
      currentDay = new Date(currentDay.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Filter and sort history items.
 */
export interface GenericHistoryItem {
  id: string;
  title: string;
  activity_type: string;
  details?: string;
  created_at: string;
}

export function filterAndSortHistory<T extends GenericHistoryItem>(
  items: T[],
  filters: {
    searchTerm?: string;
    activityType?: string;
    sortBy?: 'newest' | 'oldest' | 'title';
  }
): T[] {
  let result = [...items];

  // Filter by activity type
  if (filters.activityType && filters.activityType !== 'all') {
    result = result.filter(item => item.activity_type === filters.activityType);
  }

  // Filter by search query
  if (filters.searchTerm && filters.searchTerm.trim() !== '') {
    const query = filters.searchTerm.toLowerCase().trim();
    result = result.filter(item => 
      item.title.toLowerCase().includes(query) ||
      (item.details && item.details.toLowerCase().includes(query))
    );
  }

  // Sort
  result.sort((a, b) => {
    if (filters.sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (filters.sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    // Default: newest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return result;
}
