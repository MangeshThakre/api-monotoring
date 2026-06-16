import BaseApiKeyRepository from "./BaseApiKeyRepository.js";
import ApiKey from "../../../shared/models/ApiKey.js";
import logger from "../../../shared/config/logger.js";
import { IApiKey } from "../../../shared/models/ApiKey.js";

export default class MongoApiKeyRepository extends BaseApiKeyRepository {
  constructor() {
    super(ApiKey);
  }

  /**
   * @param  apiKeyData
   * @returns api key
   */
  async create(apiKeyData: Partial<IApiKey>) {
    try {
      const apiKey = new this.model(apiKeyData);
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
  async findByKeyValue(keyValue: string, includeInActive = false) {
    try {
      const filter: any = { keyValue };
      // includeInActive ApiKey

      if (!includeInActive) {
        filter.isActive = true;
      }

      const apiKey = await this.model.findOne(filter).populate("clientId");
      if (!apiKey) logger.warn("unable to find apiKey");
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
  async findByClientId(clientId: string) {
    try {
      const apiKeys = await this.model
        .findOne({ clientId })
        .populate("clientId");
      logger.info("apiKey by clientId got Successfully");
      return apiKeys;
    } catch (error) {
      logger.error(
        "Error getting apiKey by clientId: apiKeyREpository:",
        error
      );
      throw error;
    }
  }

  async countByClientId(clientId: string, filters: any) {
    try {
    } catch (error) {
      logger.error("Error getting Count: apiKeyREpository:", error);
      throw error;
    }
  }
}
