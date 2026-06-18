import { z } from "zod";
import rabbitmq from "../../shared/config/rabbitmq.js";
import postgres from "../../shared/config/postgres.js";
import mongodb from "../../shared/config/mongoDb.js";
import logger from "../../shared/config/logger.js";
import config from "../../shared/config/index.js";
import {
  RetryStrategy,
  isRetryable
} from "../../shared/events/producer/RetryStrategy.js";
import { CircuitBreaker } from "../../shared/events/producer/CircuitBreaker.js";
import { EVENTS_TYPES } from "../../shared/events/eventContracts.js";
import processorContainer from "./dependencies/Dependencies.js";

const messageSchema = z.object({
  type: z.enum([EVENTS_TYPES.API_HIT]),
  data: z.record(z.string(), z.unknown()),
  messageId: z.string().optional(),
  timestamp: z.union([z.string(), z.number()]).optional()
});

class EventConsumer {
  constructor( {
    processorService,
    rabbitmq ,
    postgres,
    mongodb,
    config,
    logger,
    retryStrategy,
    isRetryable,
    circuitBreaker
  }: any) {
    this._processorService = processorService;
    this._rabbitmq = rabbitmq;
    this._postgres = postgres;
    this._mongodb = mongodb;
    this._config = config;
    this._logger = logger;
    this._retryStrategy = retryStrategy;
    this._isRetryable = isRetryable;
    this._circuitBreaker = circuitBreaker;

    this._isRunning = false;
    this.channel = null;
    this._stats = {
      processed: 0,
      failed: 0,
      retried: 0,
      dlqRouted: 0,
      lastProcessedAt: null
    };
    this._processedIds = new Set();
    this._poisonMessage = new Map();
  }

