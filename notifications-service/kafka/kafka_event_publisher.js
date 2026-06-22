// validate requests + publish events ('notif sent' event) to kafka
const express = require('express');
const { Kafka } = require('kafkajs');
const router = express.Router();

const kafka = new Kafka({
  clientId: 'notifications-service-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

// Initialize producer
const initProducer = async () => {
  await producer.connect();
};

// Ensure producer is initialized
let producerInitialized = false;
const ensureProducerInitialized = async () => {
  if (!producerInitialized) {
    await initProducer();
    producerInitialized = true;
  }
};

// Order executed notification
router.post('/order-executed', async (req, res) => {
  const { userId, symbol, quantity, price } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'orderExecuted',
      userId,
      symbol,
      quantity,
      price
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Order executed notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Order partially executed notification
router.post('/order-partially-executed', async (req, res) => {
  const { userId, symbol, filledQuantity, remainingQuantity } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'orderPartiallyExecuted',
      userId,
      symbol,
      filledQuantity,
      remainingQuantity
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Order partially executed notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Order rejected notification
router.post('/order-rejected', async (req, res) => {
  const { userId, symbol, quantity, price } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'orderRejected',
      userId,
      symbol,
      quantity,
      price
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Order rejected notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Order cancelled notification
router.post('/order-cancelled', async (req, res) => {
  const { userId, symbol, quantity, price } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'orderCancelled',
      userId,
      symbol,
      quantity,
      price
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Order cancelled notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Asset bought notification
router.post('/asset-bought', async (req, res) => {
  const { userId, symbol, quantity, price } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'assetBought',
      userId,
      symbol,
      quantity,
      price
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Asset bought notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Asset sold notification
router.post('/asset-sold', async (req, res) => {
  const { userId, symbol, quantity, price } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'assetSold',
      userId,
      symbol,
      quantity,
      price
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Asset sold notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Asset transferred notification
router.post('/asset-transferred', async (req, res) => {
  const { userId, symbol, quantity, fromUserId, toUserId } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'assetTransferred',
      userId,
      symbol,
      quantity,
      fromUserId,
      toUserId
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Asset transferred notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Asset transfer failed notification
router.post('/asset-transfer-failed', async (req, res) => {
  const { userId, symbol, quantity, reason } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'assetTransferFailed',
      userId,
      symbol,
      quantity,
      reason
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Asset transfer failed notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Portfolio balance updated notification
router.post('/portfolio-balance-updated', async (req, res) => {
  const { userId, balance, currency } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'portfolioBalanceUpdated',
      userId,
      balance,
      currency
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Portfolio balance updated notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Portfolio deposit confirmed notification
router.post('/portfolio-deposit-confirmed', async (req, res) => {
  const { userId, amount, currency } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'portfolioDepositConfirmed',
      userId,
      amount,
      currency
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Portfolio deposit confirmed notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Portfolio withdrawal confirmed notification
router.post('/portfolio-withdrawal-confirmed', async (req, res) => {
  const { userId, amount, currency } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'portfolioWithdrawalConfirmed',
      userId,
      amount,
      currency
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Portfolio withdrawal confirmed notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Portfolio alert triggered notification
router.post('/portfolio-alert-triggered', async (req, res) => {
  const { userId, symbol, price, alertPrice, alertType } = req.body;
  
  try {
    await ensureProducerInitialized();
    
    const notification = {
      type: 'portfolioAlertTriggered',
      userId,
      symbol,
      price,
      alertPrice,
      alertType
    };
    
    await producer.send({
      topic: 'notifications',
      messages: [{ value: JSON.stringify(notification) }]
    });
    
    res.status(200).send('Portfolio alert triggered notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
