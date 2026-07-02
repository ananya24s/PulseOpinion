const pool = require('../config/db');
async function fetchQuestionWithComments(id) {
  const [questionRows] = await pool.execute(
    `SELECT
       id,
       question_text  AS text,
       author,
       category,
       likes,
       dislikes,
       created_at     AS createdAt
     FROM questions
     WHERE id = ?`,
    [id]
  );

  // No row found — signal this to the controller so it can return 404
  if (questionRows.length === 0) return null;

  const question = questionRows[0];

  // Fetch all comments for this question, oldest first so they read naturally
  const [commentRows] = await pool.execute(
    `SELECT
       id,
       comment_text  AS text,
       author,
       created_at    AS createdAt
     FROM comments
     WHERE question_id = ?
     ORDER BY created_at ASC`,
    [id]
  );

  question.comments = commentRows;
  return question;
}

// ── READ ─────────────────────────────────────────────────────────────────────

// Returns all questions newest-first, each with its full comments array.
async function getAllQuestions() {
  // Fetch all questions ordered by newest first
  const [questionRows] = await pool.execute(
    `SELECT
       id,
       question_text  AS text,
       author,
       category,
       likes,
       dislikes,
       created_at     AS createdAt
     FROM questions
     ORDER BY created_at DESC`
  );

  if (questionRows.length === 0) return [];

  // Collect all question IDs so we can fetch all comments in one query
  // instead of one query per question (avoids the N+1 problem).
  const ids = questionRows.map((q) => q.id);

  // mysql2 handles arrays in IN(?) by expanding them correctly
  const [commentRows] = await pool.execute(
    `SELECT
       id,
       question_id,
       comment_text  AS text,
       author,
       created_at    AS createdAt
     FROM comments
     WHERE question_id IN (?)
     ORDER BY created_at ASC`,
    [ids]
  );

  // Group comments by question_id into a Map for O(1) lookup
  const commentsByQuestion = new Map();
  for (const comment of commentRows) {
    if (!commentsByQuestion.has(comment.question_id)) {
      commentsByQuestion.set(comment.question_id, []);
    }
    commentsByQuestion.get(comment.question_id).push({
      id:        comment.id,
      text:      comment.text,
      author:    comment.author,
      createdAt: comment.createdAt,
    });
  }

  // Attach the pre-grouped comments to each question
  return questionRows.map((q) => ({
    ...q,
    comments: commentsByQuestion.get(q.id) ?? [],
  }));
}

async function createQuestion({ text, category }) {
  const [result] = await pool.execute(
    `INSERT INTO questions (author, question_text, category)
     VALUES (?, ?, ?)`,
    ['You', text.trim(), category ?? 'General']
  );

  // result.insertId is the AUTO_INCREMENT id MySQL assigned to the new row
  return fetchQuestionWithComments(result.insertId);
}

// ── VOTE ──────────────────────────────────────────────────────────────────────

// Atomically increments likes by 1 using SQL arithmetic — no read-then-write race.
async function likeQuestion(id) {
  const [result] = await pool.execute(
    `UPDATE questions SET likes = likes + 1 WHERE id = ?`,
    [id]
  );

  // affectedRows = 0 means no row matched that id
  if (result.affectedRows === 0) return null;

  return fetchQuestionWithComments(id);
}

// Atomically increments dislikes by 1.
async function dislikeQuestion(id) {
  const [result] = await pool.execute(
    `UPDATE questions SET dislikes = dislikes + 1 WHERE id = ?`,
    [id]
  );

  if (result.affectedRows === 0) return null;

  return fetchQuestionWithComments(id);
}

// ── COMMENTS ──────────────────────────────────────────────────────────────────

