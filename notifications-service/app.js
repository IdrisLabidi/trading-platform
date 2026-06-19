const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Email transporter setup
let transporter;
if (process.env.NODE_ENV === 'production') {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'user@example.com',
      pass: 'password'
    }
  });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  // Handle order executed event
  socket.on('orderExecuted', (data) => {
    io.emit('orderExecuted', data);
    sendEmail(data, 'Order Executed', `Your order for ${data.symbol} has been executed.`);
  });

  // Handle order partially executed event
  socket.on('orderPartiallyExecuted', (data) => {
    io.emit('orderPartiallyExecuted', data);
    sendEmail(data, 'Order Partially Executed', `Your order for ${data.symbol} has been partially executed.`);
  });

  // Handle order rejected event
  socket.on('orderRejected', (data) => {
    io.emit('orderRejected', data);
    sendEmail(data, 'Order Rejected', `Your order for ${data.symbol} has been rejected.`);
  });

  // Handle order cancelled event
  socket.on('orderCancelled', (data) => {
    io.emit('orderCancelled', data);
    sendEmail(data, 'Order Cancelled', `Your order for ${data.symbol} has been cancelled.`);
  });

  // Handle deposit confirmed event
  socket.on('depositConfirmed', (data) => {
    io.emit('depositConfirmed', data);
    sendEmail(data, 'Deposit Confirmed', `Your deposit of ${data.amount} has been confirmed.`);
  });

  // Handle withdrawal confirmed event
  socket.on('withdrawalConfirmed', (data) => {
    io.emit('withdrawalConfirmed', data);
    sendEmail(data, 'Withdrawal Confirmed', `Your withdrawal of ${data.amount} has been confirmed.`);
  });

  // Handle price alert triggered event
  socket.on('priceAlertTriggered', (data) => {
    io.emit('priceAlertTriggered', data);
    sendEmail(data, 'Price Alert Triggered', `The price for ${data.symbol} has reached your alert level.`);
  });

  // Handle new account connection event
  socket.on('newAccountConnection', (data) => {
    io.emit('newAccountConnection', data);
    sendEmail(data, 'New Account Connection', `A new account has been connected.`);
  });

  // Handle password reset event
  socket.on('passwordReset', (data) => {
    io.emit('passwordReset', data);
    sendEmail(data, 'Password Reset', `Your password has been successfully reset.`);
  });
});

// Email sending function
function sendEmail(data, subject, text) {
  if (!data.email) return; // Skip email if no email is provided

  const mailOptions = {
    from: 'notifications@example.com',
    to: data.email,
    subject: subject,
    text: text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return;
    }
    console.log('Email sent: %s', info.response);
  });
}

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Notifications Service');
});

module.exports = server;
