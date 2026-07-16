const pool = require('../config/db');

const DUPLICATE_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "could",
  "do", "does", "for", "from", "has", "have", "how", "i", "if",
  "in", "is", "it", "of", "on", "or", "should", "that", "the",
  "their", "this", "to", "was", "were", "what", "when", "where",
  "which", "who", "why", "will", "with", "would", "you", "your"
]);

function normaliseDuplicateText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDuplicateTokens(value) {
  return normaliseDuplicateText(value)
    .split(" ")
    .filter(
      (token) =>
        token.length > 2 &&
        !DUPLICATE_STOP_WORDS.has(token)
    );
}

function getCharacterBigrams(value) {
  const compact = normaliseDuplicateText(value);

  if (compact.length < 2) {
    return new Set(compact ? [compact] : []);
  }

  const bigrams = new Set();

  for (
    let index = 0;
    index < compact.length - 1;
    index += 1
  ) {
    bigrams.add(
      compact.slice(index, index + 2)
    );
  }

  return bigrams;
}

function setIntersectionSize(first, second) {
  let count = 0;

  for (const item of first) {
    if (second.has(item)) {
      count += 1;
    }
  }

  return count;
}

function calculateDuplicateScore(
  firstText,
  secondText
) {
  const firstNormalised =
    normaliseDuplicateText(firstText);

  const secondNormalised =
    normaliseDuplicateText(secondText);

  if (!firstNormalised || !secondNormalised) {
    return 0;
  }

  if (firstNormalised === secondNormalised) {
    return 1;
  }

  const firstTokens = new Set(
    getDuplicateTokens(firstText)
  );

  const secondTokens = new Set(
    getDuplicateTokens(secondText)
  );

  const tokenIntersection =
    setIntersectionSize(
      firstTokens,
      secondTokens
    );

  const minimumTokenCount = Math.min(
    firstTokens.size,
    secondTokens.size
  );

  const oneContainsTheOther =
    firstNormalised.includes(
      secondNormalised
    ) ||
    secondNormalised.includes(
      firstNormalised
    );

  if (
    tokenIntersection < 2 &&
    !oneContainsTheOther
  ) {
    return 0;
  }

  const tokenDice =
    firstTokens.size + secondTokens.size
      ? (2 * tokenIntersection) /
        (firstTokens.size +
          secondTokens.size)
      : 0;

  const containment =
    minimumTokenCount > 0
      ? tokenIntersection /
        minimumTokenCount
      : 0;

  const firstBigrams =
    getCharacterBigrams(firstText);

  const secondBigrams =
    getCharacterBigrams(secondText);

  const bigramIntersection =
    setIntersectionSize(
      firstBigrams,
      secondBigrams
    );

  const bigramDice =
    firstBigrams.size +
    secondBigrams.size
      ? (2 * bigramIntersection) /
        (firstBigrams.size +
          secondBigrams.size)
      : 0;

  const weightedScore =
    tokenDice * 0.55 +
    containment * 0.3 +
    bigramDice * 0.15;

  return Math.min(
    1,
    oneContainsTheOther
      ? Math.max(weightedScore, 0.78)
      : weightedScore
  );
}

async function findSimilarQuestions(
  texts,
  limitPerQuestion = 3
) {
  const safeTexts = Array.isArray(texts)
    ? texts.slice(0, 50)
    : [];

  const [rows] = await pool.execute(
    `SELECT
       q.id,
       q.question_text AS text,
       q.author,
       q.category,
       q.created_at AS createdAt,
       COUNT(DISTINCT c.id) AS commentCount,
       v.confidence_score AS verificationScore
     FROM questions q
     LEFT JOIN comments c
       ON c.question_id = q.id
     LEFT JOIN question_verifications v
       ON v.question_id = q.id
     GROUP BY
       q.id,
       q.question_text,
       q.author,
       q.category,
       q.created_at,
       v.confidence_score
     ORDER BY q.created_at DESC
     LIMIT 500`
  );

  return safeTexts.map((text) => {
    const matches = rows
      .map((row) => ({
        ...row,
        commentCount: Number(
          row.commentCount || 0
        ),
        similarity:
          calculateDuplicateScore(
            text,
            row.text
          ),
      }))
      .filter(
        (row) =>
          row.similarity >= 0.5
      )
      .sort(
        (first, second) =>
          second.similarity -
          first.similarity
      )
      .slice(0, limitPerQuestion)
      .map((row) => ({
        ...row,
        similarity: Math.round(
          row.similarity * 100
        ),
      }));

    return {
      text,
      matches,
    };
  });
}

