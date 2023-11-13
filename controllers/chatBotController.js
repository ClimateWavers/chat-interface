
const kafka = require('kafka-node');
require('dotenv').config();

// Set up Kafka Producer and handle its events
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

// Configuration for Kafka Consumer
const consumerOptions = {
  kafkaHost: 'zkless-kafka-bootstrap:9092',
  groupId: 'group_1',
  autoCommit: true,
  autoCommitIntervalMs: 5000,
};

const consumer = new kafka.ConsumerGroup(consumerOptions, ['ai_response']);

console.log('Kafka consumer is listening for messages...');

const receivedResponses = [];

// Event listener for incoming messages from Kafka
consumer.on('message', function (message) {
  console.log('Received message');
  const response = JSON.parse(message.value);
  receivedResponses.push(response);
});

// Event listener for Kafka consumer errors
consumer.on('error', function (err) {
  console.error('Error:', err);
});

// Event listener for Kafka consumer's offset out of range error
consumer.on('offsetOutOfRange', function (err) {
  console.error('Offset out of range:', err);
});

// Handle interrupt signal and close consumer
process.on('SIGINT', function () {
  consumer.close(true, function () {
    process.exit();
  });
});

// Function to send AI response to Kafka
function sendMessageToKafka(topic, payload) {
  const userMessagePayload = [
    {
      topic,
      messages: JSON.stringify(payload),
    },
  ];

  kafkaProducer.send(userMessagePayload, (error, data) => {
    if (error) {
      console.error(`Error publishing message to Kafka topic ${topic}:`, error);
    } else {
      console.log(`Message successfully published to Kafka topic ${topic}:`, data);
    }
  });
}

// Frontend ChatBot function
async function frontEndchatBot(req, res) {
  try {
    const { message, userId } = req.body;

    // Send user response to Kafka
    sendMessageToKafka('user_messages', { userId, message });

    res.json({ success: true, message: 'Message sent from user to Kafka' });
  } catch (error) {
    console.error('Error in frontEndchatBot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAiResponseFromKafka(req, res) {
  try {
    const lastResponse = receivedResponses.length > 0 ? receivedResponses[receivedResponses.length - 1] : null;
    res.json({ aiResponse: lastResponse });
  } catch (error) {
    console.error('Error in getAiResponseFromKafka:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ... (remaining code)

module.exports = { frontEndchatBot, getAiResponseFromKafka };