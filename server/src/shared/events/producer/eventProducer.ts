import { EVENTS_TYPES } from "../eventContracts.js";
import { CircuitBreaker } from "./CircuitBreaker.js";
import { isRetryable } from "./RetryStrategy.js";
import AppError from "../../utils/AppError.js";
import { RetryStrategy } from "./RetryStrategy.js";

export interface IApiHitEventData {
  eventId: string;
  timestamp: Date;
  serviceName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  clientId: string;
  apiKeyId: string;
  ip: string;
  userAgent: string;
}

interface IEventMetric {
  published: number;
  failed: number;
  retriesExhausted: number;
  [key: string]: number;
}

export class EventProducer {
  private _metrics: IEventMetric;
  private _shuttingDown: boolean;

  constructor(
    private channelManager: any,
    private circuitBreaker: CircuitBreaker,
    private retryStrategy: RetryStrategy,
    private logger: any,
    private queueName: string
  ) {
    if (!channelManager)
      throw new Error("EventProducer required channelManager");
    if (!circuitBreaker)
      throw new Error("EventProducer required circuitBreaker");
    if (!retryStrategy) throw new Error("EventProducer required RetryStrategy");
    if (!queueName) throw new Error("EventProducer required queueName");

    this.logger = logger ?? console;

    this._metrics = {
      published: 0,
      failed: 0,
      retriesExhausted: 0
    };
    this._shuttingDown = false;
  }

  _incrementMetrics(metric: string) {
    this._metrics[metric] = (this._metrics[metric] || 0) + 1;
  }

  async publishApiHit(eventData: IApiHitEventData) {
    if (this._shuttingDown) {
      const error = new Error(
        "EventProducer is shutting down, cannot publish new messages"
      );
      // error.code = "SHUTDOWN_IN_PROGRESS";
      this.logger.warn(
        "[EventProducer] Rejecting publish attempt during shutdown",
        { eventId: eventData.eventId }
      );
      throw error;
    }

    if (!this.circuitBreaker.allowRequest()) {
      const error = new Error(
        "Circuit breaker is open, rejecting publish attempt"
      );
      // error.code = "CIRCUIT_OPEN";
      this.logger.warn(
        "[EventProducer] Rejecting publish attempt due to open circuit breaker",
        { eventId: eventData.eventId }
      );
      throw error;
    }

    const corelationId = eventData.eventId;
    let startMs = Date.now();
    let attempt = 0;

    while (true) {
      const latencyMs = Date.now() - startMs;
      try {
        await this._publish(eventData, { corelationId, attempt });
        this.circuitBreaker.onSuccess();
        this._incrementMetrics("published");
        this.logger.info("[EventProducer] Successfully published event", {
          eventId: eventData.eventId,
          corelationId,
          latencyMs,
          attempt: attempt + 1,
          endPoint: eventData.endpoint
        });
        return true;
      } catch (error: any) {
        this._incrementMetrics("failed");
        this.logger.error("[EventProducer] Failed to publish event", {
          eventId: eventData.eventId,
          corelationId,
          latencyMs,
          attempt: attempt + 1,
          endPoint: eventData.endpoint,
          error: error.message,
          code: error.code
        });
        const canRetry =
          isRetryable(error) && this.retryStrategy.shouldRetry(attempt);

        if (!canRetry) {
          this.circuitBreaker.onFailure();
          this._incrementMetrics("failed");
          if (!this.retryStrategy.shouldRetry(attempt)) {
            this._incrementMetrics("retriesExhausted");
          }
          throw error;
        }

        await this.retryStrategy.wait(attempt);
        attempt++;
      }
    }
  }

  async _publish(
    eventData: IApiHitEventData,
    { corelationId, attempt }: { corelationId: string; attempt: number }
  ) {
    const channel = await this.channelManager.getChannel();

    const message = {
      type: EVENTS_TYPES.API_HIT,
      data: eventData,
      PublishAt: new Date().toISOString(),
      attempt: attempt + 1
    };

    const buffer = Buffer.from(JSON.stringify(message));

    const publishOptions = {
      persistent: true,
      contentType: "application/json",
      messageId: eventData.eventId,
      correlationId: corelationId,
      timeStamp: Date.now()
    };

    return new Promise<void>((resolve, reject) => {
      const written = channel.publish(
        "",
        this.queueName,
        buffer,
        publishOptions,
        (err: any) => {
          if (err) {
            reject(new Error(`publish naked: ${err.message}`));
          } else {
            resolve();
          }
        }
      );

      if (!written) {
        this.logger.warn(
          "[EventProducer] Channel buffer is full, waiting for drain event",
          { eventId: eventData.eventId }
        );
      }

      const onDrain = () => {
        channel.removeListener("drain", onDrain);
        this.logger.info(
          "[EventProducer] Channel buffer drained, resuming publish",
          { eventId: eventData.eventId }
        );
        resolve();
      };

      channel.on("drain", onDrain);
    });
  }

  async shuttingDown() {
    this._shuttingDown = true;
    this.logger.info(
      "[EventProducer] Shutting down, waiting for pending messages to be published"
    );
    await this.channelManager.close();
    this.logger.info("[EventProducer] Shutdown complete");
  }

  getStats() {
    return {
      metric: { ...this._metrics },
      circuitBreaker: this.circuitBreaker.snapshot()
    };
  }
}
