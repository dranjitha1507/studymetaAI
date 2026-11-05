import {
  User,
  StudyPlan,
  TutorConversation,
  StudyNote,
  Quiz,
  QuizAttempt,
  FlashcardDeck,
  RevisionItem,
  ActivityLogItem,
  AnalyticsData,
} from '../types';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('studymate_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: any) => request<{ token: string; user: User }>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => request<{ token: string; user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request<{ user: User }>('/api/auth/me'),
  forgotPasswordCheck: (email: string) => request<{ email: string; securityQuestion: string }>('/api/auth/forgot-password/check', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPasswordReset: (payload: any) => request<{ success: boolean; message: string }>('/api/auth/forgot-password/reset', { method: 'POST', body: JSON.stringify(payload) }),
  changePassword: (payload: any) => request<{ success: boolean; message: string }>('/api/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  updateProfile: (payload: any) => request<{ user: User }>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Study Plans
  getStudyPlans: () => request<{ plans: StudyPlan[] }>('/api/study-plans'),
  getStudyPlan: (id: string) => request<{ plan: StudyPlan }>(`/api/study-plans/${id}`),
  generateStudyPlan: (payload: any) => request<{ plan: any }>('/api/study-plans/generate', { method: 'POST', body: JSON.stringify(payload) }),
  createStudyPlan: (payload: any) => request<{ plan: StudyPlan }>('/api/study-plans', { method: 'POST', body: JSON.stringify(payload) }),
  updatePlanTasks: (id: string, payload: any) => request<{ success: boolean; updated_at: string }>(`/api/study-plans/${id}/tasks`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteStudyPlan: (id: string) => request<{ success: boolean }>(`/api/study-plans/${id}`, { method: 'DELETE' }),

  // AI Tutor
  getConversations: () => request<{ conversations: TutorConversation[] }>('/api/tutor/conversations'),
  getConversation: (id: string) => request<{ conversation: TutorConversation }>(`/api/tutor/conversations/${id}`),
  sendTutorMessage: (payload: any) => request<{ conversationId: string; messages: any[]; reply: string }>('/api/tutor/chat', { method: 'POST', body: JSON.stringify(payload) }),
  deleteConversation: (id: string) => request<{ success: boolean }>(`/api/tutor/conversations/${id}`, { method: 'DELETE' }),

  // Notes
  getNotes: () => request<{ notes: StudyNote[] }>('/api/notes'),
  getNote: (id: string) => request<{ note: StudyNote }>(`/api/notes/${id}`),
  generateNotes: (payload: any) => request<{ note: any }>('/api/notes/generate', { method: 'POST', body: JSON.stringify(payload) }),
  createNote: (payload: any) => request<{ note: StudyNote }>('/api/notes', { method: 'POST', body: JSON.stringify(payload) }),
  deleteNote: (id: string) => request<{ success: boolean }>(`/api/notes/${id}`, { method: 'DELETE' }),

  // Quizzes
  getQuizzes: () => request<{ quizzes: Quiz[] }>('/api/quizzes'),
  getQuiz: (id: string) => request<{ quiz: Quiz }>(`/api/quizzes/${id}`),
  generateQuiz: (payload: any) => request<{ quiz: any }>('/api/quizzes/generate', { method: 'POST', body: JSON.stringify(payload) }),
  createQuiz: (payload: any) => request<{ quiz: Quiz }>('/api/quizzes', { method: 'POST', body: JSON.stringify(payload) }),
  recordQuizAttempt: (quizId: string, userAnswers: Record<number, number>) => request<{ attempt: QuizAttempt }>(`/api/quizzes/${quizId}/attempt`, { method: 'POST', body: JSON.stringify({ userAnswers }) }),
  getRecentAttempts: () => request<{ attempts: QuizAttempt[] }>('/api/quizzes/attempts/recent'),
  deleteQuiz: (id: string) => request<{ success: boolean }>(`/api/quizzes/${id}`, { method: 'DELETE' }),

  // Flashcards
  getDecks: () => request<{ decks: FlashcardDeck[] }>('/api/flashcards/decks'),
  getDeck: (id: string) => request<{ deck: FlashcardDeck }>(`/api/flashcards/decks/${id}`),
  generateDeck: (payload: any) => request<{ deck: any }>('/api/flashcards/generate', { method: 'POST', body: JSON.stringify(payload) }),
  createDeck: (payload: any) => request<{ deck: FlashcardDeck }>('/api/flashcards/decks', { method: 'POST', body: JSON.stringify(payload) }),
  reviewDeck: (deckId: string, cards: any[]) => request<{ success: boolean; mastered_count: number }>(`/api/flashcards/decks/${deckId}/review`, { method: 'PATCH', body: JSON.stringify({ cards }) }),
  deleteDeck: (id: string) => request<{ success: boolean }>(`/api/flashcards/decks/${id}`, { method: 'DELETE' }),

  // Revisions
  getRevisions: () => request<{ revisions: RevisionItem[] }>('/api/revisions'),
  createRevision: (payload: any) => request<{ revision: RevisionItem }>('/api/revisions', { method: 'POST', body: JSON.stringify(payload) }),
  advanceRevision: (id: string) => request<{ success: boolean; stage: number; next_revision_date: string; status: string; completed_dates: string[] }>(`/api/revisions/${id}/advance`, { method: 'PATCH' }),
  deleteRevision: (id: string) => request<{ success: boolean }>(`/api/revisions/${id}`, { method: 'DELETE' }),

  // History
  getHistory: (params: { search?: string; type?: string; sort?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.type) q.set('type', params.type);
    if (params.sort) q.set('sort', params.sort);
    return request<{ history: ActivityLogItem[] }>(`/api/history?${q.toString()}`);
  },
  getHistoryDetails: (id: string) => request<{ log: ActivityLogItem; itemData: any }>(`/api/history/${id}/details`),
  deleteHistoryItem: (id: string) => request<{ success: boolean; message: string }>(`/api/history/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalytics: () => request<AnalyticsData>('/api/analytics'),

  // Export & Clear
  exportUserData: () => {
    const token = localStorage.getItem('studymate_token');
    window.location.href = `/api/user/export?token=${token}`;
  },
  clearHistory: () => request<{ success: boolean; message: string }>('/api/user/clear-history', { method: 'POST' }),
};
