const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
// router.use(authMiddleware);

// Conversation routes
router.post('/', conversationController.createConversation);
router.get('/user/:userId', conversationController.getUserConversations);
router.get('/:id', conversationController.getConversation);
router.put('/:id', conversationController.updateConversationTitle); // New route for updating title
router.delete('/:id', conversationController.deleteConversation);

module.exports = router;