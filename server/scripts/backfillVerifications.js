require("dotenv").config();

const pool = require("../config/db");
const {
  analyzeDiscussion,
} = require("../services/verificationService");

const DELAY_BETWEEN_REQUESTS_MS = 15000;
const RATE_LIMIT_RETRY_MS = 65000;
const MAX_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRateLimitError(error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  return (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("quota exceeded")
  );
}

async function analyzeWithRetry(payload, questionId) {
  for (
    let attempt = 1;
    attempt <= MAX_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await analyzeDiscussion(payload);
    } catch (error) {
      const isLastAttempt =
        attempt === MAX_ATTEMPTS;

      if (
        !isRateLimitError(error) ||
        isLastAttempt
      ) {
        throw error;
      }

      console.log(
        `Rate limit hit for question ${questionId}. ` +
          `Waiting ${RATE_LIMIT_RETRY_MS / 1000}s ` +
          `before retry ${attempt + 1}/${MAX_ATTEMPTS}...`
      );

      await sleep(RATE_LIMIT_RETRY_MS);
    }
  }

  throw new Error(
    `Verification failed for question ${questionId}.`
  );
}

async function backfillVerifications() {
  try {
    const [questions] = await pool.execute(`
      SELECT
        q.id,
        q.question_text AS text,
        q.ai_context AS aiContext
      FROM questions q
      LEFT JOIN question_verifications v
        ON v.question_id = q.id
      WHERE v.question_id IS NULL
      ORDER BY q.id ASC
    `);

    console.log(
      `Found ${questions.length} unverified question(s).`
    );

    for (
      let index = 0;
      index < questions.length;
      index += 1
    ) {
      const question = questions[index];

      try {
        const [comments] = await pool.execute(
          `
            SELECT
              comment_text AS text,
              author
            FROM comments
            WHERE question_id = ?
            ORDER BY created_at ASC
          `,
          [question.id]
        );

        console.log(
          `\nVerifying question ${question.id}: ${question.text}`
        );

        const verification =
          await analyzeWithRetry(
            {
              question: question.text,
              aiContext:
                question.aiContext ?? null,
              comments,
            },
            question.id
          );

        await pool.execute(
          `
            INSERT INTO question_verifications
              (
                question_id,
                discussion_type,
                confidence_score,
                verdict,
                explanation
              )
            VALUES (?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE
              discussion_type =
                VALUES(discussion_type),
              confidence_score =
                VALUES(confidence_score),
              verdict =
                VALUES(verdict),
              explanation =
                VALUES(explanation),
              analyzed_at =
                CURRENT_TIMESTAMP
          `,
          [
            question.id,
            verification.discussionType,
            verification.confidenceScore,
            verification.verdict,
            verification.explanation,
          ]
        );

        console.log(
          `✓ Question ${question.id}: ` +
            `${verification.confidenceScore}%`
        );
      } catch (error) {
        console.error(
          `✗ Failed question ${question.id}:`,
          error instanceof Error
            ? error.message
            : error
        );
      }

      const hasMoreQuestions =
        index < questions.length - 1;

      if (hasMoreQuestions) {
        console.log(
          `Waiting ${
            DELAY_BETWEEN_REQUESTS_MS / 1000
          }s before next question...`
        );

        await sleep(
          DELAY_BETWEEN_REQUESTS_MS
        );
      }
    }

    console.log("\nBackfill complete.");
  } catch (error) {
    console.error(
      "Backfill failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

backfillVerifications();



// require("dotenv").config();

// const pool = require("../config/db");
// const {
//   analyzeDiscussion,
// } = require("../services/verificationService");

// async function backfillVerifications() {
//   try {
//     const [questions] = await pool.execute(`
//       SELECT
//         q.id,
//         q.question_text AS text,
//         q.ai_context AS aiContext
//       FROM questions q
//       LEFT JOIN question_verifications v
//         ON v.question_id = q.id
//       WHERE v.question_id IS NULL
//       ORDER BY q.id ASC
//     `);

//     console.log(
//       `Found ${questions.length} unverified question(s).`
//     );

//     for (const question of questions) {
//       try {
//         const [comments] = await pool.execute(
//           `
//             SELECT
//               comment_text AS text,
//               author
//             FROM comments
//             WHERE question_id = ?
//             ORDER BY created_at ASC
//           `,
//           [question.id]
//         );

//         console.log(
//           `\nVerifying question ${question.id}: ${question.text}`
//         );

//         const verification = await analyzeDiscussion({
//           question: question.text,
//           aiContext: question.aiContext ?? null,
//           comments,
//         });

//         await pool.execute(
//           `
//             INSERT INTO question_verifications
//               (
//                 question_id,
//                 discussion_type,
//                 confidence_score,
//                 verdict,
//                 explanation
//               )
//             VALUES (?, ?, ?, ?, ?)

//             ON DUPLICATE KEY UPDATE
//               discussion_type = VALUES(discussion_type),
//               confidence_score = VALUES(confidence_score),
//               verdict = VALUES(verdict),
//               explanation = VALUES(explanation),
//               analyzed_at = CURRENT_TIMESTAMP
//           `,
//           [
//             question.id,
//             verification.discussionType,
//             verification.confidenceScore,
//             verification.verdict,
//             verification.explanation,
//           ]
//         );

//         console.log(
//           `✓ Question ${question.id}: ${verification.confidenceScore}%`
//         );
//       } catch (error) {
//         console.error(
//           `✗ Failed question ${question.id}:`,
//           error.message
//         );
//       }
//     }

//     console.log("\nBackfill complete.");
//   } catch (error) {
//     console.error("Backfill failed:", error);
//     process.exitCode = 1;
//   } finally {
//     await pool.end();
//   }
// }

// backfillVerifications();

// // const pool = require("../config/db");
// // const verificationService = require("../services/verificationService");

// // async function backfillVerifications() {
// //   try {
// //     const [questions] = await pool.execute(`
// //       SELECT
// //         q.id,
// //         q.question_text AS text,
// //         q.ai_context AS aiContext
// //       FROM questions q
// //       LEFT JOIN question_verifications v
// //         ON v.question_id = q.id
// //       WHERE v.question_id IS NULL
// //       ORDER BY q.id ASC
// //     `);

// //     console.log(
// //       `Found ${questions.length} unverified question(s).`
// //     );

// //     for (const question of questions) {
// //       try {
// //         const [commentRows] = await pool.execute(
// //           `
// //             SELECT
// //               comment_text AS text,
// //               author
// //             FROM comments
// //             WHERE question_id = ?
// //             ORDER BY created_at ASC
// //           `,
// //           [question.id]
// //         );

// //         console.log(
// //           `\nVerifying question ${question.id}: ${question.text}`
// //         );

// //         const verification =
// //           await verificationService.verifyDiscussion({
// //             question: question.text,
// //             aiContext: question.aiContext,
// //             comments: commentRows,
// //           });

// //         await pool.execute(
// //           `
// //             INSERT INTO question_verifications
// //               (
// //                 question_id,
// //                 discussion_type,
// //                 confidence_score,
// //                 verdict,
// //                 explanation
// //               )
// //             VALUES (?, ?, ?, ?, ?)

// //             ON DUPLICATE KEY UPDATE
// //               discussion_type = VALUES(discussion_type),
// //               confidence_score = VALUES(confidence_score),
// //               verdict = VALUES(verdict),
// //               explanation = VALUES(explanation),
// //               analyzed_at = CURRENT_TIMESTAMP
// //           `,
// //           [
// //             question.id,
// //             verification.discussionType,
// //             verification.confidenceScore,
// //             verification.verdict,
// //             verification.explanation,
// //           ]
// //         );

// //         console.log(
// //           `✓ Question ${question.id}: ${verification.confidenceScore}%`
// //         );
// //       } catch (error) {
// //         console.error(
// //           `✗ Failed question ${question.id}:`,
// //           error.message
// //         );
// //       }
// //     }

// //     console.log("\nBackfill complete.");
// //   } catch (error) {
// //     console.error("Backfill failed:", error);
// //     process.exitCode = 1;
// //   } finally {
// //     await pool.end();
// //   }
// // }

// // backfillVerifications();