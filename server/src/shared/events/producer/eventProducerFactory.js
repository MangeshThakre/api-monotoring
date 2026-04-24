import config from "../../../shared/config/index.js";
import logger from "../../../shared/config/logger.js";
import rabbitmq from "../../../shared/config/rabbitmq.js";

import { EventProducer } from "./eventProducer.js";
import { CircuitBreaker } from "./CircuitBreaker.js";
import { ConfirmChannelManager } from "./ConfirmChannelManager.js";
import { RetryStrategy } from "./RetryStrategy.js";

export default function eventProducerFactory(overrides = {}) {
  const log = overrides.logger ?? console;
  const queueName = overrides.queueName ?? config.rabbitmq.queue;
  const rmq = overrides.rabbitmq ?? rabbitmq;

  // validate critical dependencies
  if (!rmq) {
    throw new Error("RabbitMQ connection is required for EventProducerFactory");
  }

  if (!queueName) {
    throw new Error("Queue name is required for EventProducerFactory");
  }
  if (!config.rabbitmq.retryAttempts || !config.rabbitmq.retryAttempts < 0) {
    throw new Error(
      "Invalid retryAttempts configuration for EventProducerFactory"
    );
  }

  const channelManager =
    overrides.channelManager ??
    new ConfirmChannelManager({
      rabbitmq: rmq,
      logger: log
    });

  const circuitBreaker =
    overrides.circuitBreaker ??
    new CircuitBreaker({
      failureThreshold: 5,
      cooldownMs: 30_000,
      halfOpenMaxAttempts: 3,
      logger: log
    });

  const retryStrategy =
    overrides.retryStrategy ??
    new RetryStrategy({
      maxRetries: 3,
      baseDelayMs: 200,
      maxDelayMs: 5000,
      jitterFactor: 0.3
    });

  return new EventProducer({
    channelManager,
    circuitBreaker,
    retryStrategy,
    logger: log,
    queueName
  });
}
