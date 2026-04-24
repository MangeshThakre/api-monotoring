import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";
import { v4 as uuidv4 } from "uuid";

class IngestService {
  constructor(eventProducer) {
    if (!eventProducer) throw new Error("Event producer factory is required");

    this.eventProducer = eventProducer;
  }

  validateHitData(hitData) {
    const requiredFields = [
      "serviceName",
      "endpoint",
      "method",
      "statusCode",
      "latencyMs",
      "clientId"
    ];

    const missingFields = requiredFields.filter((field) => !hitData[field]);

    if (missingFields.length > 0) {
      throw new AppError(
        `Missing required fields: ${missingFields.join(", ")}`,
        400
      );
    }

    const validMethods = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
      "HEAD"
    ];

    if (!validMethods.includes(hitData.method.toUpperCase())) {
      throw new AppError(`Invalid method: ${hitData.method}`, 400);
    }

    const statusCode = parseInt(hitData.statusCode, 10); // Ensure statusCode is a number
    if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
      throw new AppError(`Invalid status code: ${hitData.statusCode}`, 400);
    }

    const latencyMs = parseFloat(hitData.latencyMs); // Ensure latencyMs is a number
    if (isNaN(latencyMs) || latencyMs < 0) {
      throw new AppError(`Invalid latency: ${hitData.latencyMs}`, 400);
    }
  }

  async ingestApiHit(hitData) {
    try {
      this.validateHitData(hitData);
      const event = {
        eventId: uuidv4(),
        timestamp: new Date(),
        serverName: hitData.serviceName,
        endpoint: hitData.endpoint,
        method: hitData.method,
        statusCode: hitData.statusCode,
        latencyMs: hitData.latencyMs,
        clientId: hitData.clientId,
        apiKeyId: hitData.apiKeyId,
        ip: hitData.ip,
        userAgent: hitData.userAgent
      };

      const publish = await this.eventProducer.publishApiHit(event);

      if (!publish) {
        // Circuit breaker rejected the request
        logger.warn("API hit rejected by circuit breaker", {
          eventId: event.eventId,
          endpoint: event.endpoint,
          method: event.method,
          clientId: event.clientId
        });

        return {
          eventId: event.eventId,
          status: "rejected",
          reason: "service_unavailable",
          timestamp: event.timestamp
        };
      }

      logger.info("Successfully ingested API hit event:", {
        eventId: event.eventId,
        serverName: event.serverName,
        endpoint: event.endpoint
      });

      return {
        eventId: event.eventId,
        timestamp: event.timestamp,
        status: "queued"
      };
    } catch (error) {
      logger.error("Error ingesting API hit:", error);
      throw error;
    }
  }
}

export default IngestService;
