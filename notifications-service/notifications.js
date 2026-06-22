//Handle all notification logic (email + websocket)
const nodemailer = require('nodemailer');

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

// In-memory storage for user email addresses (in a real application, this would be a database)
const userEmails = new Map();

// Set user email
const setEmail = (userId, email) => {
  userEmails.set(userId, email);
};

// Get user email
const getUserEmail = (userId) => {
  return userEmails.get(userId);
};

// Notification sending function
const sendNotification = async (data) => {
  const { 
    type, 
    userId, 
    symbol, 
    quantity, 
    price, 
    filledQuantity, 
    remainingQuantity, 
    email: providedEmail,
    fromUserId,
    toUserId,
    reason,
    balance,
    currency,
    amount,
    alertPrice,
    alertType
  } = data;
  
  // Get email from provided data or from userEmails map
  const email = providedEmail || userEmails.get(userId);
  
  if (!email) {
    console.log('No email address found for user', userId);
    return;
  }

  let subject, text;

  switch (type) {
    case 'orderExecuted':
      subject = 'Order Executed';
      text = 'Your order for  has been executed. Quantity: , Price: ';
      break;
    case 'orderPartiallyExecuted':
      subject = 'Order Partially Executed';
      text = 'Your order for  has been partially executed. Filled: , Remaining: ';
      break;
    case 'orderRejected':
      subject = 'Order Rejected';
      text = 'Your order for  has been rejected. Quantity: , Price: ';
      break;
    case 'orderCancelled':
      subject = 'Order Cancelled';
      text = 'Your order for  has been cancelled. Quantity: , Price: ';
      break;
    case 'assetBought':
      subject = 'Asset Bought';
      text = 'You have successfully bought  shares of  at {price} per share.';
      break;
    case 'assetSold':
      subject = 'Asset Sold';
      text = 'You have successfully sold  shares of  at {price} per share.';
      break;
    case 'assetTransferred':
      subject = 'Asset Transferred';
      text = 'You have successfully transferred  shares of  from user  to user .';
      break;
    case 'assetTransferFailed':
      subject = 'Asset Transfer Failed';
      text = 'Your transfer of  shares of  failed. Reason: ';
      break;
    case 'portfolioBalanceUpdated':
      subject = 'Portfolio Balance Updated';
      text = 'Your portfolio balance has been updated to  .';
      break;
    case 'portfolioDepositConfirmed':
      subject = 'Deposit Confirmed';
      text = 'Your deposit of   has been confirmed.';
      break;
    case 'portfolioWithdrawalConfirmed':
      subject = 'Withdrawal Confirmed';
      text = 'Your withdrawal of   has been confirmed.';
      break;
    case 'portfolioAlertTriggered':
      subject = 'Portfolio Alert Triggered';
      text = 'Price alert triggered for . Current price: {price}. Alert price: {alertPrice}. Alert type: ';
      break;
    default:
      console.log('Unknown notification type:', type);
      return;
  }

  // Emit WebSocket event
  if (global.io) {
    global.io.emit(type, data);
  }

  // Send email
  const mailOptions = {
    from: 'notifications@example.com',
    to: email,
    subject: subject,
    text: text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendNotification,
  setEmail,
  getUserEmail
};
