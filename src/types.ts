export interface User {
  id: string;
  email: string;
  name: string;
  security_question?: string;
  target_exam?: string;
  learning_style?: string;
  daily_goal_minutes?: number;
  created_at: string;
}

export interface PlanTask {
  id: string;
  title: string;
  estHours?: number;
  completed: boolean;
}

export interface PlanWeek {
  week: number;
  theme: string;
  tasks: PlanTask[];
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  exam_date?: string;
  duration_weeks: number;
  hours_per_day: number;
  goals: string;
  schedule: PlanWeek[];
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface TutorMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface TutorConversation {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  mode: 'socratic' | 'eli5' | 'exam_drill' | 'concept_breakdown';
  messages?: TutorMessage[];
  created_at: string;
  updated_at: string;
}

export interface StudyNote {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  topic: string;
  content_markdown: string;
  summary?: string;
  key_takeaways?: string[];
  mnemonics?: string[];
  tags?: string[];
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  title: string;
  score: number;
  total_questions: number;
  percentage: number;
  user_answers: Record<number, number>;
  completed_at: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  mastery: 'new' | 'learning' | 'mastered';
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  cards: Flashcard[];
  card_count: number;
  mastered_count: number;
  created_at: string;
  last_reviewed_at?: string;
}

export interface RevisionItem {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  source_type: 'note' | 'plan' | 'quiz' | 'custom';
  source_id?: string;
  stage: number;
  next_revision_date: string;
  status: 'pending' | 'completed';
  completed_dates?: string[];
  created_at: string;
}

export interface ActivityLogItem {
  id: string;
  title: string;
  activity_type: 'auth' | 'plan' | 'chat' | 'note' | 'quiz' | 'flashcard' | 'revision';
  details?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AnalyticsData {
  counts: {
    plans: number;
    notes: number;
    quizzes: number;
    attempts: number;
    decks: number;
    revisions: number;
    conversations: number;
  };
  quizPerformance: {
    attempts: number;
    averagePercentage: number;
    bestPercentage: number;
    totalCorrect: number;
    totalQuestions: number;
  };
  flashcards: {
    totalCards: number;
    totalMastered: number;
    masteryRate: number;
  };
  streakDays: number;
  subjectDistribution: Record<string, number>;
  activityTrends: Array<{ date: string; label: string; count: number }>;
}
