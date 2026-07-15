const pool = require('../config/db');
async function fetchQuestionWithComments(id, userId = null) {
  const [questionRows] = await pool.execute(
    `SELECT
       id,
       question_text  AS text,
       ai_context AS aiContext,
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

  const [opinionRows] = await pool.execute(
    `SELECT opinion, COUNT(*) AS count
     FROM opinion_votes
     WHERE question_id = ?
     GROUP BY opinion`,
    [id]
  );

  question.agreeCount = 0;
  question.disagreeCount = 0;
  question.unsureCount = 0;

  for (const row of opinionRows) {
    question[`${row.opinion}Count`] = Number(row.count);
  }

  question.userOpinion = null;

  if (userId) {
    const [userOpinionRows] = await pool.execute(
      `SELECT opinion
       FROM opinion_votes
       WHERE question_id = ? AND user_id = ?`,
      [id, userId]
    );

    question.userOpinion =
      userOpinionRows[0]?.opinion ?? null;
  }

  return question;
}
async function getAllQuestions(userId) {
  const [questionRows] = await pool.execute(
  `SELECT
   q.id,
   q.user_id AS userId,
   q.question_text AS text,
   q.ai_context AS aiContext,
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
  let opinionsByQuestion = new Map();

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

    const [userOpinionRows] = await pool.execute(
      `SELECT question_id, opinion
       FROM opinion_votes
       WHERE user_id = ?`,
      [userId]
    );

    opinionsByQuestion = new Map(
      userOpinionRows.map((row) => [
        row.question_id,
        row.opinion,
      ])
    );
  }

  const [opinionCountRows] = await pool.execute(
    `SELECT
       question_id,
       SUM(opinion = 'agree') AS agreeCount,
       SUM(opinion = 'disagree') AS disagreeCount,
       SUM(opinion = 'unsure') AS unsureCount
     FROM opinion_votes
     WHERE question_id IN (${placeholders})
     GROUP BY question_id`,
    ids
  );

  const opinionCountsByQuestion = new Map(
    opinionCountRows.map((row) => [
      row.question_id,
      {
        agreeCount: Number(row.agreeCount || 0),
        disagreeCount: Number(row.disagreeCount || 0),
        unsureCount: Number(row.unsureCount || 0),
      },
    ])
  );

  return questionRows.map((q) => ({
    ...q,
    userVote: votesByQuestion.get(q.id) ?? null,
    userOpinion: opinionsByQuestion.get(q.id) ?? null,
    ...(opinionCountsByQuestion.get(q.id) ?? {
      agreeCount: 0,
      disagreeCount: 0,
      unsureCount: 0,
    }),
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
            category
          )
         VALUES (?, ?, ?, ?, ?)`,
        [
          author,
          userId,
          text.trim(),
          aiContext?.trim() || null,
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
async function handleOpinionVote(
  questionId,
  userId,
  opinion
) {
  const allowedOpinions = new Set([
    "agree",
    "disagree",
    "unsure",
  ]);

  if (!allowedOpinions.has(opinion)) {
    throw new Error("Invalid opinion");
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [questionRows] = await connection.execute(
      `SELECT id
       FROM questions
       WHERE id = ?
       FOR UPDATE`,
      [questionId]
    );

    if (questionRows.length === 0) {
      await connection.rollback();
      return null;
    }

    const [existingRows] = await connection.execute(
      `SELECT opinion
       FROM opinion_votes
       WHERE question_id = ? AND user_id = ?`,
      [questionId, userId]
    );

    const existingOpinion =
      existingRows[0]?.opinion ?? null;

    let userOpinion = opinion;

    if (existingOpinion === opinion) {
      await connection.execute(
        `DELETE FROM opinion_votes
         WHERE question_id = ? AND user_id = ?`,
        [questionId, userId]
      );

      userOpinion = null;
    } else if (existingOpinion) {
      await connection.execute(
        `UPDATE opinion_votes
         SET opinion = ?
         WHERE question_id = ? AND user_id = ?`,
        [opinion, questionId, userId]
      );
    } else {
      await connection.execute(
        `INSERT INTO opinion_votes
          (question_id, user_id, opinion)
         VALUES (?, ?, ?)`,
        [questionId, userId, opinion]
      );
    }

    const [countRows] = await connection.execute(
      `SELECT
         SUM(opinion = 'agree') AS agreeCount,
         SUM(opinion = 'disagree') AS disagreeCount,
         SUM(opinion = 'unsure') AS unsureCount
       FROM opinion_votes
       WHERE question_id = ?`,
      [questionId]
    );

    await connection.commit();

    return {
      userOpinion,
      agreeCount: Number(
        countRows[0]?.agreeCount || 0
      ),
      disagreeCount: Number(
        countRows[0]?.disagreeCount || 0
      ),
      unsureCount: Number(
        countRows[0]?.unsureCount || 0
      ),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
  handleOpinionVote,
};
// const pool = require('../config/db');
// async function fetchQuestionWithComments(id) {
//   const [questionRows] = await pool.execute(
//     `SELECT
//        id,
//        question_text  AS text,
//        ai_context AS aiContext,
//        author,
//        category,
//        likes,
//        dislikes,
//        created_at     AS createdAt
//      FROM questions
//      WHERE id = ?`,
//     [id]
//   );
//   if (questionRows.length === 0) return null;
//   const question = questionRows[0];
//   const [commentRows] = await pool.execute(
//     `SELECT
//        id,
//        comment_text  AS text,
//        author,
//        created_at    AS createdAt
//      FROM comments
//      WHERE question_id = ?
//      ORDER BY created_at ASC`,
//     [id]
//   );

//   question.comments = commentRows;
//   return question;
// }
// async function getAllQuestions(userId) {
//   const [questionRows] = await pool.execute(
//   `SELECT
//    q.id,
//    q.user_id AS userId,
//    q.question_text AS text,
//    q.ai_context AS aiContext,
//    q.author,
//    q.category,
//    q.likes,
//    q.dislikes,
//    q.created_at AS createdAt,

//    v.discussion_type AS verificationType,
//    v.confidence_score AS verificationScore,
//    v.verdict AS verificationVerdict,
//    v.explanation AS verificationExplanation,
//    v.analyzed_at AS verificationAnalyzedAt

//    FROM questions q

//    LEFT JOIN question_verifications v
//    ON v.question_id = q.id

//   ORDER BY q.created_at DESC`
//   );

//   if (questionRows.length === 0) return [];

//   const ids = questionRows.map((q) => q.id);

//   const placeholders = ids.map(() => '?').join(',');

//   const [commentRows] = await pool.execute(
//     `SELECT
//        id,
//        question_id,
//        comment_text AS text,
//        author,
//        created_at AS createdAt
//      FROM comments
//      WHERE question_id IN (${placeholders})
//      ORDER BY created_at ASC`,
//     ids
//   );

//   const commentsByQuestion = new Map();

//   for (const comment of commentRows) {
//     if (!commentsByQuestion.has(comment.question_id)) {
//       commentsByQuestion.set(comment.question_id, []);
//     }

//     commentsByQuestion.get(comment.question_id).push({
//       id: comment.id,
//       text: comment.text,
//       author: comment.author,
//       createdAt: comment.createdAt,
//     });
//   }

//   let votesByQuestion = new Map();

//   if (userId) {
//     const [voteRows] = await pool.execute(
//       `SELECT question_id, vote_type
//        FROM votes
//        WHERE user_id = ?`,
//       [userId]
//     );

//     votesByQuestion = new Map(
//       voteRows.map((v) => [
//         v.question_id,
//         v.vote_type,
//       ])
//     );
//   }

//   return questionRows.map((q) => ({
//     ...q,
//     userVote: votesByQuestion.get(q.id) ?? null,
//     comments: commentsByQuestion.get(q.id) ?? [],
//   }));
// }

// async function deleteQuestion(questionId, userId) {
//   const [rows] = await pool.execute(
//     `SELECT user_id
//      FROM questions
//      WHERE id = ?`,
//     [questionId]
//   );

//   if (rows.length === 0) {
//     return 'not_found';
//   }

//   if (Number(rows[0].user_id) !== Number(userId)) {
//     return 'forbidden';
//   }

//   await pool.execute(
//     `DELETE FROM questions
//      WHERE id = ? AND user_id = ?`,
//     [questionId, userId]
//   );

//   return 'deleted';
// }

// async function createQuestion({
//   text,
//   category,
//   userId,
//   aiContext = null,
//   attachment = null,
// }) {
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [userRows] =
//       await connection.execute(
//         `SELECT name FROM users WHERE id = ?`,
//         [userId]
//       );

//     if (userRows.length === 0) {
//       throw new Error("User not found");
//     }

//     const author = userRows[0].name;

//     const [result] =
//       await connection.execute(
//         `INSERT INTO questions
//           (
//             author,
//             user_id,
//             question_text,
//             ai_context,
//             category
//           )
//          VALUES (?, ?, ?, ?, ?)`,
//         [
//           author,
//           userId,
//           text.trim(),
//           aiContext?.trim() || null,
//           category ?? "General",
//         ]
//       );

//     if (attachment) {
//       await connection.execute(
//         `INSERT INTO question_attachments
//           (
//             question_id,
//             original_name,
//             stored_name,
//             mime_type,
//             file_size,
//             file_path
//           )
//          VALUES (?, ?, ?, ?, ?, ?)`,
//         [
//           result.insertId,
//           attachment.originalName,
//           attachment.storedName,
//           attachment.mimeType,
//           attachment.fileSize,
//           attachment.filePath,
//         ]
//       );
//     }

//     await connection.commit();

//     return fetchQuestionWithComments(
//       result.insertId
//     );
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }

// async function handleVote(questionId, userId, voteType) {
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [questions] = await connection.execute(
//       `SELECT id FROM questions WHERE id = ? FOR UPDATE`,
//       [questionId]
//     );

//     if (questions.length === 0) {
//       await connection.rollback();
//       return null;
//     }

//     const [votes] = await connection.execute(
//       `SELECT vote_type FROM votes
//        WHERE user_id = ? AND question_id = ?`,
//       [userId, questionId]
//     );

//     const existingVote = votes[0]?.vote_type;

//     if (!existingVote) {
//       await connection.execute(
//         `INSERT INTO votes (user_id, question_id, vote_type)
//          VALUES (?, ?, ?)`,
//         [userId, questionId, voteType]
//       );

//       const column = voteType === "like" ? "likes" : "dislikes";

//       await connection.query(
//         `UPDATE questions SET ${column} = ${column} + 1 WHERE id = ?`,
//         [questionId]
//       );
//     }

//     else if (existingVote === voteType) {
//       await connection.execute(
//         `DELETE FROM votes
//          WHERE user_id = ? AND question_id = ?`,
//         [userId, questionId]
//       );

//       const column = voteType === "like" ? "likes" : "dislikes";

//       await connection.query(
//         `UPDATE questions
//          SET ${column} = GREATEST(${column} - 1, 0)
//          WHERE id = ?`,
//         [questionId]
//       );
//     }
//     else {
//       await connection.execute(
//         `UPDATE votes
//          SET vote_type = ?
//          WHERE user_id = ? AND question_id = ?`,
//         [voteType, userId, questionId]
//       );

//       if (voteType === "like") {
//         await connection.execute(
//           `UPDATE questions
//            SET likes = likes + 1,
//                dislikes = GREATEST(dislikes - 1, 0)
//            WHERE id = ?`,
//           [questionId]
//         );
//       } else {
//         await connection.execute(
//           `UPDATE questions
//            SET dislikes = dislikes + 1,
//                likes = GREATEST(likes - 1, 0)
//            WHERE id = ?`,
//           [questionId]
//         );
//       }
//     }

//     await connection.commit();
//     return fetchQuestionWithComments(questionId);

//   } catch (err) {
//     await connection.rollback();
//     throw err;
//   } finally {
//     connection.release();
//   }
// }

// async function likeQuestion(id, userId) {
//   return handleVote(id, userId, "like");
// }

// async function dislikeQuestion(id, userId) {
//   return handleVote(id, userId, "dislike");
// }

// async function addComment(questionId, { text, userId }) {
//   const [check] = await pool.execute(
//     `SELECT id FROM questions WHERE id = ?`,
//     [questionId]
//   );

//   if (check.length === 0) return null;

//   const [userRows] = await pool.execute(
//     `SELECT name FROM users WHERE id = ?`,
//     [userId]
//   );

//   if (userRows.length === 0) {
//     throw new Error("User not found");
//   }

//   const author = userRows[0].name;

//   await pool.execute(
//     `INSERT INTO comments (question_id, author, user_id, comment_text)
//      VALUES (?, ?, ?, ?)`,
//     [questionId, author, userId, text.trim()]
//   );

//   return fetchQuestionWithComments(questionId);
// }
// async function getDiscussionForVerification(
//   questionId
// ) {
//   const [questionRows] = await pool.execute(
//     `SELECT
//        id,
//        question_text AS text,
//        ai_context AS aiContext
//      FROM questions
//      WHERE id = ?`,
//     [questionId]
//   );

//   if (questionRows.length === 0) {
//     return null;
//   }

//   const [commentRows] = await pool.execute(
//     `SELECT
//        id,
//        comment_text AS text,
//        author,
//        created_at AS createdAt
//      FROM comments
//      WHERE question_id = ?
//      ORDER BY created_at ASC`,
//     [questionId]
//   );

//   return {
//     ...questionRows[0],
//     comments: commentRows,
//   };
// }

// async function upsertVerification(
//   questionId,
//   {
//     discussionType,
//     confidenceScore,
//     verdict,
//     explanation,
//   }
// ) {
//   await pool.execute(
//     `INSERT INTO question_verifications
//       (
//         question_id,
//         discussion_type,
//         confidence_score,
//         verdict,
//         explanation,
//         analyzed_at
//       )
//      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
//      ON DUPLICATE KEY UPDATE
//        discussion_type = VALUES(discussion_type),
//        confidence_score = VALUES(confidence_score),
//        verdict = VALUES(verdict),
//        explanation = VALUES(explanation),
//        analyzed_at = CURRENT_TIMESTAMP`,
//     [
//       questionId,
//       discussionType,
//       confidenceScore,
//       verdict,
//       explanation,
//     ]
//   );

//   const [rows] = await pool.execute(
//     `SELECT
//        question_id AS questionId,
//        discussion_type AS discussionType,
//        confidence_score AS confidenceScore,
//        verdict,
//        explanation,
//        analyzed_at AS analyzedAt,
//        updated_at AS updatedAt
//      FROM question_verifications
//      WHERE question_id = ?`,
//     [questionId]
//   );

//   return rows[0] || null;
// }
// module.exports = {
//   getAllQuestions,
//   getQuestionById: fetchQuestionWithComments,
//   getDiscussionForVerification,
//   upsertVerification,
//   createQuestion,
//   likeQuestion,
//   dislikeQuestion,
//   addComment,
//   deleteQuestion,
// };