import ApiHits, { IApiHit } from "../../../shared/models/ApiHits.js";
import BaseApiHitRepository from "./BaseApiHitRepository.js";
import logger from "../../../shared/config/logger.js";

type QueryOptions = {
  skip?: number;
  limit?: number;
  sort?: any;
};

class ApiHitRepository extends BaseApiHitRepository {
  constructor() {
    super(ApiHits);
  }

  async save(eventData: Partial<IApiHit>) {
    try {
      const data = new this.model(eventData);
      await data.save();
      logger.info("API hit saved successfully : apiHitsRepository");
      return data;
    } catch (error) {
      logger.error("Error saving API hit : apiHitsRepository", error);
      throw error;
    }
  }

  async find(filter = {}, options: QueryOptions = {}) {
    try {
      // default value of the options of options value not exist
      const { skip = 0, limit = 10, sort = { timestamp: -1 } } = options;

      const apiHits = await this.model
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(); // Use lean() returns plain JavaScript objects instead of Mongoose documents, improving performance for read operations.

      return apiHits;
    } catch (error) {
      logger.error("Error finding API hits : apiHitsRepository", error);
      throw error;
    }
  }

  async count(filter = {}) {
    try {
      const count = await this.model.countDocuments(filter);
      logger.info(`Counted ${count} API hits : apiHitsRepository`);
      return count;
    } catch (error) {
      logger.error("Error counting API hits : apiHitsRepository", error);
      throw error;
    }
  }

  async deleteOldHits(beforeDate: Date) {
    try {
      const result = await this.model.deleteMany({
        timestamp: { $lt: beforeDate }
      });
      logger.info(
        `Deleted ${result.deletedCount} old API hits : apiHitsRepository`
      );
      return result.deletedCount;
    } catch (error) {
      logger.error("Error deleting old API hits : apiHitsRepository", error);
      throw error;
    }
  }
}

export default ApiHitRepository;
