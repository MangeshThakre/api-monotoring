import rabbitmq from "./rabbitmq.js";
import logger from "./logger.js";
import config from "./index.js";

/**
 * RabbitMQ connection setup
 */

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;
  }

  async connect() {
    if (this.channel) {
      return this.channel;
    }

    // Prevent multiple connections:
    // If already connecting, wait until it's done and reuse the same connection
    if (this.isConnecting) {
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      return this.channel;
    }

    try {
      this.isConnecting = true;

      logger.info("connecting to rabbitmq...", config.rabbitmq.url);
      this.connection = await rabbitmq.connect(config.rabbitmq.url); // connect to rabbitmq server
      this.channel = await this.connection.createChannel(); // create a channel

      // setup a dead-letter queue for failed messages
      const dlqName = `${config.rabbitmq.queue}_dlq`; // dead-letter queue key | queue name
      await this.channel.assertQueue(dlqName, { durable: true }); // create a dead-letter queue with the name `${queueName}_dlq`

      // configure the main queue to use the dead-letter queue for failed messages
      await this.channel.assertQueue(config.rabbitmq.queue, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": "",
          "x-dead-letter-routing-key": dlqName
        }
      });

      logger.info("rabbit mq connect to the queue", config.rabbitmq.queue);

      // handle connection close and errors
      this.connection.on("close", () => {
        logger.warn("rabbitmq connection closed");
        this.channel = null;
        this.connection = null;
      });

      // handle channel errors
      this.channel.on("error", (error) => {
        logger.error("rabbitmq channel error", error);
        this.channel = null;
        this.connection = null;
      });

      this.isConnecting = false;
      return this.channel;
    } catch (error) {
      logger.error("error connecting to rabbitmq", error);
      this.isConnecting = false;
      throw error;
    }
  }

  getChannel() {
    return this.channel;
  }

  getStatus() {
    if (!this.connect() || !this.channel) return "disconnected";
    if (!this.channel.closing) return "connected";
    return "connected";
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        logger.info("rabbitmq channel closed");
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        logger.info("rabbitmq connection closed");
        this.connection = null;
      }
    } catch (error) {
      logger.error("error closing rabbitmq connection", error);
    }
  }
}
