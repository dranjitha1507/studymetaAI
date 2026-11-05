import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiClient;
  } catch (err) {
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms = 4000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI generation timeout')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Generate a comprehensive structured study plan
 */
export async function generateStudyPlanAI(params: {
  subject: string;
  examDate?: string;
  durationWeeks: number;
  hoursPerDay: number;
  goals: string;
  topics?: string;
}) {
  const ai = getAIClient();
  const prompt = `You are an elite academic study planner and cognitive learning scientist.
Create a detailed, weekly and daily study plan for:
- Subject: ${params.subject}
- Target Exam Date: ${params.examDate || 'Not specified (flexible mastery)'}
- Duration: ${params.durationWeeks} weeks
- Study Time: ${params.hoursPerDay} hours/day
- Student Goals: ${params.goals}
- Focus Topics / Weak Areas: ${params.topics || 'Comprehensive syllabus breakdown'}

Return ONLY a valid JSON object with the following exact structure:
{
  "title": "A motivating, specific title for the study plan",
  "summary": "Brief 2-sentence executive summary of the pedagogical strategy",
  "weeks": [
    {
      "week": 1,
      "theme": "Core theme or milestone for this week",
      "tasks": [
        {
          "id": "w1-t1",
          "title": "Specific, actionable task (e.g. Read Chapter 3 & do 15 practice problems)",
          "estHours": 2.0,
          "completed": false
        }
      ]
    }
  ],
  "studyTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            systemInstruction: 'You are an expert curriculum designer. Always output strict valid JSON.',
          },
        }),
        3500
      );

      const text = response.text;
      if (text) {
        return JSON.parse(text.trim());
      }
    } catch (err) {
      console.warn('Gemini API call failed for study plan, using algorithmic fallback:', err);
    }
  }

  // Algorithmic fallback
  const weeksCount = Math.max(1, Math.min(12, Number(params.durationWeeks) || 4));
  const weeks = [];
  for (let w = 1; w <= weeksCount; w++) {
    const isFirst = w === 1;
    const isFinal = w === weeksCount;
    const theme = isFirst
      ? `Foundations and Core Concepts of ${params.subject}`
      : isFinal
      ? `Final Mock Exams, High-Yield Review & Weakness Remediation`
      : `Intermediate Problem Solving & Deep Dive - Phase ${w}`;

    weeks.push({
      week: w,
      theme,
      tasks: [
        {
          id: `w${w}-t1`,
          title: `Comprehensive concept review: ${params.subject} Modules ${w * 2 - 1}`,
          estHours: Math.round(params.hoursPerDay * 0.7 * 10) / 10,
          completed: false,
        },
        {
          id: `w${w}-t2`,
          title: `Active recall drills and flashcard reinforcement on high-yield formulas`,
          estHours: Math.round(params.hoursPerDay * 0.5 * 10) / 10,
          completed: false,
        },
        {
          id: `w${w}-t3`,
          title: `Practice exam questions & error analysis log for ${params.subject}`,
          estHours: Math.round(params.hoursPerDay * 0.8 * 10) / 10,
          completed: false,
        },
      ],
    });
  }

  return {
    title: `${params.subject} Mastery Roadmap (${weeksCount} Weeks)`,
    summary: `Structured ${weeksCount}-week plan targeting ${params.goals || 'comprehensive exam readiness'} with balanced daily active recall and problem drills.`,
    weeks,
    studyTips: [
      'Use 25-minute Pomodoro intervals followed by 5-minute active recall breaks.',
      'Log every missed practice question into an error log for spaced repetition.',
      'Explain difficult topics out loud using the Feynman Technique to expose blind spots.',
    ],
  };
}

/**
 * AI Tutor multi-turn conversation response
 */
export async function getTutorReplyAI(params: {
  subject: string;
  mode: 'socratic' | 'eli5' | 'exam_drill' | 'concept_breakdown';
  conversationHistory: Array<{ role: 'user' | 'model'; text: string }>;
  userMessage: string;
}) {
  const ai = getAIClient();

  const modeInstructions = {
    socratic: 'Adopt the Socratic method. Guide the student by asking thoughtful, probing questions rather than giving immediate answers. Help them discover the solution through guided inquiry.',
    eli5: 'Explain Like I\'m 5. Break down complex, technical concepts into simple, relatable real-world analogies without unnecessary jargon, while maintaining scientific accuracy.',
    exam_drill: 'Act as a rigorous exam coach. Challenge the student with high-yield exam-style questions, evaluate their answers strictly, highlight common distractors, and explain grading criteria.',
    concept_breakdown: 'Provide a structured, deeply comprehensive masterclass breakdown with definitions, key principles, step-by-step mechanisms, formulas, and real-world applications.',
  };

  const systemInstruction = `You are StudyMate AI's master tutor for ${params.subject}.
${modeInstructions[params.mode] || modeInstructions.socratic}
Format with clean markdown headings, bullet points, and LaTeX-style notation where appropriate. Be encouraging, intellectually rigorous, and helpful.`;

  if (ai) {
    try {
      const contents = params.conversationHistory.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      }));
      contents.push({
        role: 'user',
        parts: [{ text: params.userMessage }],
      });

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
          },
        }),
        3500
      );

      const text = response.text;
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn('Gemini API call failed for tutor chat, using pedagogical fallback:', err);
    }
  }

  // Fallback response
  return `### Tutor Response (${params.subject} - ${params.mode.toUpperCase()})

Thank you for your question: **"${params.userMessage}"**

Here is a structured explanation:

1. **Core Concept**:
   In **${params.subject}**, understanding foundational principles is critical. Break this topic into its primitive assumptions, the governing relationships, and the boundary conditions.

2. **Key Mechanism**:
   - Trace the causal flow step-by-step.
   - Pay close attention to conservation laws, rates of change, and equilibrium shifts.
   - Verify definitions to avoid conflating related terms.

3. **Check Your Understanding**:
   How would this outcome change if the initial conditions or independent variables were doubled? Try calculating or reasoning through the extreme limit!`;
}

/**
 * Generate comprehensive study notes
 */
export async function generateNotesAI(params: {
  subject: string;
  topic: string;
  depth: 'summary' | 'detailed' | 'cheat_sheet';
  customInstructions?: string;
}) {
  const ai = getAIClient();
  const prompt = `Generate comprehensive, high-yield revision notes for:
Subject: ${params.subject}
Topic: ${params.topic}
Depth: ${params.depth}
Additional Context: ${params.customInstructions || 'None'}

Return ONLY a valid JSON object matching this schema:
{
  "title": "Title of the note",
  "summary": "Clear, concise 2-3 sentence overview of the topic",
  "contentMarkdown": "Rich markdown notes including # headings, ## subheadings, bullet points, key mechanisms, comparison tables where useful, and practical examples",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4"],
  "mnemonics": ["Mnemonic 1 for remembering tricky items", "Mnemonic 2"],
  "tags": ["tag1", "tag2", "tag3"]
}`;

  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            systemInstruction: 'You are an elite academic textbook author and medical/STEM professor. Output strict valid JSON.',
          },
        }),
        3500
      );

      const text = response.text;
      if (text) {
        return JSON.parse(text.trim());
      }
    } catch (err) {
      console.warn('Gemini API call failed for notes, using fallback:', err);
    }
  }

  // Algorithmic fallback
  return {
    title: `${params.topic} - Comprehensive Study Guide`,
    summary: `Complete revision notes covering the fundamental principles, mechanisms, and exam essentials of ${params.topic} in ${params.subject}.`,
    contentMarkdown: `# ${params.topic}

## 1. Overview & Definitions
${params.topic} represents one of the key pillars in ${params.subject}. Mastery of this subject requires understanding the underlying theory as well as practical problem-solving.

### Core Principles
- **First Law/Definition**: The primary relationship dictates that system behavior is determined by fundamental constraints.
- **Dynamic Equilibrium**: The system balances opposing forces until steady state is reached.
- **Critical Variables**: Pay careful attention to boundary conditions and units of measurement.

## 2. Step-by-Step Mechanism
1. **Initiation**: The initial trigger or state setup occurs when conditions meet threshold.
2. **Propagation**: Secondary steps proceed according to standard kinetic or logical pathways.
3. **Termination / Resolution**: The process concludes, yielding measurable outcomes and stable products.

## 3. High-Yield Exam Traps
- Avoid confusing inverse relationships with direct relationships.
- Double-check signs and dimensional analysis before committing final answers.
- Remember edge cases where simplified models fail (e.g., extreme pressures, non-ideal behavior).`,
    keyTakeaways: [
      `Master the core equations and definitions for ${params.topic}`,
      'Identify whether the process is governed by kinetics or thermodynamics',
      'Pay attention to conservation rules and boundary conditions',
      'Practice solving multi-step synthesis and calculation problems'
    ],
    mnemonics: [
      `OIL RIG: Oxidation Is Loss, Reduction Is Gain of electrons`,
      `P-M-A-T: Prophase, Metaphase, Anaphase, Telophase`
    ],
    tags: [params.subject.toLowerCase(), params.topic.toLowerCase().replace(/\\s+/g, '-'), 'study-notes', 'high-yield']
  };
}

/**
 * Generate interactive multiple-choice quiz
 */
export async function generateQuizAI(params: {
  subject: string;
  topic: string;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}) {
  const ai = getAIClient();
  const count = Math.min(10, Math.max(3, Number(params.questionCount) || 5));

  const prompt = `Create a ${params.difficulty} difficulty multiple-choice quiz on:
Subject: ${params.subject}
Topic: ${params.topic}
Total Questions: ${count}

Return ONLY a valid JSON object matching this schema:
{
  "title": "${params.topic} Assessment Quiz",
  "questions": [
    {
      "id": 1,
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed pedagogical explanation of why this answer is correct and why other options are incorrect."
    }
  ]
}`;

  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            systemInstruction: 'You are a master standardized test author (USMLE, MCAT, GRE, AP). Create rigorous, plausible multiple-choice questions with thorough explanations. Output strict valid JSON.',
          },
        }),
        3500
      );

      const text = response.text;
      if (text) {
        return JSON.parse(text.trim());
      }
    } catch (err) {
      console.warn('Gemini API call failed for quiz, using fallback:', err);
    }
  }

  // Algorithmic fallback
  const fallbackQuestions = [
    {
      id: 1,
      question: `Which fundamental principle is most critical to understanding ${params.topic} in ${params.subject}?`,
      options: [
        'Conservation of energy and state equilibrium',
        'Arbitrary random fluctuations without governing rules',
        'Independent variation of non-correlated variables',
        'Complete absence of feedback mechanisms'
      ],
      correctIndex: 0,
      explanation: 'Conservation laws and state equilibrium form the bedrock of physical and biological systems, ensuring that matter, energy, and information obey balance equations.'
    },
    {
      id: 2,
      question: `What occurs when the primary driving force in ${params.topic} is doubled under constant conditions?`,
      options: [
        'The response parameter remains completely unaffected',
        'The output rate or yield increases proportionally or exponentially based on governing order',
        'The system permanently halts all activity',
        'The backward reaction completely eliminates all forward products'
      ],
      correctIndex: 1,
      explanation: 'In linear or power-law systems, increasing the input gradient or driving force accelerates the rate of transfer or reaction proportionally.'
    },
    {
      id: 3,
      question: `What is the most common pitfall students encounter when analyzing ${params.topic}?`,
      options: [
        'Over-reliance on standardized definitions',
        'Neglecting boundary conditions and simplifying assumptions',
        'Verifying dimensional analysis and units',
        'Drawing clear system boundary diagrams'
      ],
      correctIndex: 1,
      explanation: 'Students frequently apply standard formulas without verifying whether the underlying assumptions (such as ideal behavior, steady-state, or reversibility) hold true.'
    },
    {
      id: 4,
      question: `How is dynamic stability maintained in systems related to ${params.topic}?`,
      options: [
        'Through negative feedback and self-regulating compensatory loops',
        'By avoiding any interaction with the surrounding environment',
        'By maximizing friction and dissipation indiscriminately',
        'By preventing any input of energy or matter'
      ],
      correctIndex: 0,
      explanation: 'Negative feedback loops counteract perturbations from equilibrium, restoring the set point and ensuring long-term operational stability.'
    },
    {
      id: 5,
      question: `In an experimental setting evaluating ${params.topic}, what is the role of a negative control?`,
      options: [
        'To demonstrate maximum possible response under extreme stress',
        'To establish baseline measurements and verify that the observed effect is dependent on the experimental variable',
        'To replace the need for statistical sample sizes',
        'To intentionally invalidate the hypothesis'
      ],
      correctIndex: 1,
      explanation: 'Negative controls confirm that without the active agent or variable, the measured outcome remains at baseline, ruling out false positives from artifacts.'
    }
  ].slice(0, count);

  return {
    title: `${params.topic} Diagnostic Quiz (${params.difficulty})`,
    questions: fallbackQuestions
  };
}

/**
 * Generate flashcard decks
 */
export async function generateFlashcardsAI(params: {
  subject: string;
  topic: string;
  cardCount: number;
}) {
  const ai = getAIClient();
  const count = Math.min(15, Math.max(4, Number(params.cardCount) || 6));

  const prompt = `Create a high-yield flashcard deck for:
Subject: ${params.subject}
Topic: ${params.topic}
Card Count: ${count}

Return ONLY a valid JSON object matching this schema:
{
  "title": "${params.topic} Flashcard Deck",
  "cards": [
    {
      "id": "c1",
      "front": "Clear, specific prompt or question on front of card",
      "back": "Concise, precise answer or definition on back",
      "hint": "Brief memory cue or mnemonic hint",
      "mastery": "new"
    }
  ]
}`;

  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            systemInstruction: 'You are an expert in spaced repetition (Anki, SuperMemo). Create atomic, unambiguous flashcards designed for maximum retention.',
          },
        }),
        3500
      );

      const text = response.text;
      if (text) {
        return JSON.parse(text.trim());
      }
    } catch (err) {
      console.warn('Gemini API call failed for flashcards, using fallback:', err);
    }
  }

  // Algorithmic fallback
  const cards = [
    {
      id: 'c1',
      front: `What is the primary definition and scope of ${params.topic}?`,
      back: `${params.topic} is the formal study and application of governing principles within ${params.subject}, characterizing states, transformations, and interactions.`,
      hint: 'Fundamental definition',
      mastery: 'new'
    },
    {
      id: 'c2',
      front: `What is the key governing formula or rule in ${params.topic}?`,
      back: `Dependent variable is a function of primary driving potential divided by system resistance or characteristic scale.`,
      hint: 'Think Ohm\'s / Fick\'s law analogy',
      mastery: 'new'
    },
    {
      id: 'c3',
      front: `How does temperature / energy state influence ${params.topic}?`,
      back: `Higher thermal energy increases molecular velocity and reaction collision frequency, accelerating rate according to Arrhenius behavior.`,
      hint: 'Arrhenius activation barrier',
      mastery: 'new'
    },
    {
      id: 'c4',
      front: `What constitutes a reversible process in the context of ${params.topic}?`,
      back: `A process whose direction can be returned to its initial state by infinitesimal changes in external properties without net entropy generation in the universe.`,
      hint: 'Quasi-static & frictionless',
      mastery: 'new'
    },
    {
      id: 'c5',
      front: `What is the difference between kinetic control and thermodynamic control?`,
      back: `Kinetic control favors the product that forms fastest (lowest activation barrier, lower temp); thermodynamic control favors the most stable product (lowest overall Gibbs energy, higher temp).`,
      hint: 'Speed vs Stability',
      mastery: 'new'
    },
    {
      id: 'c6',
      front: `State the primary mnemonic or rule of thumb for ${params.topic}.`,
      back: `Always verify conservation of mass and energy before evaluating rate-limiting intermediates.`,
      hint: 'Conservation check',
      mastery: 'new'
    }
  ].slice(0, count);

  return {
    title: `${params.topic} High-Yield Flashcards`,
    cards
  };
}
