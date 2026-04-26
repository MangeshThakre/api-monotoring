import BaseRepository from "./BaseREpository";

const MAX_LIMIT = 1000;
const QUERY_TIMEOUT_MS = 30000; // 30 seconds

export default class MetricRepository extends BaseRepository {
  constructor({ logger: logger, postgres: pg } = {}) {
    super({ logger });
    this.pg = pg;
  }

  // Private method to execute SQL queries with error handling and logging
  async _query(sql, params = [], client = this.postgres) {
    const target = client === this.postgres;

    if (!target || typeof target.query !== "function") {
      const error = new Error("Invalid database client provided");
      this.logger.error("Database query error: postgres client not configured");
      throw error;
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
        DO UPDATE SET (total_hits = endpoint_metrics.total_hits + EXCLUDED.total_hits,  
                        error_hits = endpoint_metrics.error_hits + EXCLUDED.error_hits,
                        avg_latency = ((endpoint_metrics.avg_latency * endpoint_metrics.total_hits) + (EXCLUDED.avg_latency * EXCLUDED.total_hits)) / (endpoint_metrics.total_hits + EXCLUDED.total_hits),
                        min_latency = LEAST(endpoint_metrics.min_latency, EXCLUDED.min_latency), 
                        max_latency = GREATEST(endpoint_metrics.max_latency, EXCLUDED.max_latency)) 
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
}
