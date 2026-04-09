import mongoose from "mongoose";
import config from "./index.js";
import logger from "./logger.js";

/****
 * MongoDB connection setup
 */

class MongoConnection {
  constructor() {
    this.connection = null;
  }

  /**
   *  connect to mongodb if not already connected
   * @returns  mongoose connection instance
   */
  async connect() {
    try {
      if (this.connection) {
        logger.info("already connected to mongodb");
        return this.connection;
      }
      await mongoose.connect(config.mongo.uri, {
        dbName: config.mongo.dbName
      });

      this.connection = mongoose.connection;

      logger.info("connected to mongodb");
      return this.connection;
    } catch (error) {
      logger.error("error connection to the mongodb", error);
    }
  }

  /**
   * disconnect from mongodb if
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        logger.info("mongodb disconnected");
        this.connection = null;
      }
    } catch (error) {
      logger.error("failed to disconnect from mongodb", error);
    }
  }

  /**
   * @returns current mongoose connection instance
   */
  getConnection() {
    return this.connection;
  }
}

export default new MongoConnection();
