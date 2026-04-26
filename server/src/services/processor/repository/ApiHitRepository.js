import ApiHits from "../../../shared/models/ApiHits.js";
import BaseRepository from "./BaseRepository.js";
import logger from "../../../shared/config/logger.js";

class ApiHitRepository extends BaseRepository {
  constructor() {
    super(ApiHits);
  }

  async save(eventData) {
    try {
      const data = this.modal(eventData);
      await data.save();
      this.logger.info("API hit saved successfully : apiHitsRepository");
      return data;
    } catch (error) {
      logger.error("Error saving API hit : apiHitsRepository", error);
      throw error;
    }
  }

  async find(filter = {}, options = {}) {
    try {
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

  async deleteOldHits(beforeDate) {
    try {
      const result = await this.modal.deleteMany({
        timestamp: { $lt: beforeDate }
      });
      logger.info(
        `Deleted ${result.deletedCount} old API hits : apiHitsRepository`
      );
      return result.deletedCount;
    } catch (error) {}
  }
}

export default ApiHitRepository;
