import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { db, initDb } from './src/server/db';
import {
  hashPassword,
  verifyPassword,
  hashSecurityAnswer,
  verifySecurityAnswer,
  generateToken,
} from './src/server/auth';
import {
  generateStudyPlanAI,
  getTutorReplyAI,
  generateNotesAI,
  generateQuizAI,
  generateFlashcardsAI,
} from './src/server/gemini';
import {
  calculateNextRevisionDate,
  calculateQuizScore,
  calculateStudyStreak,
  filterAndSortHistory,
  validatePassword,
} from './src/utils/pure_logic';

dotenv.config();

// Initialize SQLite database & tables
initDb();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Extend Express Request interface with authenticated user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    security_question?: string;
    target_exam?: string;
    learning_style?: string;
    daily_goal_minutes?: number;
    created_at: string;
  };
  token?: string;
}

// Authentication Middleware
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-session-token'] as string);

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const now = new Date().toISOString();
  const session = db.prepare(`
    SELECT s.token, s.user_id, u.id, u.email, u.name, u.security_question, u.target_exam, u.learning_style, u.daily_goal_minutes, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, now) as any;

  if (!session) {
    res.status(401).json({ error: 'Session invalid or expired' });
    return;
  }

  req.user = {
    id: session.id,
    email: session.email,
    name: session.name,
    security_question: session.security_question,
    target_exam: session.target_exam,
    learning_style: session.learning_style,
    daily_goal_minutes: session.daily_goal_minutes,
    created_at: session.created_at,
  };
  req.token = token;
  next();
}

// Helper to log user activity
function logActivity(userId: string, type: string, title: string, details?: string, refId?: string, meta?: any) {
  try {
    const actId = 'act_' + Math.random().toString(36).substring(2, 11);
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, activity_type, title, details, reference_id, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      actId,
      userId,
      type,
      title,
      details || '',
      refId || null,
      JSON.stringify(meta || {}),
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, securityQuestion, securityAnswer, targetExam, learningStyle, dailyGoalMinutes } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const passVal = validatePassword(password);
  if (!passVal.isValid) {
    res.status(400).json({ error: passVal.error });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existingUser) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const userId = 'usr_' + Math.random().toString(36).substring(2, 11);
  const passwordHash = hashPassword(password);
  const secAnswerHash = securityAnswer ? hashSecurityAnswer(securityAnswer) : null;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, security_question, security_answer_hash, target_exam, learning_style, daily_goal_minutes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    cleanEmail,
    name.trim(),
    passwordHash,
    securityQuestion || 'What was the name of your first school?',
    secAnswerHash,
    targetExam || 'General Studies',
    learningStyle || 'Active Recall',
    dailyGoalMinutes ? Number(dailyGoalMinutes) : 120,
    now
  );

  // Create session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    now,
    expiresAt
  );

  logActivity(userId, 'auth', 'Account Created', `Welcome to StudyMate AI, ${name}!`, userId);

  res.status(201).json({
    token,
    user: {
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      security_question: securityQuestion || 'What was the name of your first school?',
      target_exam: targetExam || 'General Studies',
      learning_style: learningStyle || 'Active Recall',
      daily_goal_minutes: dailyGoalMinutes ? Number(dailyGoalMinutes) : 120,
      created_at: now,
    },
  });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = generateToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    user.id,
    now,
    expiresAt
  );

  logActivity(user.id, 'auth', 'Signed In', 'Logged into StudyMate AI', user.id);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      security_question: user.security_question,
      target_exam: user.target_exam,
      learning_style: user.learning_style,
      daily_goal_minutes: user.daily_goal_minutes,
      created_at: user.created_at,
    },
  });
});

// Logout
app.post('/api/auth/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get Current User Profile
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Forgot Password - Step 1: Look up user & get security question
app.post('/api/auth/forgot-password/check', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT id, security_question FROM users WHERE email = ?').get(cleanEmail) as any;

  if (!user) {
    res.status(404).json({ error: 'No account found with this email address' });
    return;
  }

  res.json({
    email: cleanEmail,
    securityQuestion: user.security_question || 'What is your favorite color?',
  });
});

// Forgot Password - Step 2: Verify security answer and reset password
app.post('/api/auth/forgot-password/reset', (req: Request, res: Response) => {
  const { email, securityAnswer, newPassword } = req.body;
  if (!email || !securityAnswer || !newPassword) {
    res.status(400).json({ error: 'Email, security answer, and new password are required' });
    return;
  }

  const passVal = validatePassword(newPassword);
  if (!passVal.isValid) {
    res.status(400).json({ error: passVal.error });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT id, security_answer_hash FROM users WHERE email = ?').get(cleanEmail) as any;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (!user.security_answer_hash || !verifySecurityAnswer(securityAnswer, user.security_answer_hash)) {
    res.status(400).json({ error: 'Incorrect security answer. Please check and try again.' });
    return;
  }

  const newHash = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

  // Invalidate old sessions for safety
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

  logActivity(user.id, 'auth', 'Password Reset', 'Password was successfully reset via security question', user.id);

  res.json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
});

// Change Password (authenticated)
app.post('/api/auth/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  const passVal = validatePassword(newPassword);
  if (!passVal.isValid) {
    res.status(400).json({ error: passVal.error });
    return;
  }

  const newHash = hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);

  logActivity(userId, 'auth', 'Password Changed', 'User changed their password', userId);

  res.json({ success: true, message: 'Password changed successfully' });
});

// Update Profile
app.put('/api/auth/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const { name, targetExam, learningStyle, dailyGoalMinutes, securityQuestion, securityAnswer } = req.body;
  const userId = req.user!.id;

  let query = 'UPDATE users SET name = ?, target_exam = ?, learning_style = ?, daily_goal_minutes = ?';
  const params: any[] = [
    name || req.user!.name,
    targetExam || req.user!.target_exam,
    learningStyle || req.user!.learning_style,
    dailyGoalMinutes ? Number(dailyGoalMinutes) : req.user!.daily_goal_minutes,
  ];

  if (securityQuestion) {
    query += ', security_question = ?';
    params.push(securityQuestion);
  }
  if (securityAnswer) {
    query += ', security_answer_hash = ?';
    params.push(hashSecurityAnswer(securityAnswer));
  }

  query += ' WHERE id = ?';
  params.push(userId);

  db.prepare(query).run(...params);

  const updatedUser = db.prepare(`
    SELECT id, email, name, security_question, target_exam, learning_style, daily_goal_minutes, created_at
    FROM users WHERE id = ?
  `).get(userId);

  res.json({ user: updatedUser });
});

// ==========================================
// 2. STUDY PLANNER ROUTES
// ==========================================

// Get all study plans for user
app.get('/api/study-plans', authMiddleware, (req: AuthRequest, res: Response) => {
  const plans = db.prepare('SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[];
  const formatted = plans.map(p => ({
    ...p,
    schedule: JSON.parse(p.schedule_json || '[]'),
  }));
  res.json({ plans: formatted });
});

// Get single study plan
app.get('/api/study-plans/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const plan = db.prepare('SELECT * FROM study_plans WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!plan) {
    res.status(404).json({ error: 'Study plan not found' });
    return;
  }
  res.json({
    plan: {
      ...plan,
      schedule: JSON.parse(plan.schedule_json || '[]'),
    },
  });
});

// AI Study Plan Generator
app.post('/api/study-plans/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { subject, examDate, durationWeeks, hoursPerDay, goals, topics } = req.body;
    if (!subject) {
      res.status(400).json({ error: 'Subject is required' });
      return;
    }

    const aiPlan = await generateStudyPlanAI({
      subject,
      examDate,
      durationWeeks: Number(durationWeeks) || 4,
      hoursPerDay: Number(hoursPerDay) || 2.5,
      goals: goals || 'Master key concepts and excel in exams',
      topics,
    });

    res.json({ plan: aiPlan });
  } catch (err: any) {
    console.error('Study plan generation error:', err);
    res.status(500).json({ error: 'Failed to generate study plan: ' + err.message });
  }
});

// Save or Create Study Plan
app.post('/api/study-plans', authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, subject, examDate, durationWeeks, hoursPerDay, goals, schedule } = req.body;
  if (!title || !subject || !schedule) {
    res.status(400).json({ error: 'Title, subject, and schedule are required' });
    return;
  }

  const planId = 'plan_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO study_plans (id, user_id, title, subject, exam_date, duration_weeks, hours_per_day, goals, schedule_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    planId,
    req.user!.id,
    title,
    subject,
    examDate || null,
    durationWeeks ? Number(durationWeeks) : 4,
    hoursPerDay ? Number(hoursPerDay) : 2.5,
    goals || '',
    JSON.stringify(schedule),
    'active',
    now,
    now
  );

  logActivity(req.user!.id, 'plan', title, `${subject} plan (${durationWeeks || 4} weeks)`, planId);

  res.status(201).json({
    plan: {
      id: planId,
      user_id: req.user!.id,
      title,
      subject,
      exam_date: examDate,
      duration_weeks: durationWeeks,
      hours_per_day: hoursPerDay,
      goals,
      schedule,
      status: 'active',
      created_at: now,
      updated_at: now,
    },
  });
});

// Update Plan task completion
app.patch('/api/study-plans/:id/tasks', authMiddleware, (req: AuthRequest, res: Response) => {
  const { schedule, status } = req.body;
  const plan = db.prepare('SELECT * FROM study_plans WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!plan) {
    res.status(404).json({ error: 'Study plan not found' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE study_plans
    SET schedule_json = ?, status = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    JSON.stringify(schedule),
    status || plan.status,
    now,
    req.params.id,
    req.user!.id
  );

  res.json({ success: true, updated_at: now });
});

// Delete Study Plan
app.delete('/api/study-plans/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const plan = db.prepare('SELECT title FROM study_plans WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!plan) {
    res.status(404).json({ error: 'Study plan not found' });
    return;
  }

  db.prepare('DELETE FROM study_plans WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  // Also clean related activity log references or update
  db.prepare('DELETE FROM activity_logs WHERE reference_id = ? AND user_id = ?').run(req.params.id, req.user!.id);

  res.json({ success: true, message: 'Study plan deleted' });
});

// ==========================================
// 3. AI TUTOR ROUTES
// ==========================================

// List Conversations
app.get('/api/tutor/conversations', authMiddleware, (req: AuthRequest, res: Response) => {
  const convs = db.prepare(`
    SELECT id, title, subject, mode, created_at, updated_at
    FROM tutor_conversations
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `).all(req.user!.id);
  res.json({ conversations: convs });
});

// Get Conversation with messages
app.get('/api/tutor/conversations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const conv = db.prepare('SELECT * FROM tutor_conversations WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json({
    conversation: {
      ...conv,
      messages: JSON.parse(conv.messages_json || '[]'),
    },
  });
});

// Send Chat Message & Get AI Reply
app.post('/api/tutor/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, subject, mode, message } = req.body;
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    const currentSubject = subject || 'General Academic';
    const currentMode = mode || 'socratic';
    const now = new Date().toISOString();

    let conv = null;
    let messages: Array<{ role: 'user' | 'model'; text: string; timestamp: string }> = [];

    if (conversationId) {
      conv = db.prepare('SELECT * FROM tutor_conversations WHERE id = ? AND user_id = ?').get(conversationId, req.user!.id) as any;
      if (conv) {
        messages = JSON.parse(conv.messages_json || '[]');
      }
    }

    // Add user message
    messages.push({
      role: 'user',
      text: message.trim(),
      timestamp: now,
    });

    // Call AI Tutor
    const replyText = await getTutorReplyAI({
      subject: currentSubject,
      mode: currentMode,
      conversationHistory: messages.slice(0, -1),
      userMessage: message.trim(),
    });

    // Add model reply
    messages.push({
      role: 'model',
      text: replyText,
      timestamp: new Date().toISOString(),
    });

    let savedId = conversationId;
    if (!conv) {
      // Create new conversation
      savedId = 'chat_' + Math.random().toString(36).substring(2, 11);
      const title = message.trim().slice(0, 40) + (message.length > 40 ? '...' : '');
      db.prepare(`
        INSERT INTO tutor_conversations (id, user_id, title, subject, mode, messages_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        savedId,
        req.user!.id,
        title,
        currentSubject,
        currentMode,
        JSON.stringify(messages),
        now,
        now
      );

      logActivity(req.user!.id, 'chat', `AI Tutor: ${title}`, `${currentSubject} (${currentMode})`, savedId);
    } else {
      // Update existing
      db.prepare(`
        UPDATE tutor_conversations
        SET messages_json = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(JSON.stringify(messages), now, savedId, req.user!.id);
    }

    res.json({
      conversationId: savedId,
      messages,
      reply: replyText,
    });
  } catch (err: any) {
    console.error('Tutor chat error:', err);
    res.status(500).json({ error: 'Failed to get tutor reply: ' + err.message });
  }
});

// Delete Conversation
app.delete('/api/tutor/conversations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM tutor_conversations WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  db.prepare('DELETE FROM activity_logs WHERE reference_id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ success: true });
});

// ==========================================
// 4. NOTES GENERATOR ROUTES
// ==========================================

// List Notes
app.get('/api/notes', authMiddleware, (req: AuthRequest, res: Response) => {
  const notes = db.prepare('SELECT * FROM study_notes WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[];
  const formatted = notes.map(n => ({
    ...n,
    key_takeaways: JSON.parse(n.key_takeaways_json || '[]'),
    mnemonics: JSON.parse(n.mnemonics_json || '[]'),
    tags: JSON.parse(n.tags_json || '[]'),
  }));
  res.json({ notes: formatted });
});

// Get Single Note
app.get('/api/notes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const note = db.prepare('SELECT * FROM study_notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.json({
    note: {
      ...note,
      key_takeaways: JSON.parse(note.key_takeaways_json || '[]'),
      mnemonics: JSON.parse(note.mnemonics_json || '[]'),
      tags: JSON.parse(note.tags_json || '[]'),
    },
  });
});

// AI Generate Notes
app.post('/api/notes/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { subject, topic, depth, customInstructions } = req.body;
    if (!subject || !topic) {
      res.status(400).json({ error: 'Subject and topic are required' });
      return;
    }

    const aiNotes = await generateNotesAI({
      subject,
      topic,
      depth: depth || 'detailed',
      customInstructions,
    });

    res.json({ note: aiNotes });
  } catch (err: any) {
    console.error('Notes generation error:', err);
    res.status(500).json({ error: 'Failed to generate notes: ' + err.message });
  }
});

// Save Note
app.post('/api/notes', authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, subject, topic, contentMarkdown, summary, keyTakeaways, mnemonics, tags } = req.body;
  if (!title || !subject || !topic || !contentMarkdown) {
    res.status(400).json({ error: 'Title, subject, topic, and content are required' });
    return;
  }

  const noteId = 'note_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO study_notes (id, user_id, title, subject, topic, content_markdown, summary, key_takeaways_json, mnemonics_json, tags_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    noteId,
    req.user!.id,
    title,
    subject,
    topic,
    contentMarkdown,
    summary || '',
    JSON.stringify(keyTakeaways || []),
    JSON.stringify(mnemonics || []),
    JSON.stringify(tags || []),
    now
  );

  logActivity(req.user!.id, 'note', title, `${subject} • ${topic}`, noteId);

  // Automatically offer spaced repetition entry
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO revisions (id, user_id, subject, topic, source_type, source_id, stage, next_revision_date, status, completed_dates_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_' + Math.random().toString(36).substring(2, 11),
    req.user!.id,
    subject,
    topic,
    'note',
    noteId,
    1,
    tomorrow,
    'pending',
    JSON.stringify([]),
    now
  );

  res.status(201).json({
    note: {
      id: noteId,
      user_id: req.user!.id,
      title,
      subject,
      topic,
      content_markdown: contentMarkdown,
      summary,
      key_takeaways: keyTakeaways,
      mnemonics,
      tags,
      created_at: now,
    },
  });
});

// Delete Note
app.delete('/api/notes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM study_notes WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  db.prepare('DELETE FROM activity_logs WHERE reference_id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ success: true });
});

// ==========================================
// 5. QUIZ GENERATOR ROUTES
// ==========================================

// List Quizzes
app.get('/api/quizzes', authMiddleware, (req: AuthRequest, res: Response) => {
  const quizzes = db.prepare('SELECT * FROM quizzes WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[];
  const formatted = quizzes.map(q => ({
    ...q,
    questions: JSON.parse(q.questions_json || '[]'),
  }));
  res.json({ quizzes: formatted });
});

// Get Single Quiz
app.get('/api/quizzes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }
  res.json({
    quiz: {
      ...quiz,
      questions: JSON.parse(quiz.questions_json || '[]'),
    },
  });
});

// Generate Quiz with AI
app.post('/api/quizzes/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { subject, topic, questionCount, difficulty } = req.body;
    if (!subject || !topic) {
      res.status(400).json({ error: 'Subject and topic are required' });
      return;
    }

    const aiQuiz = await generateQuizAI({
      subject,
      topic,
      questionCount: Number(questionCount) || 5,
      difficulty: difficulty || 'Medium',
    });

    res.json({ quiz: aiQuiz });
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: 'Failed to generate quiz: ' + err.message });
  }
});

// Save Quiz
app.post('/api/quizzes', authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, subject, topic, difficulty, questions } = req.body;
  if (!title || !subject || !topic || !questions || !Array.isArray(questions)) {
    res.status(400).json({ error: 'Title, subject, topic, and questions array are required' });
    return;
  }

  const quizId = 'quiz_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO quizzes (id, user_id, title, subject, topic, difficulty, questions_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    quizId,
    req.user!.id,
    title,
    subject,
    topic,
    difficulty || 'Medium',
    JSON.stringify(questions),
    now
  );

  res.status(201).json({
    quiz: {
      id: quizId,
      user_id: req.user!.id,
      title,
      subject,
      topic,
      difficulty,
      questions,
      created_at: now,
    },
  });
});

// Record Quiz Attempt
app.post('/api/quizzes/:id/attempt', authMiddleware, (req: AuthRequest, res: Response) => {
  const { userAnswers } = req.body;
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!quiz) {
    res.status(404).json({ error: 'Quiz not found' });
    return;
  }

  const questions = JSON.parse(quiz.questions_json || '[]');
  const correctIndices = questions.map((q: any) => q.correctIndex);
  const result = calculateQuizScore(userAnswers || {}, correctIndices);

  const attemptId = 'att_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO quiz_attempts (id, quiz_id, user_id, title, score, total_questions, percentage, user_answers_json, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    attemptId,
    quiz.id,
    req.user!.id,
    quiz.title,
    result.score,
    result.total,
    result.percentage,
    JSON.stringify(userAnswers || {}),
    now
  );

  logActivity(
    req.user!.id,
    'quiz',
    `Quiz Attempt: ${quiz.title}`,
    `Score: ${result.score}/${result.total} (${result.percentage}%)`,
    attemptId,
    { percentage: result.percentage, score: result.score, total: result.total }
  );

  res.json({
    attempt: {
      id: attemptId,
      quiz_id: quiz.id,
      title: quiz.title,
      score: result.score,
      total_questions: result.total,
      percentage: result.percentage,
      user_answers: userAnswers,
      completed_at: now,
    },
  });
});

// Get Quiz Attempts History
app.get('/api/quizzes/attempts/recent', authMiddleware, (req: AuthRequest, res: Response) => {
  const attempts = db.prepare(`
    SELECT * FROM quiz_attempts
    WHERE user_id = ?
    ORDER BY completed_at DESC
  `).all(req.user!.id) as any[];

  const formatted = attempts.map(a => ({
    ...a,
    user_answers: JSON.parse(a.user_answers_json || '{}'),
  }));

  res.json({ attempts: formatted });
});

// Delete Quiz
app.delete('/api/quizzes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM quizzes WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  db.prepare('DELETE FROM activity_logs WHERE reference_id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ success: true });
});

// ==========================================
// 6. FLASHCARDS ROUTES
// ==========================================

// List Decks
app.get('/api/flashcards/decks', authMiddleware, (req: AuthRequest, res: Response) => {
  const decks = db.prepare('SELECT * FROM flashcard_decks WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[];
  const formatted = decks.map(d => ({
    ...d,
    cards: JSON.parse(d.cards_json || '[]'),
  }));
  res.json({ decks: formatted });
});

// Get Single Deck
app.get('/api/flashcards/decks/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const deck = db.prepare('SELECT * FROM flashcard_decks WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' });
    return;
  }
  res.json({
    deck: {
      ...deck,
      cards: JSON.parse(deck.cards_json || '[]'),
    },
  });
});

// Generate Flashcards with AI
app.post('/api/flashcards/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { subject, topic, cardCount } = req.body;
    if (!subject || !topic) {
      res.status(400).json({ error: 'Subject and topic are required' });
      return;
    }

    const aiDeck = await generateFlashcardsAI({
      subject,
      topic,
      cardCount: Number(cardCount) || 6,
    });

    res.json({ deck: aiDeck });
  } catch (err: any) {
    console.error('Flashcards generation error:', err);
    res.status(500).json({ error: 'Failed to generate flashcards: ' + err.message });
  }
});

// Save Deck
app.post('/api/flashcards/decks', authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, subject, cards } = req.body;
  if (!title || !subject || !cards || !Array.isArray(cards)) {
    res.status(400).json({ error: 'Title, subject, and cards are required' });
    return;
  }

  const deckId = 'deck_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();
  const masteredCount = cards.filter((c: any) => c.mastery === 'mastered').length;

  db.prepare(`
    INSERT INTO flashcard_decks (id, user_id, title, subject, cards_json, card_count, mastered_count, created_at, last_reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    deckId,
    req.user!.id,
    title,
    subject,
    JSON.stringify(cards),
    cards.length,
    masteredCount,
    now,
    now
  );

  logActivity(req.user!.id, 'flashcard', `Created Deck: ${title}`, `${cards.length} cards (${subject})`, deckId);

  res.status(201).json({
    deck: {
      id: deckId,
      user_id: req.user!.id,
      title,
      subject,
      cards,
      card_count: cards.length,
      mastered_count: masteredCount,
      created_at: now,
      last_reviewed_at: now,
    },
  });
});

