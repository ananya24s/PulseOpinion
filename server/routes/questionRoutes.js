const questionUpload = require(
  "../middleware/questionUpload"
);
const express = require("express");
const router = express.Router();
const controller = require(
  "../controllers/questionController"
);
const {
  authenticate,
  optionalAuthenticate,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  optionalAuthenticate,
  controller.getQuestions
);

router.post(
  "/check-duplicates",
  optionalAuthenticate,
  controller.checkDuplicates
);

router.post(
  "/analyze-attachment",
  authenticate,
  questionUpload.single("attachment"),
  controller.analyzeAttachment
);

router.post(
  "/import",
  authenticate,
  controller.importQuestions
);

router.post(
  "/bulk-upload",
  authenticate,
  questionUpload.single("attachment"),
  controller.createQuestionsFromAttachment
);

router.post(
  "/",
  authenticate,
  questionUpload.single("attachment"),
  controller.createQuestion
);

router.patch(
  "/:id/like",
  authenticate,
  controller.likeQuestion
);

router.patch(
  "/:id/dislike",
  authenticate,
  controller.dislikeQuestion
);


router.post(
  "/:id/comments",
  authenticate,
  controller.addComment
);

router.post(
  "/:id/verify",
  authenticate,
  controller.verifyQuestion
);

router.delete(
  "/:id",
  authenticate,
  controller.deleteQuestion
);

module.exports = router;