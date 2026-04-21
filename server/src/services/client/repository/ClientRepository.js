import logger from "../../../shared/config/logger.js";
import Client from "../../../shared/models/Client.js";
import BaseClientRepository from "./BaseClientRepository.js";

export default class MongoClientRepository extends BaseClientRepository {
  constructor() {
    super(Client);
  }

  async create(clientData) {
    try {
      const client = new this.modal(clientData);
      await client.save();
      logger.info("Client created successfully: clientRepository");
      return client.populate("createdBy", "-password");
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
      const client = await this.modal.findOne({ slug: slug });
      return client;
    } catch (error) {
      logger.error("Error getting Client by slug:clientRepository", error);
      throw error;
    }
  }

  async find(filter = {}, options = {}) {
    try {
      const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
      const clients = await this.modal
        .fine(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      return clients;
    } catch (error) {
      logger.error("Error getting Clients: clientRepository");
      throw error;
    }
  }

  async count(filter = {}) {
    try {
      const count = await this.modal.find(filter);
      return count;
    } catch (error) {
      logger.error("Error getting client count: clientRepository");
    }
  }
}
