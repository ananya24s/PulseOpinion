// routes/questionRoutes.js
//
// Responsibility: declare which HTTP method + URL maps to which controller.
// No logic lives here — routes are just a routing table.

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/questionController');

// GET  /api/questions             — fetch all questions
router.get('/', controller.getQuestions);

// POST /api/questions             — create a new question
router.post('/', controller.createQuestion);

// PATCH /api/questions/:id/like   — increment likes
router.patch('/:id/like', controller.likeQuestion);

// PATCH /api/questions/:id/dislike — increment dislikes
router.patch('/:id/dislike', controller.dislikeQuestion);

// POST /api/questions/:id/comments — add a comment to a question
router.post('/:id/comments', controller.addComment);

module.exports = router;