// Update Deck Cards & Mastery
app.patch('/api/flashcards/decks/:id/review', authMiddleware, (req: AuthRequest, res: Response) => {
  const { cards } = req.body;
  const deck = db.prepare('SELECT * FROM flashcard_decks WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!deck) {
    res.status(404).json({ error: 'Deck not found' });
    return;
  }

  const now = new Date().toISOString();
  const masteredCount = cards.filter((c: any) => c.mastery === 'mastered').length;

  db.prepare(`
    UPDATE flashcard_decks
    SET cards_json = ?, card_count = ?, mastered_count = ?, last_reviewed_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    JSON.stringify(cards),
    cards.length,
    masteredCount,
    now,
    req.params.id,
    req.user!.id
  );

  logActivity(req.user!.id, 'flashcard', `Reviewed: ${deck.title}`, `${masteredCount}/${cards.length} cards mastered`, deck.id);

  res.json({ success: true, mastered_count: masteredCount, last_reviewed_at: now });
});

// Delete Deck
app.delete('/api/flashcards/decks/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM flashcard_decks WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  db.prepare('DELETE FROM activity_logs WHERE reference_id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ success: true });
});

// ==========================================
// 7. REVISION PLANNER ROUTES
// ==========================================

// Get Revisions
app.get('/api/revisions', authMiddleware, (req: AuthRequest, res: Response) => {
  const revs = db.prepare('SELECT * FROM revisions WHERE user_id = ? ORDER BY next_revision_date ASC').all(req.user!.id) as any[];
  const formatted = revs.map(r => ({
    ...r,
    completed_dates: JSON.parse(r.completed_dates_json || '[]'),
  }));
  res.json({ revisions: formatted });
});

// Add Revision Item
app.post('/api/revisions', authMiddleware, (req: AuthRequest, res: Response) => {
  const { subject, topic, sourceType, sourceId, nextRevisionDate } = req.body;
  if (!subject || !topic) {
    res.status(400).json({ error: 'Subject and topic are required' });
    return;
  }

  const revId = 'rev_' + Math.random().toString(36).substring(2, 11);
  const now = new Date().toISOString();
  const targetDate = nextRevisionDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO revisions (id, user_id, subject, topic, source_type, source_id, stage, next_revision_date, status, completed_dates_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    revId,
    req.user!.id,
    subject,
    topic,
    sourceType || 'custom',
    sourceId || null,
    1,
    targetDate,
    'pending',
    JSON.stringify([]),
    now
  );

  logActivity(req.user!.id, 'revision', `Scheduled Revision: ${topic}`, `Stage 1 review set for ${targetDate}`, revId);

  res.status(201).json({
    revision: {
      id: revId,
      user_id: req.user!.id,
      subject,
      topic,
      stage: 1,
      next_revision_date: targetDate,
      status: 'pending',
      completed_dates: [],
      created_at: now,
    },
  });
});

// Advance Revision Stage (Mark Reviewed)
app.patch('/api/revisions/:id/advance', authMiddleware, (req: AuthRequest, res: Response) => {
  const rev = db.prepare('SELECT * FROM revisions WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!rev) {
    res.status(404).json({ error: 'Revision item not found' });
    return;
  }

  const { nextStage, nextDate } = calculateNextRevisionDate(rev.stage);
  const completedDates = JSON.parse(rev.completed_dates_json || '[]');
  const today = new Date().toISOString().split('T')[0];
  completedDates.push(today);

  const status = nextStage >= 5 ? 'completed' : 'pending';

  db.prepare(`
    UPDATE revisions
    SET stage = ?, next_revision_date = ?, status = ?, completed_dates_json = ?
    WHERE id = ? AND user_id = ?
  `).run(
    nextStage,
    nextDate,
    status,
    JSON.stringify(completedDates),
    rev.id,
    req.user!.id
  );

  logActivity(req.user!.id, 'revision', `Completed Revision: ${rev.topic}`, `Advanced to Stage ${nextStage} (Next: ${nextDate})`, rev.id);

  res.json({
    success: true,
    stage: nextStage,
    next_revision_date: nextDate,
    status,
    completed_dates: completedDates,
  });
});

// Delete Revision Item
app.delete('/api/revisions/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM revisions WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ success: true });
});

// ==========================================
// 8. HISTORY ROUTES
// ==========================================

// Get Unified History
app.get('/api/history', authMiddleware, (req: AuthRequest, res: Response) => {
  const { search, type, sort } = req.query;

  const rawLogs = db.prepare(`
    SELECT * FROM activity_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user!.id) as any[];

  const formatted = rawLogs.map(l => ({
    id: l.id,
    title: l.title,
    activity_type: l.activity_type,
    details: l.details,
    reference_id: l.reference_id,
    metadata: JSON.parse(l.metadata_json || '{}'),
    created_at: l.created_at,
  }));

  const filtered = filterAndSortHistory(formatted, {
    searchTerm: search as string,
    activityType: type as string,
    sortBy: (sort as any) || 'newest',
  });

  res.json({ history: filtered });
});

