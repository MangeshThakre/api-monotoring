import BaseApiHitRepository from "./BaseApiHitRepository.js";

const MAX_LIMIT = 1000;
const QUERY_TIMEOUT_MS = 30000; // 30 seconds

export default class MetricsRepository extends BaseApiHitRepository {
  constructor({ logger: logger, postgres: pg } = {}) {
    super({ logger });
    this.postgres = pg;
    this.logger = logger;
  }

  // Private method to execute SQL queries with error handling and logging
  _query(sql, params = [], client = this.postgres) {
    const target = client || this.postgres;

    if (!target || typeof target.query !== "function") {
      const err = new Error(
        "Postgres client not configured on MetricsRepository"
      );
      this.logger.error("DB query error: Postgres client not configured");
      throw err;
    }

    return target.query({
      text: sql,
      values: params,
      statement_timeout: QUERY_TIMEOUT_MS
    });
  }

  async upsertEndPointMetrics(metricsData) {
    try {
      const {
        clientId,
        serviceName,
        endpoint,
        method,
        totalHits,
        errorHits,
        avgLatency,
        minLatency,
        maxLatency,
        timeBucket
      } = metricsData;

      const query = `INSERT INTO ENDPOINT_METRICS (client_id, service_name, endpoint, method, total_hits, error_hits, avg_latency, min_latency, max_latency, time_bucket) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        ON CONFLICT (client_id, service_name, endpoint, method, time_bucket) 
        DO UPDATE SET total_hits = endpoint_metrics.total_hits + EXCLUDED.total_hits,  
                        error_hits = endpoint_metrics.error_hits + EXCLUDED.error_hits,
                        avg_latency = ((endpoint_metrics.avg_latency * endpoint_metrics.total_hits) + (EXCLUDED.avg_latency * EXCLUDED.total_hits)) 
                           / NULLIF(endpoint_metrics.total_hits + EXCLUDED.total_hits, 0),
                        min_latency = LEAST(endpoint_metrics.min_latency, EXCLUDED.min_latency), 
                        max_latency = GREATEST(endpoint_metrics.max_latency, EXCLUDED.max_latency), 
                        updated_at =NOW()`;
      await this._query(query, [
        clientId,
        serviceName,
        endpoint,
        method,
        totalHits,
        errorHits,
        avgLatency,
        minLatency,
        maxLatency,
        timeBucket
      ]);
    } catch (error) {
      this.logger.error("Error upsetting endpoint metrics", error);
      console.log(error);
      throw error;
    }
  }

  async getMetrics(filter = {}, options = {}) {
    try {
      const {
        clientId,
        serviceName,
        endpoint,
        startTime,
        endTime,
        limit = 10,
        offset = 0
      } = filter;

      const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT); // Ensure limit is between 1 and MAX_LIMIT
      const safeOffset = Math.max(0, offset);
      const query = `SELECT 
                        service_name, 
                        endpoint, 
                        method, 
                        SUM(total_hits) AS total_hits, 
                        SUM(error_hits) AS error_hits, 
                        SUM(avg_latency * total_hits)/ NULLIF(SUM(total_hits, 0)) AS avg_latency,
                        MIN(min_latency) AS min_latency,
                        MAX(max_latency) AS max_latency,
                        time_bucket
                    FROM endpoint_metrics`;
      const params = [];
      const paramIndex = -1;

      let whereConditions = [];

      if (clientId !== null) {
        whereConditions.push(`client_id = $${paramIndex}`);
        params.push(clientId);
        paramIndex++;
      }

      if (serviceName !== null) {
        whereConditions.push(`service_name = $${paramIndex}`);
        params.push(serviceName);
        paramIndex++;
      }

      if (endpoint !== null) {
        whereConditions.push(`endpoint = $${paramIndex}`);
        params.push(endpoint);
        paramIndex++;
      }

      if (startTime !== null) {
        whereConditions.push(`time_bucket >= $${paramIndex}`);
        params.push(startTime);
        paramIndex++;
      }

      if (endTime !== null) {
        whereConditions.push(`time_bucket <= $${paramIndex}`);
        params.push(endTime);
        paramIndex++;
      }

      if (whereConditions.length > 0) {
        query += `WHERE ${whereConditions.join(" AND ")}`;
      }

      query += `
            GROUP BY service_name, endpoint, method, time_bucket 
            ORDER BY time_bucket 
            DESC LIMIT $${paramIndex} 
            OFFSET $${paramIndex + 1}`;

      params.push(safeLimit, safeOffset);
      const result = await this._query(query, params);
      return result.rows;
    } catch (error) {
      this.logger.error("Error fetching metrics", error);
      throw error;
    }
  }

  async getOverallStats(clientId, startTime = null, endTime = null) {
    try {
      let query = `
        SELECT
          SUM(total_hits) as total_hits,
          SUM(error_hits) as error_hits,
          SUM(avg_latency * total_hits) / NULLIF(SUM(total_hits), 0) as avg_latency,
          COUNT(DISTINCT service_name) as unique_services,
          COUNT(DISTINCT endpoint) as unique_endpoints
        FROM endpoint_metrics
      `;

      const params = [];
      let paramIndex = 1;

      // Add client filter only if clientId is provided
      if (clientId != null) {
        query += ` WHERE client_id = $${paramIndex}`;
        params.push(clientId);
        paramIndex++;
      }

      if (startTime) {
        query += clientId != null ? ` AND` : ` WHERE`;
        query += ` time_bucket >= $${paramIndex}`;
        params.push(startTime);
        paramIndex++;
      }

      if (endTime) {
        query += clientId != null || startTime ? ` AND` : ` WHERE`;
        query += ` time_bucket <= $${paramIndex}`;
        params.push(endTime);
        paramIndex++;
      }

      const result = await this._query(query, params);
      return result.rows[0] || {};
    } catch (error) {
      this.logger.error("Error getting overall stats:", error);
      throw error;
    }
  }

  async getTopEndpoints(clientId, limit = 10, startTime = null) {
    try {
      const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);

      let query = `
        SELECT
          service_name,
          endpoint,
          method,
          SUM(total_hits) as total_hits,
          SUM(avg_latency * total_hits) / NULLIF(SUM(total_hits), 0) as avg_latency,
          SUM(error_hits) as error_hits
        FROM endpoint_metrics
      `;

      const params = [];
      let paramIndex = 1;

      // Add client filter only if clientId is provided
      if (clientId != null) {
        query += ` WHERE client_id = $${paramIndex}`;
        params.push(clientId);
        paramIndex++;
      }

      if (startTime) {
        query += clientId != null ? ` AND` : ` WHERE`;
        query += ` time_bucket >= $${paramIndex}`;
        params.push(startTime);
        paramIndex++;
      }

      query += `
        GROUP BY service_name, endpoint, method
        ORDER BY total_hits DESC
        LIMIT $${paramIndex}
      `;
      params.push(safeLimit);

      const result = await this._query(query, params);
      return result.rows;
    } catch (error) {
      this.logger.error("Error getting top endpoints:", error);
      throw error;
    }
  }
}
