const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/questionController');
const { authenticate, optionalAuthenticate,} = require('../middleware/authmiddleware');
//fetching all questions
router.get('/', optionalAuthenticate,controller.getQuestions);
router.post("/", authenticate, controller.createQuestion);
router.patch('/:id/like', authenticate, controller.likeQuestion);
router.patch('/:id/dislike', authenticate, controller.dislikeQuestion);
router.post('/:id/comments', authenticate, controller.addComment);
router.delete('/:id', authenticate, controller.deleteQuestion);
module.exports = router;
