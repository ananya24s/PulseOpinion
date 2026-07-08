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
       id,
       user_id        AS userId,
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
  attachment = null,
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows] = await connection.execute(
      `SELECT name FROM users WHERE id = ?`,
      [userId]
    );

    if (userRows.length === 0) {
      throw new Error("User not found");
    }

    const author = userRows[0].name;

    const [result] = await connection.execute(
      `INSERT INTO questions
        (author, user_id, question_text, category)
       VALUES (?, ?, ?, ?)`,
      [
        author,
        userId,
        text.trim(),
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

module.exports = {
  getAllQuestions,
  getQuestionById: fetchQuestionWithComments,/*kept for any future controller use*/
  createQuestion,
  likeQuestion,
  dislikeQuestion,
  addComment,
  deleteQuestion,
};