// Get Referenced Item Details from History
app.get('/api/history/:id/details', authMiddleware, (req: AuthRequest, res: Response) => {
  const log = db.prepare('SELECT * FROM activity_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
  if (!log) {
    res.status(404).json({ error: 'History record not found' });
    return;
  }

  let itemData = null;
  const refId = log.reference_id;

  if (refId) {
    if (log.activity_type === 'plan') {
      const plan = db.prepare('SELECT * FROM study_plans WHERE id = ? AND user_id = ?').get(refId, req.user!.id) as any;
      if (plan) itemData = { ...plan, schedule: JSON.parse(plan.schedule_json || '[]') };
    } else if (log.activity_type === 'note') {
      const note = db.prepare('SELECT * FROM study_notes WHERE id = ? AND user_id = ?').get(refId, req.user!.id) as any;
      if (note) itemData = { ...note, key_takeaways: JSON.parse(note.key_takeaways_json || '[]'), mnemonics: JSON.parse(note.mnemonics_json || '[]') };
    } else if (log.activity_type === 'chat') {
      const chat = db.prepare('SELECT * FROM tutor_conversations WHERE id = ? AND user_id = ?').get(refId, req.user!.id) as any;
      if (chat) itemData = { ...chat, messages: JSON.parse(chat.messages_json || '[]') };
    } else if (log.activity_type === 'quiz') {
      const attempt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?').get(refId, req.user!.id) as any;
      if (attempt) itemData = { ...attempt, user_answers: JSON.parse(attempt.user_answers_json || '{}') };
    } else if (log.activity_type === 'flashcard') {
      const deck = db.prepare('SELECT * FROM flashcard_decks WHERE id = ? AND user_id = ?').get(refId, req.user!.id) as any;
      if (deck) itemData = { ...deck, cards: JSON.parse(deck.cards_json || '[]') };
    } else if (log.activity_type === 'revision') {
      const rev = db.prepare('SELECT * FROM revisions WHERE id = ? AND user_id = ?').get(refId, req.user!.id) as any;
      if (rev) itemData = { ...rev, completed_dates: JSON.parse(rev.completed_dates_json || '[]') };
    }
  }

  res.json({
    log: {
      ...log,
      metadata: JSON.parse(log.metadata_json || '{}'),
    },
    itemData,
  });
});

// Delete History Record
app.delete('/api/history/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM activity_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ success: true, message: 'History record removed' });
});

