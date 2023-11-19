const { KafkaClient, ConsumerGroup } = require('kafka-node');
const { EventEmitter } = require('events');

const kafkaClient = new KafkaClient({
  kafkaHost: `${process.env.KAFKA_HOST}:9092`,
});

const consumerOptions = {
  kafkaHost: `${process.env.KAFKA_HOST}:9092`,
  groupId: 'group_1',
  autoCommit: true,
  autoCommitIntervalMs: 5000,
};

const consumer = new ConsumerGroup(consumerOptions, ['ai_responses']);

const aiResponseEmitter = new EventEmitter();

// Subscribe to the AI response event outside the request handler
consumer.on('message', (message) => {
  // Emit the AI response event when a message is received
  const parsedMessage = JSON.parse(message.value);
  aiResponseEmitter.emit('aiResponse', parsedMessage);
});

consumer.on('error', (error) => {
  console.error('Error in Kafka Consumer:', error);
});

async function receiveAIResponseHandler(req, res) {
  try {
    const { userId } = req.params;

    // Create a timeout for the listener
    const timeoutId = setTimeout(() => {
      // Unsubscribe from the event and return an error if the timeout is reached
      aiResponseEmitter.removeListener('aiResponse', aiResponseListener);
      return res.status(500).json({ error: 'Timeout: No AI response received within the expected time' });
    }, 60000); // 60 seconds timeout (adjust as needed)

    // Subscribe to the AI response event
    const aiResponseListener = (aiResponse) => {
      if (aiResponse.userId === userId) {
        // Clear the timeout
        clearTimeout(timeoutId);

        // Unsubscribe from the event after receiving the expected response
        aiResponseEmitter.removeListener('aiResponse', aiResponseListener);

        // Return the response as JSON
        return res.json({ success: true, latestAIResponse: aiResponse });
      }
    };

    // Log the initiation of the listener
    console.log(`Listening for AI response for User ID: ${userId}`);

    // Listen for the AI response event
    aiResponseEmitter.on('aiResponse', aiResponseListener);

  } catch (error) {
    console.error('Error in receiveAIResponseHandler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = receiveAIResponseHandler;
