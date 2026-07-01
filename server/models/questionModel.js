// models/questionModel.js
//
// Responsibility: owns the questions data and every operation on it.
// Controllers never touch `questions` directly — they always go through
// these functions. When we swap to MySQL, only this file changes.

// In-memory store — lives as long as the server process is running
let questions = [
  {
    id: 1,
    text: 'Will Artificial Intelligence replace software engineers entirely within the next decade?',
    author: 'Sneha P.',
    category: 'Technology',
    likes: 892,
    dislikes: 654,
    comments: [
      { id: 1, text: 'Replace entirely? No. But it will radically change what engineers spend time on.', createdAt: new Date('2025-01-10T09:00:00Z') },
    ],
    createdAt: new Date('2025-01-10T08:00:00Z'),
  },
  {
    id: 2,
    text: 'Should coding be made a compulsory subject from Class 6 onwards in all Indian schools?',
    author: 'Nisha R.',
    category: 'Education',
    likes: 1560,
    dislikes: 220,
    comments: [],
    createdAt: new Date('2025-01-09T14:00:00Z'),
  },
  {
    id: 3,
    text: 'Are OTT platforms like Netflix and Prime killing the magic of Bollywood cinema?',
    author: 'Karan B.',
    category: 'Entertainment',
    likes: 980,
    dislikes: 340,
    comments: [],
    createdAt: new Date('2025-01-08T11:00:00Z'),
  },
];

// Auto-incrementing ID counter — starts after the seed data
let nextId = 4;

// ── READ ─────────────────────────────────────────────────────────────────────

// Returns all questions, newest first
async function getAllQuestions() {
  return [...questions].sort((a, b) => b.createdAt - a.createdAt);
}

// Returns a single question by id, or null if not found
async function getQuestionById(id) {
  return questions.find((q) => q.id === id) ?? null;
}

// ── CREATE ────────────────────────────────────────────────────────────────────

// Creates a new question from the provided text and category
async function createQuestion({ text, category }) {
  const question = {
    id:        nextId++,
    text:      text.trim(),
    author:    'You',
    category:  category ?? 'General',
    likes:     0,
    dislikes:  0,
    comments:  [],
    createdAt: new Date(),
  };

  questions.push(question);
  return question;
}

// ── VOTE ──────────────────────────────────────────────────────────────────────

// Increments likes on a question; returns the updated question or null
async function likeQuestion(id) {
  const question = questions.find((q) => q.id === id);
  if (!question) return null;

  question.likes += 1;
  return question;
}

// Increments dislikes on a question; returns the updated question or null
async function dislikeQuestion(id) {
  const question = questions.find((q) => q.id === id);
  if (!question) return null;

  question.dislikes += 1;
  return question;
}

// ── COMMENTS ──────────────────────────────────────────────────────────────────

// Appends a comment to a question; returns the updated question or null
async function addComment(questionId, { text }) {
  const question = questions.find((q) => q.id === questionId);
  if (!question) return null;

  const comment = {
    id:        question.comments.length + 1,
    text:      text.trim(),
    author:    'You',
    createdAt: new Date(),
  };

  question.comments.push(comment);
  return question;
}

module.exports = {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  likeQuestion,
  dislikeQuestion,
  addComment,
};