// ==========================================
// 9. PROGRESS ANALYTICS ROUTES
// ==========================================

app.get('/api/analytics', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  // Counts
  const planCount = (db.prepare('SELECT COUNT(*) as c FROM study_plans WHERE user_id = ?').get(userId) as any).c;
  const noteCount = (db.prepare('SELECT COUNT(*) as c FROM study_notes WHERE user_id = ?').get(userId) as any).c;
  const quizCount = (db.prepare('SELECT COUNT(*) as c FROM quizzes WHERE user_id = ?').get(userId) as any).c;
  const attemptCount = (db.prepare('SELECT COUNT(*) as c FROM quiz_attempts WHERE user_id = ?').get(userId) as any).c;
  const deckCount = (db.prepare('SELECT COUNT(*) as c FROM flashcard_decks WHERE user_id = ?').get(userId) as any).c;
  const revCount = (db.prepare('SELECT COUNT(*) as c FROM revisions WHERE user_id = ?').get(userId) as any).c;
  const convCount = (db.prepare('SELECT COUNT(*) as c FROM tutor_conversations WHERE user_id = ?').get(userId) as any).c;

  // Quiz Performance
  const quizStats = db.prepare(`
    SELECT AVG(percentage) as avgScore, MAX(percentage) as maxScore, SUM(score) as totalCorrect, SUM(total_questions) as totalQuestions
    FROM quiz_attempts
    WHERE user_id = ?
  `).get(userId) as any;

  // Flashcards Mastered
  const flashcardStats = db.prepare(`
    SELECT SUM(card_count) as totalCards, SUM(mastered_count) as totalMastered
    FROM flashcard_decks
    WHERE user_id = ?
  `).get(userId) as any;

  // Activity Dates for Streak
  const activityDates = (db.prepare('SELECT created_at FROM activity_logs WHERE user_id = ?').all(userId) as any[]).map(a => a.created_at);
  const streak = calculateStudyStreak(activityDates);

  // Subject distribution
  const subjectDistribution: Record<string, number> = {};
  const plans = db.prepare('SELECT subject FROM study_plans WHERE user_id = ?').all(userId) as any[];
  const notes = db.prepare('SELECT subject FROM study_notes WHERE user_id = ?').all(userId) as any[];
  const quizzes = db.prepare('SELECT subject FROM quizzes WHERE user_id = ?').all(userId) as any[];

  [...plans, ...notes, ...quizzes].forEach(item => {
    if (item.subject) {
      subjectDistribution[item.subject] = (subjectDistribution[item.subject] || 0) + 1;
    }
  });

  // Past 7 days activity counts
  const past7Days: Array<{ date: string; label: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = (db.prepare(`
      SELECT COUNT(*) as c FROM activity_logs
      WHERE user_id = ? AND created_at LIKE ?
    `).get(userId, `${dateStr}%`) as any).c;
    past7Days.push({ date: dateStr, label: dayLabel, count });
  }

  res.json({
    counts: {
      plans: planCount,
      notes: noteCount,
      quizzes: quizCount,
      attempts: attemptCount,
      decks: deckCount,
      revisions: revCount,
      conversations: convCount,
    },
    quizPerformance: {
      attempts: attemptCount,
      averagePercentage: Math.round(quizStats?.avgScore || 0),
      bestPercentage: Math.round(quizStats?.maxScore || 0),
      totalCorrect: quizStats?.totalCorrect || 0,
      totalQuestions: quizStats?.totalQuestions || 0,
    },
    flashcards: {
      totalCards: flashcardStats?.totalCards || 0,
      totalMastered: flashcardStats?.totalMastered || 0,
      masteryRate: flashcardStats?.totalCards ? Math.round((flashcardStats.totalMastered / flashcardStats.totalCards) * 100) : 0,
    },
    streakDays: streak,
    subjectDistribution,
    activityTrends: past7Days,
  });
});

