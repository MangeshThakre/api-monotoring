import logger from "../../../shared/config/logger";
import Client from "../../../shared/models/Client.js";
import BaseClientRepository from "./BaseClientRepository.js";

export default class MongoClientRepository extends BaseClientRepository {
  constructor() {
    super(Client);
  }

  async create(clientData) {
    try {
      const client = new this.modal.create(clientData);
      await client.save();
      logger.info("Client created successfully: clientRepository");
      return client;
    } catch (error) {
      logger.error("Error Creating Client:clientRepository:", 400);
      throw error;
    }
  }

  async findById(clientId) {
    try {
      const client = await this.modal.findById(clientId);
      if (!client) logger.info("Invalid Id: clientRepository");
      return client;
    } catch (error) {
      logger.error("Error getting Client by Id:clientRepository", error);
      throw error;
    }
  }

  async findBySlug(slug) {
    try {
      const client = await this.modal.find({ slug: slug });
      return client;
    } catch (error) {
      logger.error("Error getting Client by slug:clientRepository", error);
      throw error;
    }
  }
}
