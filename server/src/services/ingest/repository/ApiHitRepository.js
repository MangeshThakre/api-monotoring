import BaseApiHitRepository from "./BaseApiHitRepository.js";
import apiHit from "../models/apiHit.js";
import logger from "../../../shared/config/logger.js";

class ApiHitRepository extends BaseApiHitRepository {
  constructor() {
    super(apiHit);
  }

  async create(data) {
    try {
     

      return apiHitRecord;
    } catch (error) {
      logger.error("Error creating API hit record : apiRepository :", error);
      throw error;
    }
  }
}

export default ApiHitRepository;
