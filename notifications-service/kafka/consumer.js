//consume events from 'notifications' topic
const { Kafka } = require('kafkajs');
const { sendNotification } = require('../notifications');

const kafka = new Kafka({
  clientId: 'notifications-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'notifications-group' });

const initConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'notifications', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const notification = JSON.parse(message.value.toString());
        await sendNotification(notification);
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    },
  });
};

module.exports = { initConsumer };
