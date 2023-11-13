const kafka = require('kafka-node');

const kafkaClient = new kafka.KafkaClient({
  kafkaHost: 'zkless-kafka-bootstrap:9092',
});

const kafkaProducer = new kafka.Producer(kafkaClient);

kafkaProducer.on('ready', () => {
  console.log('Kafka Producer is ready');
});

kafkaProducer.on('error', (error) => {
  console.error('Error in Kafka Producer:', error);
});

const consumerOptions = {
  kafkaHost: 'zkless-kafka-bootstrap:9092',
  groupId: 'group_1',
  autoCommit: true,
  autoCommitIntervalMs: 5000,
};

const consumer = new kafka.ConsumerGroup(consumerOptions, ['ai_response']);

console.log('Kafka consumer is listening for messages...');

consumer.on('error', async function (err) {
  console.error('Error:', err);
});

consumer.on('offsetOutOfRange', async function (err) {
  console.error('Offset out of range:', err);
});

process.on('SIGINT', async function () {
  await closeConsumer();
  process.exit();
});

function closeConsumer() {
  return new Promise((resolve) => {
    consumer.close(true, resolve);
  });
}

function sendMessageToKafka(topic, payload) {
  const userMessagePayload = [
    {
      topic,
      messages: JSON.stringify(payload),
    },
  ];

  return new Promise((resolve, reject) => {
    kafkaProducer.send(userMessagePayload, (error, data) => {
      if (error) {
        console.error(`Error publishing message to Kafka topic ${topic}:`, error);
        reject(error);
      } else {
        console.log(`Message successfully published to Kafka topic ${topic}:`, data);
        resolve(data);
      }
    });
  });
}

async function frontEndchatBot(req, res) {
  try {
    const { message, userId, userLocation } = req.body;

    // Assuming sendMessageToKafka returns a promise
    await sendMessageToKafka('user_messages', { userId, message, userLocation });

    res.json({ success: true, message: 'Message sent from user to Kafka' });
  } catch (error) {
    console.error('Error in frontEndchatBot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
const receivedResponses = []; // Define an array to store AI responses

async function getAiResponseFromKafka(req, res) {
  try {
    // Pause the consumer to prevent further messages while fetching the latest
    consumer.pause();

    // Consume the latest message directly from Kafka using the existing consumer
    const latestResponse = await consumeLatestMessageFromKafka('ai_response');

    // Store the response in the array
    receivedResponses.push(latestResponse);

    // Keep only the latest 10 responses (you can adjust this based on your needs)
    if (receivedResponses.length > 10) {
      receivedResponses.shift(); // Remove the oldest response
    }

    // Resume the consumer after fetching the latest message
    consumer.resume();

    res.json({ aiResponse: latestResponse });
  } catch (error) {
    console.error('Error in getAiResponseFromKafka:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Modify the consumeLatestMessageFromKafka function to resolve with the receivedResponses array
function consumeLatestMessageFromKafka(topic) {
  return new Promise((resolve, reject) => {
    const tempConsumer = new kafka.ConsumerGroup(consumerOptions, [topic]);

    tempConsumer.on('message', (message) => {
      const response = JSON.parse(message.value);
      tempConsumer.close(true, () => resolve(response));
    });

    tempConsumer.on('error', (err) => {
      tempConsumer.close(true, () => reject(err));
    });
  });
}module.exports = { frontEndchatBot, getAiResponseFromKafka };
