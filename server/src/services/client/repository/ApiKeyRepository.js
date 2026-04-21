import BaseApiKeyRepository from "./baseApiKeyRepository.js";
import ApiKey from "../../../shared/models/ApiKey.js";
import logger from "../../../shared/config/logger.js";

export default class MongoApiKeyRepository extends BaseApiKeyRepository {
  constructor() {
    super(ApiKey);
  }

  /**
   * @param  apiKeyData
   * @returns api key
   */
  async create(apiKeyData) {
    try {
      const apiKey = this.modal.create(apiKeyData);
      await apiKey.save();
      logger.info("ApiKey created successfully");
      return apiKey;
    } catch (error) {
      logger.error("Error create Api Key: apiKeyRepository", error);
      throw error;
    }
  }

  /**
   * @param {*} keyValue
   * @returns
   */
  async findByKeyValue(keyValue, includeInActive = false) {
    try {
      const filter = { keyValue };
      // includeInActive ApiKey
      if (!includeInActive) {
        filter.isActive = true;
      }
      const apiKey = await this.modal.findOne(filter).populate("clientId");
      if (!apiKey) logger.warning("unable to find apiKey");
      logger.info("ApiKey by keyValue got Successfully");
      return apiKey;
    } catch (error) {
      logger.error("Error Getting Api Key: apiKeyRepository:", error);
      throw error;
    }
  }

  /**
   * @param {*} clientId
   */
  async findByClientId(clientId) {
    try {
      const apiKey = await this.modal.find(clientId).populate(clientId);
      if (!apiKey) logger.warning("unable to find apiKey");
      logger.info("apiKey by clientId got Successfully");
    } catch (error) {
      logger.error(
        "Error getting apiKey by clientId: apiKeyREpository:",
        error
      );
      throw error;
    }
  }

  async countByClientId(clientId, filters) {
    try {
    } catch (error) {
      logger.error("Error getting Count: apiKeyREpository:", error);
      throw error;
    }
  }
}
