import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextRevisionDate,
  calculateQuizScore,
  validatePassword,
  calculateStudyStreak,
  filterAndSortHistory,
  REVISION_INTERVALS,
} from './pure_logic';

test('Revision intervals match expected spaced repetition progression', () => {
  assert.equal(REVISION_INTERVALS.length, 5);
  assert.equal(REVISION_INTERVALS[0].daysToAdd, 1);
  assert.equal(REVISION_INTERVALS[1].daysToAdd, 3);
  assert.equal(REVISION_INTERVALS[2].daysToAdd, 7);
  assert.equal(REVISION_INTERVALS[3].daysToAdd, 14);
  assert.equal(REVISION_INTERVALS[4].daysToAdd, 30);
});

test('calculateNextRevisionDate calculates proper date advancement', () => {
  const baseDate = new Date('2026-11-01T00:00:00Z');
  
  // From stage 1 to stage 2 (+3 days)
  const next = calculateNextRevisionDate(1, baseDate);
  assert.equal(next.nextStage, 2);
  assert.equal(next.nextDate, '2026-11-04');

  // From stage 4 to stage 5 (+30 days)
  const next5 = calculateNextRevisionDate(4, baseDate);
  assert.equal(next5.nextStage, 5);
  assert.equal(next5.nextDate, '2026-12-01');
});

test('calculateQuizScore accurately evaluates answers and pass status', () => {
  const correct = [0, 2, 1, 3];
  
  // 4 out of 4 correct = 100%, passed
  const res1 = calculateQuizScore({ 0: 0, 1: 2, 2: 1, 3: 3 }, correct);
  assert.equal(res1.score, 4);
  assert.equal(res1.percentage, 100);
  assert.equal(res1.passed, true);

  // 2 out of 4 correct = 50%, failed
  const res2 = calculateQuizScore({ 0: 0, 1: 1, 2: 1, 3: 0 }, correct);
  assert.equal(res2.score, 2);
  assert.equal(res2.percentage, 50);
  assert.equal(res2.passed, false);

  // 3 out of 4 correct = 75%, passed
  const res3 = calculateQuizScore({ 0: 0, 1: 2, 2: 1, 3: 0 }, correct);
  assert.equal(res3.score, 3);
  assert.equal(res3.percentage, 75);
  assert.equal(res3.passed, true);
});

test('validatePassword rejects short or empty passwords and accepts valid ones', () => {
  assert.equal(validatePassword('').isValid, false);
  assert.equal(validatePassword('12345').isValid, false);
  assert.equal(validatePassword('secret123').isValid, true);
});

test('calculateStudyStreak accurately tracks consecutive days', () => {
  const ref = new Date('2026-11-05T12:00:00Z');
  
  // Active today and yesterday and day before
  const streak3 = calculateStudyStreak([
    '2026-11-05T10:00:00Z',
    '2026-11-04T15:30:00Z',
    '2026-11-03T09:00:00Z',
  ], ref);
  assert.equal(streak3, 3);

  // Active yesterday but not yet today
  const streak2 = calculateStudyStreak([
    '2026-11-04T15:30:00Z',
    '2026-11-03T09:00:00Z',
  ], ref);
  assert.equal(streak2, 2);

  // Gap between days breaks streak
  const streakBroken = calculateStudyStreak([
    '2026-11-05T10:00:00Z',
    '2026-11-03T09:00:00Z',
  ], ref);
  assert.equal(streakBroken, 1);

  // No recent activity
  const streak0 = calculateStudyStreak([
    '2026-10-25T10:00:00Z',
  ], ref);
  assert.equal(streak0, 0);
});

test('filterAndSortHistory correctly filters and sorts items', () => {
  const items = [
    { id: '1', title: 'Biology Notes', activity_type: 'note', details: 'Photosynthesis overview', created_at: '2026-11-01T10:00:00Z' },
    { id: '2', title: 'Calculus Quiz', activity_type: 'quiz', details: 'Derivatives test', created_at: '2026-11-03T10:00:00Z' },
    { id: '3', title: 'Physics Plan', activity_type: 'plan', details: 'Mechanics roadmap', created_at: '2026-11-02T10:00:00Z' },
  ];

  // Filter by activity
  const quizzes = filterAndSortHistory(items, { activityType: 'quiz' });
  assert.equal(quizzes.length, 1);
  assert.equal(quizzes[0].id, '2');

  // Search by text
  const searched = filterAndSortHistory(items, { searchTerm: 'mechanics' });
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, '3');

  // Sort newest
  const sortedNewest = filterAndSortHistory(items, { sortBy: 'newest' });
  assert.equal(sortedNewest[0].id, '2');
  assert.equal(sortedNewest[2].id, '1');

  // Sort oldest
  const sortedOldest = filterAndSortHistory(items, { sortBy: 'oldest' });
  assert.equal(sortedOldest[0].id, '1');
  assert.equal(sortedOldest[2].id, '2');
});
