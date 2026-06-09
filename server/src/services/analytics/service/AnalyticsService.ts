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

      return endpoints.map((endpoint) => {
        return {
          serviceName: endpoint.service_name,
          endpoint: endpoint.endpoint,
          method: endpoint.method,
          totalHits: parseInt(endpoint.total_hits),
          avgLatency: parseFloat(endpoint.avg_latency).toFixed(2),
          errorHits: parseInt(endpoint.error_hits),
          errorRate: parseFloat(
            (parseInt(endpoint.error_hits) / parseInt(endpoint.total_hits)) *
              100
          ).toFixed(2)
        };
      });
    } catch (error) {
      logger.error("Error Getting top endpoints: AnalyticService", error);
      throw error;
    }
  }

  async getTimeSeries(clientId, filters = {}) {
    try {
      const {
        serviceName,
        endpoint,
        startTime,
        endTime,
        limit = 100
      } = filters;

      const { endTime: end_time, startTime: start_time } =
        this.parseTimeFilters({ startTime, endTime });

      const metrics = await this.metricsRepository.getMetrics({
        clientId,
        serviceName,
        endpoint,
        startTime: start_time,
        endTime: end_time,
        limit
      });

      return metrics.map((metric) => ({
        serviceName: metric.service_name,
        endpoint: metric.endpoint,
        method: metric.method,
        totalHits: parseInt(metric.total_hits),
        errorHits: parseInt(metric.error_hits),
        avgLatency: parseFloat(metric.avg_latency).toFixed(2),
        minLatency: parseFloat(metric.min_latency).toFixed(2),
        maxLatency: parseFloat(metric.max_latency).toFixed(2),
        timeBucket: metric.time_bucket
      }));
    } catch (error) {
      logger.error("Error getting time series:", error);
      throw error;
    }
  }
}
