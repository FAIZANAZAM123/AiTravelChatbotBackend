const express = require('express');
const http = require('http');
const sequelize = require('./config/config');
const userRoutes = require('./routes/authRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const cors = require("cors");
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(path.join(__dirname, 'uploads'));
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

// Sync the database and start the server
sequelize.sync({ alter: false }).then(() => {
  server.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
  });
});