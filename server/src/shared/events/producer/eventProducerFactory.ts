import config from "../../config/index.js";
import rabbitmq from "../../config/rabbitmq.js";

import { EventProducer } from "./eventProducer.js";
import { CircuitBreaker } from "./CircuitBreaker.js";
import { ConfirmChannelManager } from "./ConfirmChannelManager.js";
import { RetryStrategy } from "./RetryStrategy.js";

interface IEventProducerFactoryOverrides {
  logger?: any;
  queueName?: string;
  rabbitmq?: typeof rabbitmq;
  channelManager?: ConfirmChannelManager;
  circuitBreaker?: CircuitBreaker;
  retryStrategy?: RetryStrategy;
}

export default function eventProducerFactory(
  overrides: IEventProducerFactoryOverrides = {}
) {
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
  if (config.rabbitmq.retryAttempts < 0) {
    throw new Error(
      "Invalid retryAttempts configuration for EventProducerFactory"
    );
  }

  // Resolves Channel Manager: uses provided override (for testing) or creates a fresh instance for connection handling
  const channelManager =
    overrides.channelManager ??
    new ConfirmChannelManager({
      rabbitmq: rmq,
      logger: log
    });
  // Resolves Circuit Breaker: safeguards the broker by halting traffic after 5 failures, cooling down for 30s, and testing with 3 probes
  const circuitBreaker =
    overrides.circuitBreaker ??
    new CircuitBreaker({
      failureThreshold: 5,
      coolDownMs: 30_000,
      halfOpenMaxAttempts: 3,
      logger: log
    });

  // Resolves Retry Strategy: manages transient failures using exponential backoff (up to 3 retries, max 5s delay) with 30% random jitter
  const retryStrategy =
    overrides.retryStrategy ??
    new RetryStrategy({
      maxRetries: 3,
      baseDelayMs: 200,
      maxDelayMs: 5000,
      jitterFactor: 0.3
    });

  // Message sender that formats data events and safely delivers them to a RabbitMQ queue,
  // using a circuit breaker and retry logic to prevent data loss during network hiccups.

  return new EventProducer(
    channelManager, // The connection to RabbitMQ
    circuitBreaker, // The safety switch to prevent overloads
    retryStrategy, // The rules for resending failed messages
    log, // The logger for tracking what happens
    queueName // The specific queue where messages should go
  );
}
