const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/config');
const userRoutes = require('./routes/authRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const cors = require("cors");
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your frontend URL
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(path.join(__dirname, 'uploads'));

app.use(express.json());
app.use(cors());

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });
  
  // Leave a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User ${socket.id} left conversation: ${conversationId}`);
  });
  
  // Handle new message
  socket.on('send_message', (messageData) => {
    // Broadcast message to all users in the conversation
    socket.to(messageData.conversationId).emit('receive_message', messageData);
  });
  
  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Add Socket.io instance to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

// 🚩 ✅ Use dynamic port for Railway or other cloud platforms
const PORT = process.env.PORT || 5000;

// Sync the database and start the server
sequelize.sync({ alter: false }).then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Socket.io server is running');
  });
});
