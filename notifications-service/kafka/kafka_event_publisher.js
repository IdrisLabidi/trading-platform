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

module.exports = router;
