import logger from "../../../shared/config/logger.js";
import Client, { IClient } from "../../../shared/models/Client.js";
import BaseClientRepository from "./BaseClientRepository.js";

export default class MongoClientRepository extends BaseClientRepository {
  constructor() {
    super(Client);
  }

  async create(clientData: Partial<IClient>) {
    try {
      const client = new this.model(clientData);
      await client.save();
      logger.info("Client created successfully: clientRepository");
      return await client.populate("createdBy", "-password");
    } catch (error) {
      logger.error("Error Creating Client:clientRepository:", error);
      throw error;
    }
  }

  async findById(clientId: string) {
    try {
      const client = await this.model.findById(clientId);
      if (!client) logger.info("Invalid Id: clientRepository");
      return client;
    } catch (error) {
      logger.error("Error getting Client by Id:clientRepository", error);
      throw error;
    }
  }

  async findBySlug(slug: string) {
    try {
      const client = await this.model.findOne({ slug: slug });
      return client;
    } catch (error) {
      logger.error("Error getting Client by slug:clientRepository", error);
      throw error;
    }
  }

  async find(
    filter = {},
    options = { limit: 50, skip: 0, sort: { createdAt: -1 } }
  ) {
    try {
      const { limit, skip, sort } = options;
      const clients = await this.model
        .find(filter)
        .sort(sort as any)
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
      const count = await this.model.countDocuments(filter);
      return count;
    } catch (error) {
      logger.error("Error getting client count: clientRepository");
    }
  }
}
