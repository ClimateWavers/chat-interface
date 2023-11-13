const { KafkaClient, ConsumerGroup } = require('kafka-node');

const kafkaClient = new KafkaClient({
  kafkaHost: 'zkless-kafka-bootstrap:9092',
});

const consumerOptions = {
  kafkaHost: 'zkless-kafka-bootstrap:9092',
  groupId: 'group_1',
  autoCommit: true,
  autoCommitIntervalMs: 5000,
};

const consumer = new ConsumerGroup(consumerOptions, ['ai_responses']);

async function receiveAIResponse(userId) {
  return new Promise((resolve, reject) => {
    const aiResponsePayload = [
      {
        topic: 'ai_responses',
        offset: 0,
        partition: 0,
        maxNum: 1,
      },
    ];

    kafkaClient.loadMetadataForTopics(['ai_responses'], (error) => {
      if (error) {
        console.error('Error loading metadata for topics:', error.message);
        reject(error);
        return;
      }

      kafkaClient.fetchOffsets(aiResponsePayload, (error, data) => {
        if (error) {
          console.error('Error fetching offset for AI response:', error.message);
          reject(error);
        } else {
          const latestOffset = data['ai_responses'][0]['0'][0];
          const aiResponseOptions = {
            topic: 'ai_responses',
            partition: 0,
            offset: latestOffset,
            maxBytes: 1024 * 1024,
          };

          const aiResponseStream = kafkaClient.getOffsetStream(aiResponseOptions);
          const messages = [];

          aiResponseStream.on('data', (message) => {
            messages.push(message.value);
          });

          aiResponseStream.on('end', () => {
            const latestAIResponse = messages.length > 0 ? JSON.parse(messages[0]) : null;
            resolve(latestAIResponse);
          });

          aiResponseStream.on('error', (error) => {
            console.error('Error streaming AI response:', error.message);
            reject(error);
          });
        }
      });
    });
  });
}

async function receiveAIResponseHandler(req, res) {
  try {
    const { userId } = req.params;
    console.log(`Fetching AI response for User ID: ${userId}`);

    const latestAIResponse = await receiveAIResponse(userId);

    res.json({ success: true, latestAIResponse });
  } catch (error) {
    console.error('Error in receiveAIResponseHandler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = receiveAIResponseHandler;
