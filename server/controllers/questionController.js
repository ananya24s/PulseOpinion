const fs = require("fs/promises");
const {analyzeAttachment: analyzeAttachmentWithAI,} = require("../services/attachmentAnalysisService");
const questionModel = require('../models/questionModel');
async function removeUploadedFile(file) {
  if (!file?.path) {
    return;
  }

  try {
    await fs.unlink(file.path);
  } catch (error) {
    console.error(
      "Failed to clean up uploaded file:",
      error
    );
  }
}
async function getQuestions(req, res) {
  try {
    const questions = await questionModel.getAllQuestions(req.user?.id);
    res.status(200).json({ success: true, data: questions });
  } catch(err){
   console.error(err);
   res.status(500).json({success: false,message: "Failed to fetch questions." });
  }
}

async function createQuestion(req, res) {
  try {
    const { text, category } = req.body;
    const trimmedText = text?.trim();

    if (!trimmedText) {
      await removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message: "Question text is required.",
      });
    }

    if (trimmedText.length < 10) {
      await removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message:
          "Question text must be at least 10 characters.",
      });
    }

    if (trimmedText.length > 250) {
      await removeUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        message:
          "Question text must be 250 characters or fewer.",
      });
    }

    const attachment = req.file
      ? {
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          filePath: `uploads/questions/${req.file.filename}`,
        }
      : null;

    const question =
      await questionModel.createQuestion({
        text: trimmedText,
        category,
        userId: req.user.id,
        attachment,
      });

    return res.status(201).json({
      success: true,
      data: question,
    });
  } catch (err) {
    await removeUploadedFile(req.file);

    console.error("Create question error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create question.",
    });
  }
}

async function likeQuestion(req, res) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID.' });
    }

    const question = await questionModel.likeQuestion(id, req.user.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.status(200).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to like question.' });
  }
}

async function dislikeQuestion(req, res) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID.' });
    }

    const question = await questionModel.dislikeQuestion(id, req.user.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.status(200).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to dislike question.' });
  }
}
async function addComment(req, res) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID.' });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required.',
      });
    }
    const question = await questionModel.addComment(id, {text,userId: req.user.id,});
    

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
}
async function deleteQuestion(req, res) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID.',
      });
    }

    const result = await questionModel.deleteQuestion(
      id,
      req.user.id
    );

    if (result === 'not_found') {
      return res.status(404).json({
        success: false,
        message: 'Question not found.',
      });
    }

    if (result === 'forbidden') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own questions.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Question deleted successfully.',
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete question.',
    });
  }
}
async function analyzeAttachment(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Attachment is required.",
    });
  }

  try {
    const extractedText =
      await analyzeAttachmentWithAI(req.file);

    await removeUploadedFile(req.file);

    return res.status(200).json({
      success: true,
      data: {
        extractedText,
      },
    });
  } catch (error) {
    await removeUploadedFile(req.file);

    console.error(
      "Attachment analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Could not analyze attachment.",
    });
  }
}
module.exports = {
  getQuestions,
  createQuestion,
  analyzeAttachment,
  likeQuestion,
  dislikeQuestion,
  addComment,
  deleteQuestion,
};