  async _connectDataBase() {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        this._logger.info("connecting to database...");
        await Promise.all([
          this._mongodb.connect(),
          this._postgres.testConnection()
        ]);
        this._logger.info("database connected successfully");
        return; // ✅ stop loop after success
      } catch (error) {
        retries++;
        logger.error(
          `dataBase connection attempt ${retries} failed: consumer.js`,
          error
        );
        if (retries >= maxRetries) {
          throw new Error(
            `failed to connect to database after ${maxRetries} attempts`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 5000 * retries));
      }
    }
  }

  async _reconnect() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      this.channel = await this._rabbitmq.connect();

      const prefetch = this._config?.consumer?.prefetch ?? 10;
      this.channel.prefetch(prefetch);

      this.channel.on("error", (error) => {
        this._logger.error("consumer channel error", error);
        this._circuitBreaker.onFailure();
      });

      this.channel.on("close", () => {
        this._logger.warn("consumer channel closed unexpectedly");
        if (this._isRunning) this._reconnect();
      });

      this.channel.consume(
        this._rabbitmq.queue,
        async (msg) => {
          if (msg !== null) {
            await this._handleMessage(msg);
          }
        },
        { noAck: false, consumerTag: `consumer-${Date.now()}` }
      );
    } catch (error) {
      this._logger.error("error during reconnecting RabbitMq: consumer.js");
      if (this._isRunning) {
        setTimeout(() => this._reconnect(), 10000);
      }
    }
  }

  async _cleanUp() {
    try {
      this._isRunning = false;
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
    } catch (error) {
      this._logger.error("error during cleanUp: consumer.js");
    }
  }

  async _parseMessage(msg) {
    try {
      const content = msg.content.toString();
      const messageData = JSON.parse(content);

      const parsed = messageSchema.safeParse(messageData); // zod validator

      if (!parsed.success) {
        throw new Error(
          `schema validation failed : ${parsed.error.issues.map((i) => i.message).join(", ")}`
        );
      }

      return {
        ...parsed.data,
        messageId:
          msg.properties.messageId || messageData.messageId || "unknown",
        retryCount: parseInt(msg.properties.headers?.[`x-retry-count`] || 0)
      };
    } catch (error) {
      throw new Error(`message parser failed :${error.message}`);
    }
  }

  async _processMessage(messageData) {
    switch (messageData.type) {
      case EVENTS_TYPES.API_HIT:
        await this._processorService.processEvent(messageData.data);
        break;
      default:
        throw new Error(`unknown event type : ${messageData.type}`);
    }
  }

  async _retryMessage(msg, retryCount) {
    const delay = this._retryStrategy.delay(retryCount);
    const retryHeaders = {
      ...msg.properties.headers,
      "x-retry-count": retryCount + 1,
      "x-retry-timestamp": Date.now(),
      "x-retry-delay": delay,
      "x-original-queue": this._config.rabbitmq.queue
    };

    setTimeout(() => {
      try {
        this.channel.sendToQueue(this._config.rabbitmq.queue, msg.content, {
          ...msg.properties,
          headers: retryHeaders
        });
      } catch (error) {
        this._logger.error("failed to schedule retry:", error);
        this._sendToDLQ(msg, error, "RETRY_FAILED");
      }
    }, delay);
    this.channel.ack(msg);
    this._stats.retried++;
  }

  async _handleProcessingError(error, msg, messageData, startTime) {
    const messageId =
      messageData.messageId || messageData.properties?.messageId || "unknown";
    const retryCount = messageData?.retryCount || 0;
    this._circuitBreaker.onFailure();
    this._stats.failed++;

    const eventType = messageData?.type || "unknown";
    const poisonCount = (this._poisonMessage.get(eventType) || 0) + 1;

    this._poisonMessage.set(eventType, poisonCount);

    if (poisonCount >= 10) {
      this._logger.error("poison message pattern detected", {
        eventType,
        consecutiveFailure: poisonCount
      });
    }

    //non retryable message go straight into DLQ
    if (
      !this._isRetryable(error) ||
      !this._retryStrategy.shouldRetry(retryCount)
    ) {
      await this._sendToDLQ(
        msg,
        error,
        retryCount >= this._retryStrategy.maxRetries
          ? "MAX_RETRIES_EXCEEDED"
          : "NON_RETRYABLE"
      );
      return;
    }
    await this._retryMessage(msg, retryCount);
  }

  async _sendToDLQ(msg, error, reason) {
    try {
      const dlqName = `${this._config.rabbitmq.queue}_dlq`;
      this.channel.sendToQueue(dlqName, msg.content, {
        ...msg.properties,
        persistent: true,
        headers: {
          ...msg.properties.headers,
          "x-dlq-reason": reason,
          "x-dlq-error": error.message,
          "x-dlq-timestamp": Date.now(),
          "x-dlq-queue": this._config.rabbitmq.queue
        }
      });
      this.channel.ack(msg);
      this._stats.dlqRouted++;
    } catch (error) {
      this._logger.error(`failed to send message to dlq : ${error}`);
      this.channel.nack(msg, false, false);
    }
  }

  async _handleMessage(msg) {
    let messageData = null;
    if (!this._circuitBreaker.allowRequest()) {
      this._logger.warn("Circuit Breaker is open ,  requeueing Message");
      this.channel.nack(msg, false, false);
      return;
    }
    const startTime = Date.now();

    try {
      messageData = await this._parseMessage(msg);
      // idempotency
      if (this._processedIds.has(messageData.messageId)) {
        this._logger.debug("duplicate message skipped", {
          messageId: messageData.messageId
        });
        this.channel.ack(msg);
        return;
      }
      await this._processMessage(messageData);
      this.channel.ack(msg);
      this._circuitBreaker.onSuccess();
      this._stats.processed++;
      this._stats.lastProcessedAt = new Date();
      this._processedIds.add(messageData.messageId);
      if (this._processedIds.size > 100_00) {
        const first = this._processedIds.values().next().value;
        this._processedIds.delete(first);
      }
      this._poisonMessage.delete(messageData.type);
    } catch (error) {
      console.log(error);
      await this._handleProcessingError(error, msg, messageData, startTime);
    }
  }

  async start() {
    await this._connectDataBase();

    this.channel = await this._rabbitmq.connect();

    const prefetch = this._config?.consumer?.prefetch ?? 10;
    // prefetch 10 mins: RabbitMQ gives only 10 message at a time to that consumer
    // it will not send the next message until the first 10 is acknowledged
    this.channel.prefetch(prefetch);

    this.channel.on("error", (error) => {
      this._logger.error("consumer channel error", error);
      this._circuitBreaker.onFailure();
    });

    this.channel.on("close", () => {
      this._logger.warn("consumer channel closed unexpectedly");
      if (this._isRunning) this._reconnect();
    });

    this._logger.info(
      `started consuming form the queue: ${this._config.rabbitmq.queue}`
    );
    this._isRunning = true;

    this.channel.consume(
      this._rabbitmq.queue,
      async (msg) => {
        if (msg !== null) {
          await this._handleMessage(msg);
        }
      },
      { noAck: false, consumerTag: `consumer-${Date.now()}` }
    );

    this._logger.info("Event consumer is running");

    try {
    } catch (error) {
      this._logger.error("failed to start consumer", error);
      await this._cleanUp();
      throw error;
    }
  }

  async stop() {
    try {
      await this._cleanUp();
      await Promise.all([
        this._mongodb.close(),
        this._rabbitmq.close(),
        this._postgres.close()
      ]);
    } catch (error) {
      this._logger.error("error during stopping consumer", error);
    }
  }
}

const retryStrategy = new RetryStrategy({
  maxRetries: config.rabbitmq.retryAttempts,
  baseDelayMs: config.rabbitmq.retryDelay,
  maxDelayMs: 30_000,
  jitterFactor: 0.3
});

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 30_000,
  halfOpenMaxAttempts: 3,
  logger
});

const consumer = new EventConsumer({
  processorService: processorContainer.service.ProcessorService,
  rabbitmq,
  mongodb,
  postgres,
  config,
  logger,
  retryStrategy,
  circuitBreaker,
  isRetryable
});

async function startConsumerWithRetry() {
  const startupRetry = new RetryStrategy({
    maxRetries: 5,
    baseDelayMs: 5000,
    maxDelayMs: 30_000
  });
  let attempt = 0;

  while (startupRetry.shouldRetry(attempt) || attempt === 0) {
    try {
      logger.info(`Starting consumer (attempt ${attempt + 1})`);
      await consumer.start();
      logger.info("Consumer started successfully");
      return;
    } catch (error) {
      attempt++;
      logger.error(`Consumer start attempt ${attempt} failed:`, error);

      if (!startupRetry.shouldRetry(attempt)) {
        logger.error("Max retries reached, exiting...");
        process.exit(1);
      }

      await startupRetry.wait(attempt - 1);
    }
  }
}

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  await consumer.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  await consumer.stop();
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection at:", {
    promise,
    reason: reason?.message,
    stack: reason?.stack
  });
  process.exit(1);
});

startConsumerWithRetry();

export default consumer;
