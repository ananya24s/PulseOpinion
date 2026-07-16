require("dotenv").config();

const questionModel = require(
  "../models/questionModel"
);
const {
  generateQuestionAnswers,
} = require(
  "../services/attachmentAnalysisService"
);
const pool = require("../config/db");

const BATCH_SIZE = 10;

async function backfillAiAnswers() {
  let totalUpdated = 0;

  try {
    while (true) {
      const questions =
        await questionModel
          .getQuestionsMissingAiAnswers(
            BATCH_SIZE
          );

      if (questions.length === 0) {
        break;
      }

      const answers =
        await generateQuestionAnswers(
          questions.map(
            (question) => question.text
          )
        );

      for (
        let index = 0;
        index < questions.length;
        index += 1
      ) {
        await questionModel.updateAiAnswer(
          questions[index].id,
          answers[index]
        );

        totalUpdated += 1;

        console.log(
          `Updated question ${questions[index].id}`
        );
      }
    }

    console.log(
      `PulseBot backfill complete. ${totalUpdated} questions updated.`
    );
  } catch (error) {
    console.error(
      "PulseBot backfill failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

backfillAiAnswers();