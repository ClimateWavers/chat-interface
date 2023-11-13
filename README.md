# Chat Interface Microservice

## Overview

The Chat Interface Microservice in the ClimateWavers application serves as the communication bridge between the frontend and Kafka. It provides APIs that the frontend can call to interact with the Kafka messaging system.

## Technologies Used

- Node.js: The server-side runtime for running JavaScript code.
- Express.js: A web application framework for Node.js used to build robust APIs.
- Kafka: A distributed event streaming platform for handling real-time data feeds.

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/climatewavers-chat-interface.git
   ```

2. Install dependencies:

   ```bash
   cd climatewavers-chat-interface
   npm install
   ```

3. Set up environment variables:

   Create a `.env` file and configure the following variables:

   ```env
   KAFKA_BROKER_URL=your_kafka_broker_url
   KAFKA_TOPIC=your_kafka_topic
   ```

## Usage

1. Start the server:

   ```bash
   npm start
   ```

   The server will be running on the specified port (default is 3000).

2. Frontend Integration:

   Integrate the provided APIs into your frontend application to enable real-time messaging using Kafka.

## API Endpoints

### 1. Produce Message

- **Endpoint**: `/produce-message`
- **Method**: POST
- **Description**: Produces a message to the Kafka topic.
- **Request Body**:

  ```json
  {
    "message": "Your message content"
  }
  ```

### 2. Consume Messages

- **Endpoint**: `/consume-messages`
- **Method**: GET
- **Description**: Consumes messages from the Kafka topic.
- **Response**:

  ```json
  {
    "messages": ["Message 1", "Message 2", ...]
  }
  ```

## License

This project is licensed under the [MIT License](LICENSE).

Feel free to reach out to [maintainer_email@example.com] with any questions or concerns. Happy coding!
