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

const receivedResponses = [];

consumer.on('message', async function (message) {
  console.log('Received message');
  const response = JSON.parse(message.value);
  receivedResponses.push(response);
});

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


async function getAiResponseFromKafka(req, res) {
  try {
    const lastResponse = receivedResponses.length > 0 ? receivedResponses[receivedResponses.length - 1] : null;
    res.json({ aiResponse: lastResponse });
  } catch (error) {
    console.error('Error in getAiResponseFromKafka:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { frontEndchatBot, getAiResponseFromKafka };
 