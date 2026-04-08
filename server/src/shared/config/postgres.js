import postgres from "postgres";
import config from "./index.js";
import logger from "./logger.js";

/****
 * PostgreSQL connection setup
 */

class PostgresConnection {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      if (this.connection) {
        logger.info("already connected to postgres");
        return this.connection;
      }
      this.connection = postgres({
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
        user: config.postgres.user,
        password: config.postgres.password
      });
      logger.info("connected to postgres", this.connection);
      return this.connection;
    } catch (error) {
      logger.error("error connecting to postgres", error);
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await this.connection.end();
        logger.info("postgres disconnected");
        this.connection = null;
      }
    } catch (error) {
      logger.error("failed to disconnecting from postgres", error);
    }
  }

  /**
   * @return current postgres connection instance
   */
  async getConnection() {
    return this.connection;
  }
}

export default PostgresConnection;
