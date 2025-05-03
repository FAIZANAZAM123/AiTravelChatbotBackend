const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { OpenAI } = require('openai');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for audio files
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = './uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, `voice-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Setup upload with file type filter
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only audio files are allowed'));
    }
    cb(null, true);
  }
}).single('audio');

// Initialize OpenAI client - use environment variable instead of hardcoding
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// Send a message and get AI response
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    
    // Validate input
    if (!conversationId || !content) {
      return res.status(400).json({ message: 'Conversation ID and content are required' });
    }
    
    // Check if conversation exists
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Save user message
    const userMessage = await Message.create({
      conversationId,
      content,
      role: 'user',
      timestamp: new Date()
    });
    
 
    
    // Get previous messages for context
    const previousMessages = await Message.findAll({
      where: { conversationId },
      order: [['timestamp', 'ASC']]
    });
    
    // Format messages for OpenAI
    const messages = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 1000
    });
    
    const aiResponse = completion.choices[0].message.content;

    console.log(aiResponse,"aiResponse")
    
    // Save AI response
    const assistantMessage = await Message.create({
      conversationId,
      content: aiResponse,
      role: 'assistant',
      timestamp: new Date()
    });
    

    
    res.status(200).json({
      success: true,
      userMessage,
      assistantMessage
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};


exports.handleVoiceMessage = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(400).json({ message: 'Error uploading file', error: err.message });
    }
    
    try {
      const { conversationId } = req.body;
      
      if (!conversationId) {
        return res.status(400).json({ message: 'Conversation ID is required' });
      }
      
      // Check if conversation exists
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file provided' });
      }
     
      // Get the file path
      const audioFilePath = req.file.path;
      
      // Use OpenAI's Whisper API to transcribe the audio file
      let transcribedText;
      try {
        // Read the file as a buffer
        const audioBuffer = fs.readFileSync(audioFilePath);
        
        // Create a form for the OpenAI API
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(audioFilePath),
          model: "whisper-1",
          language: "en", // You can make this dynamic based on user preference
          response_format: "text"
        });
        
        transcribedText = transcription;
        
      
      } catch (transcriptionError) {
        console.error('Error transcribing audio:', transcriptionError);
        transcribedText = "Sorry, I couldn't transcribe your voice message. Please try again.";
      }
      
      // Save user message with the transcribed text
      const userMessage = await Message.create({
        conversationId,
        content: transcribedText,
        role: 'user',
        timestamp: new Date(),
        isVoiceMessage: true,
        audioFilePath: audioFilePath
      });
      
    
      
      // Get previous messages for context
      const previousMessages = await Message.findAll({
        where: { conversationId },
        order: [['timestamp', 'ASC']]
      });
      
      // Format messages for OpenAI
      const messages = previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Get response from OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: messages,
        max_tokens: 1000
      });
      
      const aiResponse = completion.choices[0].message.content;
      
      // Save AI response
      const assistantMessage = await Message.create({
        conversationId,
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date()
      });
      
     
      res.status(200).json({
        success: true,
        transcribedText,
        userMessage,
        assistantMessage
      });
      
    } catch (error) {
      console.error('Error processing voice message:', error);
      
    
      
      res.status(500).json({ message: 'Error processing voice message', error: error.message });
    }
  });
};


// Get all messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await Message.findAll({
      where: { conversationId },
      order: [['timestamp', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findByPk(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    const conversationId = message.conversationId;
    
    await message.destroy();
    
 
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};