// ==========================================
// 10. DATA EXPORT & CLEAR HISTORY
// ==========================================

// Export full personal data as JSON
app.get('/api/user/export', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.prepare('SELECT id, email, name, target_exam, learning_style, daily_goal_minutes, created_at FROM users WHERE id = ?').get(userId);
  const plans = db.prepare('SELECT * FROM study_plans WHERE user_id = ?').all(userId);
  const notes = db.prepare('SELECT * FROM study_notes WHERE user_id = ?').all(userId);
  const conversations = db.prepare('SELECT * FROM tutor_conversations WHERE user_id = ?').all(userId);
  const quizzes = db.prepare('SELECT * FROM quizzes WHERE user_id = ?').all(userId);
  const attempts = db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ?').all(userId);
  const decks = db.prepare('SELECT * FROM flashcard_decks WHERE user_id = ?').all(userId);
  const revisions = db.prepare('SELECT * FROM revisions WHERE user_id = ?').all(userId);
  const history = db.prepare('SELECT * FROM activity_logs WHERE user_id = ?').all(userId);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="studymate-export-${Date.now()}.json"`);
  res.json({
    user,
    study_plans: plans,
    study_notes: notes,
    tutor_conversations: conversations,
    quizzes,
    quiz_attempts: attempts,
    flashcard_decks: decks,
    revisions,
    activity_history: history,
    exported_at: new Date().toISOString(),
  });
});

// Clear Activity History only
app.post('/api/user/clear-history', authMiddleware, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM activity_logs WHERE user_id = ?').run(req.user!.id);
  res.json({ success: true, message: 'Activity history cleared' });
});

// ==========================================
// 11. VITE INTEGRATION & STATIC SERVING
// ==========================================

const PORT = 3000;

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyMate AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
