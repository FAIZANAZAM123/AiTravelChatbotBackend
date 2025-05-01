const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
// router.use(authMiddleware);

// Message routes
router.post('/', messageController.sendMessage);
router.post('/voice', messageController.handleVoiceMessage); // New route for voice messages
router.get('/:conversationId', messageController.getMessages);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;