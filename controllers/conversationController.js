const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create a new conversation
exports.createConversation = async (req, res) => {
  try {
    const { userId: customUserId, title } = req.body;
    
    // Check if user exists using custom userId
    const user = await User.findOne({ where: { userId: customUserId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const conversation = await Conversation.create({
      userId: user.userId,
      title: title || 'New Conversation'
    });
    
    // Emit socket event for new conversation
    if (req.io) {
      req.io.emit('new_conversation', {
        ...conversation.toJSON(),
        isNew: true
      });
    }
    
    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Error creating conversation', error: error.message });
  }
};


// Get all conversations for a user
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversations = await Conversation.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// Get a single conversation with messages
exports.getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await Conversation.findByPk(id, {
      include: [
        {
          model: Message,
          order: [['timestamp', 'ASC']]
        }
      ]
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Error fetching conversation', error: error.message });
  }
};

// Update conversation title
exports.updateConversationTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    conversation.title = title;
    await conversation.save();
    
    // Emit socket event for updated conversation
    if (req.io) {
      req.io.emit('conversation_updated', {
        ...conversation.toJSON()
      });
    }
    
    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ message: 'Error updating conversation', error: error.message });
  }
};

// Delete a conversation
exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Delete associated messages first
    await Message.destroy({ where: { conversationId: id } });
    
    // Delete the conversation
    await conversation.destroy();
    
    // Emit socket event for deleted conversation
    if (req.io) {
      req.io.emit('conversation_deleted', { id });
    }
    
    res.status(200).json({
      success: true,
      message: 'Conversation and associated messages deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Error deleting conversation', error: error.message });
  }
};