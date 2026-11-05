import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword, hashSecurityAnswer } from './auth';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'studymate.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency & speed
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      security_question TEXT,
      security_answer_hash TEXT,
      target_exam TEXT,
      learning_style TEXT,
      daily_goal_minutes INTEGER DEFAULT 120,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      exam_date TEXT,
      duration_weeks INTEGER DEFAULT 4,
      hours_per_day REAL DEFAULT 2.5,
      goals TEXT,
      schedule_json TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tutor_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'socratic',
      messages_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      summary TEXT,
      key_takeaways_json TEXT,
      mnemonics_json TEXT,
      tags_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      questions_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage REAL NOT NULL,
      user_answers_json TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flashcard_decks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      cards_json TEXT NOT NULL,
      card_count INTEGER NOT NULL,
      mastered_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      last_reviewed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS revisions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      source_type TEXT DEFAULT 'custom',
      source_id TEXT,
      stage INTEGER DEFAULT 1,
      next_revision_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      completed_dates_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT,
      reference_id TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_plans_user ON study_plans(user_id);
    CREATE INDEX IF NOT EXISTS idx_tutor_user ON tutor_conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_user ON study_notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_decks_user ON flashcard_decks(user_id);
    CREATE INDEX IF NOT EXISTS idx_revisions_user ON revisions(user_id);
    CREATE INDEX IF NOT EXISTS idx_activities_user ON activity_logs(user_id);
  `);

  // Check if demo user exists, if not seed it with realistic study records
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedDemoData();
  }
}

function seedDemoData() {
  const demoUserId = 'user_demo_101';
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const passHash = hashPassword('studymate123');
  const secHash = hashSecurityAnswer('Blue');

  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, security_question, security_answer_hash, target_exam, learning_style, daily_goal_minutes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    demoUserId,
    'demo@studymate.ai',
    'Alex Rivera',
    passHash,
    'What is your favorite color?',
    secHash,
    'MCAT & Organic Chemistry Finals',
    'Visual & Spaced Repetition',
    150,
    twoDaysAgo
  );

  // Seed initial study plan
  const planId = 'plan_demo_01';
  const planSchedule = [
    {
      week: 1,
      theme: 'Molecular Biology & Reaction Mechanisms',
      tasks: [
        { id: 't1', title: 'Cellular Respiration & Krebs Cycle Breakdown', completed: true, estHours: 2.5 },
        { id: 't2', title: 'SN1 vs SN2 Nucleophilic Substitution Mechanisms', completed: true, estHours: 3 },
        { id: 't3', title: 'Practice 25 Organic Chemistry synthesis questions', completed: false, estHours: 2 },
      ]
    },
    {
      week: 2,
      theme: 'Thermodynamics & Enzyme Kinetics',
      tasks: [
        { id: 't4', title: 'Michaelis-Menten Kinetics & Lineweaver-Burk plots', completed: false, estHours: 2.5 },
        { id: 't5', title: 'Gibbs Free Energy calculations & Le Chatelier shift', completed: false, estHours: 2 },
      ]
    }
  ];

  db.prepare(`
    INSERT INTO study_plans (id, user_id, title, subject, exam_date, duration_weeks, hours_per_day, goals, schedule_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    planId,
    demoUserId,
    'MCAT Biochemistry & Org Chem Mastery',
    'Biochemistry',
    '2026-12-15',
    4,
    3.0,
    'Score 518+ on MCAT Biological and Biochemical Foundations section',
    JSON.stringify(planSchedule),
    'active',
    twoDaysAgo,
    now
  );

  // Seed study note
  const noteId = 'note_demo_01';
  const noteMarkdown = `# Cellular Respiration & ATP Yield

## 1. Overview
Cellular respiration is the multi-stage metabolic process through which cells oxidize glucose to generate ATP.

### Stages:
1. **Glycolysis**: Cytoplasm, Net 2 ATP + 2 NADH (Anaerobic)
2. **Pyruvate Decarboxylation**: Mitochondrial matrix, 2 NADH + 2 CO2
3. **Citric Acid (Krebs) Cycle**: Mitochondrial matrix, 2 ATP, 6 NADH, 2 FADH2, 4 CO2
4. **Oxidative Phosphorylation**: Inner mitochondrial membrane, ~26-28 ATP via ATP Synthase proton gradient.

## Key Formulas & Concepts
- Overall reaction: $C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + 30-32 \\text{ ATP}$
- Chemiosmosis couples proton pump gradient $(\\Delta pH)$ across cristae to F0F1 ATP synthase rotor rotation.
`;

  db.prepare(`
    INSERT INTO study_notes (id, user_id, title, subject, topic, content_markdown, summary, key_takeaways_json, mnemonics_json, tags_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    noteId,
    demoUserId,
    'Cellular Respiration Complete Guide',
    'Biology',
    'Cellular Respiration & Bioenergetics',
    noteMarkdown,
    'Comprehensive breakdown of Glycolysis, Krebs cycle, and Electron Transport Chain with exact stoichiometry and ATP yields.',
    JSON.stringify(['Total yield: 30-32 ATP per glucose', 'Glycolysis is substrate-level phosphorylation in cytosol', 'Complex IV reduces Oxygen to water']),
    JSON.stringify(['Can I Keep Selling Substances For Money, Officer? (Citrate, Isocitrate, alpha-Ketoglutarate, Succinyl-CoA, Succinate, Fumarate, Malate, Oxaloacetate)']),
    JSON.stringify(['biology', 'mcat', 'metabolism', 'atp']),
    yesterday
  );

  // Seed tutor chat
  const chatId = 'chat_demo_01';
  const chatMessages = [
    { role: 'user', text: 'Can you explain the difference between SN1 and SN2 reactions in simple terms?', timestamp: yesterday },
    { role: 'model', text: `Great question! Here is the clean breakdown:

1. **SN1 (Substitution Nucleophilic Unimolecular)**:
   - **Steps**: 2 steps. First, the leaving group falls off creating a carbocation intermediate. Then, the nucleophile attacks.
   - **Rate Law**: Rate = k[substrate]. Only dependent on substrate concentration.
   - **Substrate Preference**: 3° > 2° (tertiary is best because 3° carbocations are stabilized by hyperconjugation).
   - **Stereochemistry**: Racemization (attacks from both front and back).
   - **Solvent**: Polar protic (water, alcohols) stabilizes carbocation.

2. **SN2 (Substitution Nucleophilic Bimolecular)**:
   - **Steps**: 1 concerted step. "Backside attack" happens at the exact same moment the leaving group departs.
   - **Rate Law**: Rate = k[substrate][nucleophile].
   - **Substrate Preference**: Methyl > 1° > 2° (steric hindrance kills SN2; 3° is impossible).
   - **Stereochemistry**: Complete Walden inversion of configuration (like an umbrella turning inside out in the wind).
   - **Solvent**: Polar aprotic (acetone, DMSO) keeps nucleophile naked and reactive.`, timestamp: yesterday }
  ];

  db.prepare(`
    INSERT INTO tutor_conversations (id, user_id, title, subject, mode, messages_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    chatId,
    demoUserId,
    'SN1 vs SN2 Organic Mechanisms',
    'Chemistry',
    'socratic',
    JSON.stringify(chatMessages),
    yesterday,
    yesterday
  );

  // Seed quiz
  const quizId = 'quiz_demo_01';
  const questions = [
    {
      id: 1,
      question: 'Which of the following conditions strongly favors an SN2 mechanism over an SN1 mechanism?',
      options: [
        'A tertiary alkyl halide in water',
        'A primary alkyl halide with a strong nucleophile in DMSO',
        'A tertiary substrate with a weak nucleophile in methanol',
        'A secondary substrate at high temperature with no solvent'
      ],
      correctIndex: 1,
      explanation: 'Primary alkyl halides have minimal steric hindrance, allowing backside attack by a strong nucleophile. Polar aprotic solvents like DMSO do not hydrogen bond with the nucleophile, maximizing SN2 velocity.'
    },
    {
      id: 2,
      question: 'During glycolysis, which enzyme catalyzes the committed, rate-limiting step?',
      options: [
        'Hexokinase',
        'Phosphofructokinase-1 (PFK-1)',
        'Pyruvate kinase',
        'Aldolase'
      ],
      correctIndex: 1,
      explanation: 'Phosphofructokinase-1 (PFK-1) phosphorylates fructose 6-phosphate to fructose 1,6-bisphosphate using ATP. It is allosterically inhibited by ATP and citrate, and activated by AMP and fructose 2,6-bisphosphate.'
    },
    {
      id: 3,
      question: 'What is the final electron acceptor in the mitochondrial electron transport chain?',
      options: [
        'Cytochrome c',
        'NAD+',
        'Molecular Oxygen (O2)',
        'Ubiquinone (CoQ)'
      ],
      correctIndex: 2,
      explanation: 'Molecular oxygen (O2) accepts electrons from Complex IV (cytochrome c oxidase) along with protons to produce H2O.'
    }
  ];

  db.prepare(`
    INSERT INTO quizzes (id, user_id, title, subject, topic, difficulty, questions_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    quizId,
    demoUserId,
    'Cellular Respiration & Mechanism Foundations',
    'Biochemistry',
    'Enzyme Kinetics & Bioenergetics',
    'Medium',
    JSON.stringify(questions),
    yesterday
  );

  // Seed quiz attempt
  const attemptId = 'attempt_demo_01';
  db.prepare(`
    INSERT INTO quiz_attempts (id, quiz_id, user_id, title, score, total_questions, percentage, user_answers_json, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    attemptId,
    quizId,
    demoUserId,
    'Cellular Respiration & Mechanism Foundations',
    3,
    3,
    100.0,
    JSON.stringify({ 0: 1, 1: 1, 2: 2 }),
    yesterday
  );

  // Seed flashcards
  const deckId = 'deck_demo_01';
  const cards = [
    { id: 'c1', front: 'What is the function of ATP Synthase F0 subunit?', back: 'F0 forms a transmembrane proton channel across the inner mitochondrial membrane through which H+ ions flow down their electrochemical gradient.', hint: 'Proton pore', mastery: 'mastered' },
    { id: 'c2', front: 'Why does SN2 result in stereochemical inversion?', back: 'Because the nucleophile must attack from the opposite side of the leaving group (180° backside attack) to overlap with the antibonding orbital (sigma*).', hint: 'Backside attack & orbital symmetry', mastery: 'learning' },
    { id: 'c3', front: 'What effect does 2,4-DNP (dinitrophenol) have on oxidative phosphorylation?', back: 'It is an uncoupler that dissipates the proton gradient without passing through ATP synthase, causing rapid oxygen consumption with heat generation instead of ATP synthesis.', hint: 'Thermogenesis & uncoupling', mastery: 'new' },
    { id: 'c4', front: 'State Le Chatelier principle for exothermic reactions when temperature is increased.', back: 'An increase in temperature shifts the equilibrium in the endothermic direction (toward reactants for exothermic reactions), decreasing the equilibrium constant Keq.', hint: 'Think of heat as a product', mastery: 'mastered' }
  ];

  db.prepare(`
    INSERT INTO flashcard_decks (id, user_id, title, subject, cards_json, card_count, mastered_count, created_at, last_reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    deckId,
    demoUserId,
    'High-Yield Biochemistry Flashcards',
    'Biochemistry',
    JSON.stringify(cards),
    4,
    2,
    twoDaysAgo,
    now
  );

  // Seed revision items
  db.prepare(`
    INSERT INTO revisions (id, user_id, subject, topic, source_type, source_id, stage, next_revision_date, status, completed_dates_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_demo_01',
    demoUserId,
    'Biochemistry',
    'Enzyme Regulation & PFK-1 Allostery',
    'note',
    noteId,
    2,
    tomorrow,
    'pending',
    JSON.stringify([yesterday]),
    twoDaysAgo
  );

  db.prepare(`
    INSERT INTO revisions (id, user_id, subject, topic, source_type, source_id, stage, next_revision_date, status, completed_dates_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_demo_02',
    demoUserId,
    'Organic Chemistry',
    'SN1 vs SN2 Walden Inversion & Carbocation Stability',
    'quiz',
    quizId,
    1,
    now.split('T')[0],
    'pending',
    JSON.stringify([]),
    yesterday
  );

  // Seed activity logs
  const activities = [
    { type: 'plan', title: 'Created Study Plan', details: 'MCAT Biochemistry & Org Chem Mastery (4 weeks)', ref: planId, date: twoDaysAgo },
    { type: 'note', title: 'Generated Study Note', details: 'Cellular Respiration Complete Guide with ATP yield', ref: noteId, date: yesterday },
    { type: 'chat', title: 'AI Tutor Consultation', details: 'Discussed SN1 vs SN2 reaction mechanisms', ref: chatId, date: yesterday },
    { type: 'quiz', title: 'Completed Practice Quiz', details: 'Scored 100% on Cellular Respiration & Mechanism Foundations', ref: attemptId, date: yesterday },
    { type: 'flashcard', title: 'Reviewed Flashcard Deck', details: 'Reviewed High-Yield Biochemistry Flashcards (2 mastered)', ref: deckId, date: now }
  ];

  for (const act of activities) {
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, activity_type, title, details, reference_id, metadata_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'act_' + Math.random().toString(36).substring(2, 10),
      demoUserId,
      act.type,
      act.title,
      act.details,
      act.ref,
      JSON.stringify({}),
      act.date
    );
  }
}