// Inserts a comment then returns the parent question with all comments.
async function addComment(questionId, { text }) {
  // Verify the parent question exists before inserting — if it doesn't,
  // the FK constraint would throw anyway, but we check explicitly so we
  // can return null (→ 404) rather than a raw DB error.
  const [check] = await pool.execute(
    `SELECT id FROM questions WHERE id = ?`,
    [questionId]
  );

  if (check.length === 0) return null;

  await pool.execute(
    `INSERT INTO comments (question_id, author, comment_text)
     VALUES (?, ?, ?)`,
    [questionId, 'You', text.trim()]
  );

  // Return the full question so the controller response shape stays the same
  return fetchQuestionWithComments(questionId);
}

module.exports = {
  getAllQuestions,
  getQuestionById: fetchQuestionWithComments, // kept for any future controller use
  createQuestion,
  likeQuestion,
  dislikeQuestion,
  addComment,
};


//old in-memory model for refernce and to show changes.
// let questions = [
//   {
//     id: 1,
//     text: 'Will Artificial Intelligence replace software engineers entirely within the next decade?',
//     author: 'Sneha P.',
//     category: 'Technology',
//     likes: 892,
//     dislikes: 654,
//     comments: [
//       { id: 1, text: 'Replace entirely? No. But it will radically change what engineers spend time on.', createdAt: new Date('2025-01-10T09:00:00Z') },
//     ],
//     createdAt: new Date('2025-01-10T08:00:00Z'),
//   },
//   {
//     id: 2,
//     text: 'Should coding be made a compulsory subject from Class 6 onwards in all Indian schools?',
//     author: 'Nisha R.',
//     category: 'Education',
//     likes: 1560,
//     dislikes: 220,
//     comments: [],
//     createdAt: new Date('2025-01-09T14:00:00Z'),
//   },
//   {
//     id: 3,
//     text: 'Are OTT platforms like Netflix and Prime killing the magic of Bollywood cinema?',
//     author: 'Karan B.',
//     category: 'Entertainment',
//     likes: 980,
//     dislikes: 340,
//     comments: [],
//     createdAt: new Date('2025-01-08T11:00:00Z'),
//   },
// ];

// // Auto-incrementing ID counter — starts after the seed data
// let nextId = 4;

// // ── READ ─────────────────────────────────────────────────────────────────────

// // Returns all questions, newest first
// async function getAllQuestions() {
//   return [...questions].sort((a, b) => b.createdAt - a.createdAt);
// }

// // Returns a single question by id, or null if not found
// async function getQuestionById(id) {
//   return questions.find((q) => q.id === id) ?? null;
// }

// // ── CREATE ────────────────────────────────────────────────────────────────────

// // Creates a new question from the provided text and category
// async function createQuestion({ text, category }) {
//   const question = {
//     id:        nextId++,
//     text:      text.trim(),
//     author:    'You',
//     category:  category ?? 'General',
//     likes:     0,
//     dislikes:  0,
//     comments:  [],
//     createdAt: new Date(),
//   };

//   questions.push(question);
//   return question;
// }

// // ── VOTE ──────────────────────────────────────────────────────────────────────

// // Increments likes on a question; returns the updated question or null
// async function likeQuestion(id) {
//   const question = questions.find((q) => q.id === id);
//   if (!question) return null;

//   question.likes += 1;
//   return question;
// }

// // Increments dislikes on a question; returns the updated question or null
// async function dislikeQuestion(id) {
//   const question = questions.find((q) => q.id === id);
//   if (!question) return null;

//   question.dislikes += 1;
//   return question;
// }

// // ── COMMENTS ──────────────────────────────────────────────────────────────────

// // Appends a comment to a question; returns the updated question or null
// async function addComment(questionId, { text }) {
//   const question = questions.find((q) => q.id === questionId);
//   if (!question) return null;

//   const comment = {
//     id:        question.comments.length + 1,
//     text:      text.trim(),
//     author:    'You',
//     createdAt: new Date(),
//   };

//   question.comments.push(comment);
//   return question;
// }

// module.exports = {
//   getAllQuestions,
//   getQuestionById,
//   createQuestion,
//   likeQuestion,
//   dislikeQuestion,
//   addComment,
// };
