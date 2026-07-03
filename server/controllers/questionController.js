const questionModel = require('../models/questionModel');

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

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question text is required.",
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

    const question = await questionModel.createQuestion({text,category,userId: req.user.id,});
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create question.' });
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

module.exports = {
  getQuestions,
  createQuestion,
  likeQuestion,
  dislikeQuestion,
  addComment,
};
