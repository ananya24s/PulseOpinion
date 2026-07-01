// controllers/questionController.js
//
// Responsibility: handle HTTP request/response for each endpoint.
// Validates input, calls the model, and sends back the right status + JSON.
// No raw data manipulation happens here — that's the model's job.

const questionModel = require('../models/questionModel');

// ── GET /api/questions ────────────────────────────────────────────────────────
// Returns every question, newest first.
async function getQuestions(req, res) {
  try {
    const questions = await questionModel.getAllQuestions();
    res.status(200).json({ success: true, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch questions.' });
  }
}

// ── POST /api/questions ───────────────────────────────────────────────────────
// Creates a new question.
// Body: { text: string, category?: string }
async function createQuestion(req, res) {
  try {
    const { text, category } = req.body;

    // Validation — text is required and must not be blank
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question text is required.',
      });
    }

    if (text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Question text must be at least 10 characters.',
      });
    }

    if (text.trim().length > 250) {
      return res.status(400).json({
        success: false,
        message: 'Question text must be 250 characters or fewer.',
      });
    }

    const question = await questionModel.createQuestion({ text, category });
    // 201 Created — the standard status for a successfully created resource
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create question.' });
  }
}

// ── PATCH /api/questions/:id/like ─────────────────────────────────────────────
// Increments the like count by 1.
async function likeQuestion(req, res) {
  try {
    // req.params.id comes in as a string — convert to number for array lookup
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID.' });
    }

    const question = await questionModel.likeQuestion(id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.status(200).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to like question.' });
  }
}

// ── PATCH /api/questions/:id/dislike ──────────────────────────────────────────
// Increments the dislike count by 1.
async function dislikeQuestion(req, res) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID.' });
    }

    const question = await questionModel.dislikeQuestion(id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.status(200).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to dislike question.' });
  }
}

// ── POST /api/questions/:id/comments ──────────────────────────────────────────
// Appends a comment to a question.
// Body: { text: string }
async function addComment(req, res) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid question ID.' });
    }

    const { text } = req.body;

    // Validation — comment text is required
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required.',
      });
    }

    const question = await questionModel.addComment(id, { text });

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
}

module.exports = {
  getQuestions,
  createQuestion,
  likeQuestion,
  dislikeQuestion,
  addComment,
};
