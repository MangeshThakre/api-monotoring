import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/appError.js";

export default class ClientService {
  constructor(ClientRepository, ApiKeyRepository, UserRepository) {
    if (!ClientRepository) throw new Error("clientRepository required");
    if (!ApiKeyRepository) throw new Error("apiKeyRepository required");
    if (!UserRepository) throw new Error("UserRepository required");

    this.ClientRepository = ClientRepository;
    this.ApiKeyRepository = ApiKeyRepository;
    this.UserRepository = UserRepository;
  }

  generateSlug(name) {
    return name.toLowerCase();
  }

  async createClient(clientData, adminUser) {
    try {
      const { name, email, description, website } = clientData;
      const slug = this.generateSlug(name);

      const existingClient = await this.ClientRepository.findBySlug(slug);

      if (existingClient) {
        throw new Error(`client with the ${slug} slug already exist`, 400);
      }

      const client = await this.ClientRepository.create({
        name,
        email,
        slug,
        description,
        website,
        createdBy: adminUser._id
      });

      logger.info("client Created successfully");
      return client;
    } catch (error) {
      logger.error("Error creating client: clientService:", error);
      throw error;
    }
  }
}
