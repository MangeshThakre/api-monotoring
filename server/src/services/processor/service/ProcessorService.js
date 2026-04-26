import logger from "../../../shared/config/logger.js";

export default class ProcessorService {
  constructor({ ApiHitRepository, MetricsRepository }) {
    if (!ApiHitRepository)
      throw new Error("processor required ApiHitRepository");
    if (!MetricsRepository)
      throw new Error("processor required MetricsRepository");

    this.ApiHitRepository = ApiHitRepository;
    this.MetricsRepository = MetricsRepository;
  }

  getTimeBucket(timeBucket, interval = "hour") {
    const date = new Date(timeBucket);

    switch (interval) {
      case "hour":
        date.setMinutes(0, 0, 0);
        break;
      case "day":
        date.setMinutes(0, 0, 0);
        break;
      case "minute":
        date.setMinutes(0, 0, 0);
        break;
      default:
        date.setMinutes(0, 0, 0);
    }
  }

  async _updateMetricsWithFallBack(eventData) {
    try {
      // calculate time bucket
      const timeBucket = this.getTimeBucket(eventData.timestamp, "hour"); // [12:00-12:59] [01:00-01:59]

      // prepare data
      const metricsData = {
        clientId: eventData.clientId.toString(),
        serverName: eventData.serverName,
        endpoint: eventData.endpoint,
        method: eventData.method,
        totalHits: 1,
        errorHits: eventData.statusCode >= 400 ? 1 : 0,
        avgLatency: eventData.latencyMs,
        minLatency: eventData.latencyMs,
        maxLatency: eventData.latencyMs,
        timeBucket: timeBucket
      };

      await this.MetricsRepository.upsertEndPointMetrics(metricsData);
    } catch (error) {
      throw error;
    }
  }

  async processEvent(eventData) {
    let rawEventSaved = false; // depends on eventually consistency

    try {
      logger.info("processing event data", {
        eventId: eventData.eventId,
        clientId: eventData.clientId,
        serverName: eventData.serverName,
        endPoint: eventData.endpoint,
        method: eventData.method
      });

      // step 1: save data to mongoDb
      // ether this will succeed or the whole operation will failed

      await this.ApiHitRepository.save(eventData);
      rawEventSaved = true;

      logger.info("Raw event saved to mongoDB: ProcessorService", {
        eventId: eventData.eventId
      });

      // step 2 : upsert Data into PG
      // if this will fail we will not cancel the whole operation,

      await this._updateMetricsWithFallBack(eventData);
      logger.info();
    } catch (error) {
      if (!rawEventSaved) {
        logger.error(
          "critical: Failed to save data into mongoDB: processorService",
          {
            errorMessage: error.message,
            eventId: eventData.eventId
          }
        );
        throw error;
      }

      logger.error(
        "Non-critical: Raw event Save but metric failed: processorService",
        {
          errorMessage: error.message,
          eventId: eventData.eventId
        }
      );
    }
  }

  async cleanupOldEvents(daysToKeep = 30) {
    try {
      let cutOffDate = new Data();
      cutOffDate.setDate(cutOffDate.getData() - daysToKeep);

      const deleteCount = await this.ApiHitRepository.deleteOldHits(cutOffDate);
      return deleteCount;
    } catch (error) {
      logger.error("error during cleanup old Events", error)
      throw error;
    }
  }
}