async function fetchQuestionWithComments(id, userId = null) {
  const [questionRows] = await pool.execute(
    `SELECT
       id,
       question_text  AS text,
       ai_context AS aiContext,
       ai_answer AS aiAnswer,
       author,
       category,
       likes,
       dislikes,
       created_at     AS createdAt
     FROM questions
     WHERE id = ?`,
    [id]
  );
  if (questionRows.length === 0) return null;
  const question = questionRows[0];
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
async function getAllQuestions(userId) {
  const [questionRows] = await pool.execute(
  `SELECT
   q.id,
   q.user_id AS userId,
   q.question_text AS text,
   q.ai_context AS aiContext,
   q.ai_answer AS aiAnswer,
   q.author,
   q.category,
   q.likes,
   q.dislikes,
   q.created_at AS createdAt,

   v.discussion_type AS verificationType,
   v.confidence_score AS verificationScore,
   v.verdict AS verificationVerdict,
   v.explanation AS verificationExplanation,
   v.analyzed_at AS verificationAnalyzedAt

   FROM questions q

   LEFT JOIN question_verifications v
   ON v.question_id = q.id

  ORDER BY q.created_at DESC`
  );

  if (questionRows.length === 0) return [];

  const ids = questionRows.map((q) => q.id);

  const placeholders = ids.map(() => '?').join(',');

  const [commentRows] = await pool.execute(
    `SELECT
       id,
       question_id,
       comment_text AS text,
       author,
       created_at AS createdAt
     FROM comments
     WHERE question_id IN (${placeholders})
     ORDER BY created_at ASC`,
    ids
  );

  const commentsByQuestion = new Map();

  for (const comment of commentRows) {
    if (!commentsByQuestion.has(comment.question_id)) {
      commentsByQuestion.set(comment.question_id, []);
    }

    commentsByQuestion.get(comment.question_id).push({
      id: comment.id,
      text: comment.text,
      author: comment.author,
      createdAt: comment.createdAt,
    });
  }

  let votesByQuestion = new Map();

  if (userId) {
    const [voteRows] = await pool.execute(
      `SELECT question_id, vote_type
       FROM votes
       WHERE user_id = ?`,
      [userId]
    );

    votesByQuestion = new Map(
      voteRows.map((v) => [
        v.question_id,
        v.vote_type,
      ])
    );
  }

  return questionRows.map((q) => ({
    ...q,
    userVote: votesByQuestion.get(q.id) ?? null,
    comments: commentsByQuestion.get(q.id) ?? [],
  }));
}

async function deleteQuestion(questionId, userId) {
  const [rows] = await pool.execute(
    `SELECT user_id
     FROM questions
     WHERE id = ?`,
    [questionId]
  );

  if (rows.length === 0) {
    return 'not_found';
  }

  if (Number(rows[0].user_id) !== Number(userId)) {
    return 'forbidden';
  }

  await pool.execute(
    `DELETE FROM questions
     WHERE id = ? AND user_id = ?`,
    [questionId, userId]
  );

  return 'deleted';
}

async function createQuestion({
  text,
  category,
  userId,
  aiContext = null,
  aiAnswer = null,
  attachment = null,
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows] =
      await connection.execute(
        `SELECT name FROM users WHERE id = ?`,
        [userId]
      );

    if (userRows.length === 0) {
      throw new Error("User not found");
    }

    const author = userRows[0].name;

    const [result] =
      await connection.execute(
        `INSERT INTO questions
          (
            author,
            user_id,
            question_text,
            ai_context,
            ai_answer,
            category
          )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          author,
          userId,
          text.trim(),
          aiContext?.trim() || null,
          aiAnswer?.trim() || null,
          category ?? "General",
        ]
      );

    if (attachment) {
      await connection.execute(
        `INSERT INTO question_attachments
          (
            question_id,
            original_name,
            stored_name,
            mime_type,
            file_size,
            file_path
          )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          result.insertId,
          attachment.originalName,
          attachment.storedName,
          attachment.mimeType,
          attachment.fileSize,
          attachment.filePath,
        ]
      );
    }

    await connection.commit();

    return fetchQuestionWithComments(
      result.insertId
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function handleVote(questionId, userId, voteType) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [questions] = await connection.execute(
      `SELECT id FROM questions WHERE id = ? FOR UPDATE`,
      [questionId]
    );

    if (questions.length === 0) {
      await connection.rollback();
      return null;
    }

    const [votes] = await connection.execute(
      `SELECT vote_type FROM votes
       WHERE user_id = ? AND question_id = ?`,
      [userId, questionId]
    );

    const existingVote = votes[0]?.vote_type;

    if (!existingVote) {
      await connection.execute(
        `INSERT INTO votes (user_id, question_id, vote_type)
         VALUES (?, ?, ?)`,
        [userId, questionId, voteType]
      );

      const column = voteType === "like" ? "likes" : "dislikes";

      await connection.query(
        `UPDATE questions SET ${column} = ${column} + 1 WHERE id = ?`,
        [questionId]
      );
    }

    else if (existingVote === voteType) {
      await connection.execute(
        `DELETE FROM votes
         WHERE user_id = ? AND question_id = ?`,
        [userId, questionId]
      );

      const column = voteType === "like" ? "likes" : "dislikes";

      await connection.query(
        `UPDATE questions
         SET ${column} = GREATEST(${column} - 1, 0)
         WHERE id = ?`,
        [questionId]
      );
    }
    else {
      await connection.execute(
        `UPDATE votes
         SET vote_type = ?
         WHERE user_id = ? AND question_id = ?`,
        [voteType, userId, questionId]
      );

      if (voteType === "like") {
        await connection.execute(
          `UPDATE questions
           SET likes = likes + 1,
               dislikes = GREATEST(dislikes - 1, 0)
           WHERE id = ?`,
          [questionId]
        );
      } else {
        await connection.execute(
          `UPDATE questions
           SET dislikes = dislikes + 1,
               likes = GREATEST(likes - 1, 0)
           WHERE id = ?`,
          [questionId]
        );
      }
    }

    await connection.commit();
    return fetchQuestionWithComments(questionId);

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function likeQuestion(id, userId) {
  return handleVote(id, userId, "like");
}

async function dislikeQuestion(id, userId) {
  return handleVote(id, userId, "dislike");
}

async function addComment(questionId, { text, userId }) {
  const [check] = await pool.execute(
    `SELECT id FROM questions WHERE id = ?`,
    [questionId]
  );

  if (check.length === 0) return null;

  const [userRows] = await pool.execute(
    `SELECT name FROM users WHERE id = ?`,
    [userId]
  );

  if (userRows.length === 0) {
    throw new Error("User not found");
  }

  const author = userRows[0].name;

  await pool.execute(
    `INSERT INTO comments (question_id, author, user_id, comment_text)
     VALUES (?, ?, ?, ?)`,
    [questionId, author, userId, text.trim()]
  );

  return fetchQuestionWithComments(questionId);
}
async function getDiscussionForVerification(
  questionId
) {
  const [questionRows] = await pool.execute(
    `SELECT
       id,
       question_text AS text,
       ai_context AS aiContext
     FROM questions
     WHERE id = ?`,
    [questionId]
  );

  if (questionRows.length === 0) {
    return null;
  }

  const [commentRows] = await pool.execute(
    `SELECT
       id,
       comment_text AS text,
       author,
       created_at AS createdAt
     FROM comments
     WHERE question_id = ?
     ORDER BY created_at ASC`,
    [questionId]
  );

  return {
    ...questionRows[0],
    comments: commentRows,
  };
}

async function upsertVerification(
  questionId,
  {
    discussionType,
    confidenceScore,
    verdict,
    explanation,
  }
) {
  await pool.execute(
    `INSERT INTO question_verifications
      (
        question_id,
        discussion_type,
        confidence_score,
        verdict,
        explanation,
        analyzed_at
      )
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE
       discussion_type = VALUES(discussion_type),
       confidence_score = VALUES(confidence_score),
       verdict = VALUES(verdict),
       explanation = VALUES(explanation),
       analyzed_at = CURRENT_TIMESTAMP`,
    [
      questionId,
      discussionType,
      confidenceScore,
      verdict,
      explanation,
    ]
  );

  const [rows] = await pool.execute(
    `SELECT
       question_id AS questionId,
       discussion_type AS discussionType,
       confidence_score AS confidenceScore,
       verdict,
       explanation,
       analyzed_at AS analyzedAt,
       updated_at AS updatedAt
     FROM question_verifications
     WHERE question_id = ?`,
    [questionId]
  );

  return rows[0] || null;
}

async function getQuestionsMissingAiAnswers(
  limit = 10
) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 10, 1),
    50
  );

  const [rows] = await pool.query(
    `SELECT
       id,
       question_text AS text,
       ai_context AS aiContext
     FROM questions
     WHERE ai_answer IS NULL
        OR TRIM(ai_answer) = ''
     ORDER BY id ASC
     LIMIT ${safeLimit}`
  );

  return rows;
}

async function updateAiAnswer(
  questionId,
  aiAnswer
) {
  await pool.execute(
    `UPDATE questions
     SET ai_answer = ?
     WHERE id = ?`,
    [
      aiAnswer?.trim() || null,
      questionId,
    ]
  );

  return fetchQuestionWithComments(
    questionId
  );
}

module.exports = {
  getAllQuestions,
  getQuestionById: fetchQuestionWithComments,
  getDiscussionForVerification,
  upsertVerification,
  createQuestion,
  likeQuestion,
  dislikeQuestion,
  addComment,
  deleteQuestion,
  findSimilarQuestions,
  getQuestionsMissingAiAnswers,
  updateAiAnswer,
};