const pool = require("../config/db");

async function getOverviewStats() {
  const [[usersResult]] = await pool.execute(
    "SELECT COUNT(*) AS totalUsers FROM users"
  );

  const [[questionsResult]] = await pool.execute(
    "SELECT COUNT(*) AS totalQuestions FROM questions"
  );

  const [[commentsResult]] = await pool.execute(
    "SELECT COUNT(*) AS totalComments FROM comments"
  );

  const [[votesResult]] = await pool.execute(
    "SELECT COUNT(*) AS totalVotes FROM votes"
  );

  return {
    totalUsers: usersResult.totalUsers,
    totalQuestions: questionsResult.totalQuestions,
    totalComments: commentsResult.totalComments,
    totalVotes: votesResult.totalVotes,
  };
}

async function getEngagementStats() {
  const [[likesResult]] = await pool.execute(`
    SELECT COUNT(*) AS likes
    FROM votes
    WHERE vote_type = 'like'
  `);

  const [[dislikesResult]] = await pool.execute(`
    SELECT COUNT(*) AS dislikes
    FROM votes
    WHERE vote_type = 'dislike'
  `);

  const [[commentsResult]] = await pool.execute(`
    SELECT COUNT(*) AS comments
    FROM comments
  `);

  return {
    likes: likesResult.likes,
    dislikes: dislikesResult.dislikes,
    comments: commentsResult.comments,
  };
}

async function getUserAnalytics() {
  const [rows] = await pool.execute(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.created_at AS joined,

      (
        SELECT COUNT(*)
        FROM questions q
        WHERE q.user_id = u.id
      ) AS questions,

      (
        SELECT COUNT(*)
        FROM comments c
        WHERE c.user_id = u.id
      ) AS comments,

      (
        SELECT COUNT(*)
        FROM votes v
        WHERE v.user_id = u.id
          AND v.vote_type = 'like'
      ) AS likesCast,

      (
        SELECT COUNT(*)
        FROM votes v
        WHERE v.user_id = u.id
          AND v.vote_type = 'dislike'
      ) AS dislikesCast,

      (
        (
          SELECT COUNT(*)
          FROM votes received_votes
          INNER JOIN questions owned_questions
            ON owned_questions.id = received_votes.question_id
          WHERE owned_questions.user_id = u.id
        )
        +
        (
          SELECT COUNT(*)
          FROM comments received_comments
          INNER JOIN questions owned_questions
            ON owned_questions.id = received_comments.question_id
          WHERE owned_questions.user_id = u.id
        )
      ) AS engagementReceived

    FROM users u
    ORDER BY u.created_at DESC
  `);

  return rows;
}

async function getRecentActivity() {
  const [rows] = await pool.execute(`
    SELECT *
    FROM (
      SELECT
        CONCAT('question-', q.id) AS id,
        'question' AS type,
        COALESCE(u.name, q.author) AS user,
        'posted a new question' AS text,
        q.question_text AS target,
        q.created_at AS createdAt
      FROM questions q
      LEFT JOIN users u
        ON u.id = q.user_id

      UNION ALL

      SELECT
        CONCAT('comment-', c.id) AS id,
        'comment' AS type,
        COALESCE(u.name, c.author) AS user,
        'commented on' AS text,
        q.question_text AS target,
        c.created_at AS createdAt
      FROM comments c
      INNER JOIN questions q
        ON q.id = c.question_id
      LEFT JOIN users u
        ON u.id = c.user_id

      UNION ALL

      SELECT
        CONCAT('vote-', v.id) AS id,
        CASE
          WHEN v.vote_type = 'like' THEN 'like'
          ELSE 'dislike'
        END AS type,
        u.name AS user,
        CASE
          WHEN v.vote_type = 'like' THEN 'liked'
          ELSE 'disliked'
        END AS text,
        q.question_text AS target,
        v.created_at AS createdAt
      FROM votes v
      INNER JOIN users u
        ON u.id = v.user_id
      INNER JOIN questions q
        ON q.id = v.question_id

      UNION ALL

      SELECT
        CONCAT('register-', u.id) AS id,
        'register' AS type,
        u.name AS user,
        'registered an account' AS text,
        NULL AS target,
        u.created_at AS createdAt
      FROM users u
    ) AS activity

    ORDER BY createdAt DESC
    LIMIT 6
  `);

  return rows;
}

module.exports = {
  getOverviewStats,
  getEngagementStats,
  getUserAnalytics,
  getRecentActivity,
};
// async function getOverviewStats() {
//   const [[usersResult]] = await pool.execute(
//     "SELECT COUNT(*) AS totalUsers FROM users"
//   );

//   const [[questionsResult]] = await pool.execute(
//     "SELECT COUNT(*) AS totalQuestions FROM questions"
//   );

//   const [[commentsResult]] = await pool.execute(
//     "SELECT COUNT(*) AS totalComments FROM comments"
//   );

//   const [[votesResult]] = await pool.execute(
//     "SELECT COUNT(*) AS totalVotes FROM votes"
//   );

//   return {
//     totalUsers: usersResult.totalUsers,
//     totalQuestions: questionsResult.totalQuestions,
//     totalComments: commentsResult.totalComments,
//     totalVotes: votesResult.totalVotes,
//   };
// }

// async function getEngagementStats() {
//   const [[likesResult]] = await pool.execute(`
//     SELECT COUNT(*) AS likes
//     FROM votes
//     WHERE vote_type = 'like'
//   `);

//   const [[dislikesResult]] = await pool.execute(`
//     SELECT COUNT(*) AS dislikes
//     FROM votes
//     WHERE vote_type = 'dislike'
//   `);

//   const [[commentsResult]] = await pool.execute(`
//     SELECT COUNT(*) AS comments
//     FROM comments
//   `);

//   return {
//     likes: likesResult.likes,
//     dislikes: dislikesResult.dislikes,
//     comments: commentsResult.comments,
//   };
// }

// async function getUserAnalytics() {
//   const [rows] = await pool.execute(`
//     SELECT
//       u.id,
//       u.name,
//       u.email,
//       u.role,
//       u.created_at AS joined,

//       (
//         SELECT COUNT(*)
//         FROM questions q
//         WHERE q.user_id = u.id
//       ) AS questions,

//       (
//         SELECT COUNT(*)
//         FROM comments c
//         WHERE c.user_id = u.id
//       ) AS comments,

//       (
//         SELECT COUNT(*)
//         FROM votes v
//         WHERE v.user_id = u.id
//           AND v.vote_type = 'like'
//       ) AS likesCast,

//       (
//         SELECT COUNT(*)
//         FROM votes v
//         WHERE v.user_id = u.id
//           AND v.vote_type = 'dislike'
//       ) AS dislikesCast,

//       (
//         (
//           SELECT COUNT(*)
//           FROM votes received_votes
//           INNER JOIN questions owned_questions
//             ON owned_questions.id = received_votes.question_id
//           WHERE owned_questions.user_id = u.id
//         )
//         +
//         (
//           SELECT COUNT(*)
//           FROM comments received_comments
//           INNER JOIN questions owned_questions
//             ON owned_questions.id = received_comments.question_id
//           WHERE owned_questions.user_id = u.id
//         )
//       ) AS engagementReceived

//     FROM users u
//     ORDER BY u.created_at DESC
//   `);

//   return rows;
// }

// module.exports = {
//   getOverviewStats,
//   getEngagementStats,
//   getUserAnalytics,
// };
