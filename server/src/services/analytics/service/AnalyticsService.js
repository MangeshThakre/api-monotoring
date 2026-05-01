import logger from "../../../shared/config/logger.js";

export default class AnalyticsService {
  constructor(MetricsRepository) {
    if (!MetricsRepository)
      throw new Error("AnalyticsService required a MetricsRepository ");

    this.MetricsRepository = MetricsRepository;
  }

  parseTimeFilters(filters) {
    let { startTime, endTime } = filters;

    if (!startTime) {
      startTime = new Date();
      startTime.setHours(startTime.getHours() - 24); // last 24 hrs
    } else {
      startTime = new Date(startTime);
    }

    if (!endTime) {
      endTime = new Date();
    } else {
      endTime = endTime(new Date());
    }

    return { startTime, endTime };
  }

  async getOverAllStatics(clientId, filters = {}) {
    try {
      const { startTime, endTime } = this.parseTimeFilters(filters);

      const stats = await this.MetricsRepository.getOverallStats(
        clientId,
        startTime,
        endTime
      );

      const totalHits = parseInt(stats.total_hits) || 0;
      const errorHits = parseInt(stats.error_hits) || 0;
      const errorRate = totalHits > 0 ? (errorHits / totalHits) * 100 : 0;
      return {
        totalHits,
        errorHits,
        errorRate,
        successHits: totalHits - errorHits,
        averageLatency: parseFloat(stats.avg_latency) || 0,
        uniqueServices: parseFloat(stats.unique_services) || 0,
        uniqueEndpoints: parseFloat(stats.unique_endpoints) || 0,
        totalRange: {
          start: startTime,
          end: endTime
        }
      };
    } catch (error) {
      logger.error(
        "Error during getting overall statics: analyticsService",
        error
      );
      throw error;
    }
  }

  async getTopEndpoints(clientId, options) {
    try {
      const { limit = 10, startTime } = options;
      const parsedStartTime = startTime ? new Date(startTime) : null;

      const endpoints = await this.MetricsRepository.getTopEndpoints(
        clientId,
        limit,
        parsedStartTime
      );

      return endpoints.map((endpoints) => {
        // serviceName: endpoints.service_name,
        // endpoint : endpoints.endpoint,
      });
    } catch (error) {}
  }
}
