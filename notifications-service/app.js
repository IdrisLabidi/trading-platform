// init express, socket.io, and kafka consumer
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { initConsumer } = require('./kafka/consumer');
const { setEmail, getUserEmail } = require('./notifications');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server);

// Make io globally available
global.io = io;

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Notifications Service');
});

// Set email route
app.post('/api/notifications/set-email', (req, res) => {
  const { userId, email } = req.body;
  if (!userId || !email) {
    return res.status(400).send('userId and email are required');
  }
  setEmail(userId, email);
  res.status(200).send('Email set successfully');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log("Notifications service listening on port ", PORT);
  
  // Initialize Kafka consumer
  try {
    await initConsumer();
    console.log('Kafka consumer initialized');
  } catch (error) {
    console.error('Failed to initialize Kafka consumer:', error);
  }
});

module.exports = server;
