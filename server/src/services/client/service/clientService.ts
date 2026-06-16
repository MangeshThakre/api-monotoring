import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";
import { v4 as uuidv4 } from "uuid";
import { IJwtPayload } from "../../../shared/middleware/authenticate.js";
import crypto from "crypto";

import {
  APPLICATION_ROLES,
  isValidClientRole
} from "../../../shared/constant/roles.js";

interface IClientRepository {
  findBySlug(slug: string): Promise<any>;
  create(clientData: any): Promise<any>;
  findById(clientId: string): Promise<any>;
}
interface IApiKeyRepository {
  create(apiKeyData: any): Promise<any>;
  findByClientId(clientId: string): Promise<any>;
  findByKeyValue(keyValue: string): Promise<any>;
}
interface IUserRepository {
  create(userData: any): Promise<any>;
}

export default class ClientService {
  constructor(
    private ClientRepository: IClientRepository,
    private ApiKeyRepository: IApiKeyRepository,
    private UserRepository: IUserRepository
  ) {
    this.ClientRepository = ClientRepository;
    this.ApiKeyRepository = ApiKeyRepository;
    this.UserRepository = UserRepository;
  }

  generateSlug(name: string) {
    return name.toLowerCase();
  }

  canUserAccessClient(user: IJwtPayload, clientId: string) {
    // SUPER_ADMIN can create users for any client.

    if (user.role === APPLICATION_ROLES.SUPER_ADMIN) {
      return true;
    }

    // CLIENT_ADMIN can create users only for their own client.
    return (
      user.role === APPLICATION_ROLES.CLIENT_ADMIN &&
      user.clientId?.toString() === clientId.toString()
    );
  }

  generateApiKey() {
    const prefix = "apims";
    const randomBytes = crypto.randomBytes(20).toString("hex");
    return `${prefix}_${randomBytes}`;
  }

  async createClient(clientData: any, adminUser: IJwtPayload) {
    try {
      const { name, email, description, website } = clientData;
      const slug = this.generateSlug(name);

      const existingClient = await this.ClientRepository.findBySlug(slug);

      if (existingClient) {
        throw new AppError(`client with the ${slug} slug already exist`, 400);
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

  // | Role          | Same client | Other client |
  // | ------------- | ----------- | ------------ |
  // | SUPER_ADMIN   | ✅           | ✅         |
  // | CLIENT_ADMIN  | ✅           | ❌         |
  // | CLIENT_VIEWER | ❌           | ❌         |

  async createClientUser(
    clientId: string,
    newUserData: any,
    admin: IJwtPayload
  ) {
    try {
      if (!this.canUserAccessClient(admin, clientId)) {
        throw new AppError("Access denied", 400);
      }
      const {
        userName,
        email,
        password,
        role = APPLICATION_ROLES.CLIENT_VIEWER
      } = newUserData;

      if (!isValidClientRole(role)) {
        throw new AppError("Invalid role for client user", 400);
      }

      const client = await this.ClientRepository.findById(clientId);
      if (!client) {
        throw new AppError("Client not found", 404);
      }

      // Set permissions based on role
      let permissions = {
        canCreateApiKeys: false,
        canManageUsers: false,
        canViewAnalytics: true,
        canExportData: false
      };

      // If the role is client admin, update permissions accordingly
      if (role === APPLICATION_ROLES.CLIENT_ADMIN) {
        permissions = {
          canCreateApiKeys: true,
          canManageUsers: true,
          canViewAnalytics: true,
          canExportData: true
        };
      }

      const user = await this.UserRepository.create({
        userName,
        email,
        password,
        role,
        clientId,
        permissions
      });

      logger.info("Client user created", {
        clientId,
        userId: user._id,
        role
      });
      return user;
    } catch (error) {
      logger.error("Error creating client user", error);
      throw error;
    }
  }

  async createApiKey(clientId: string, keyData: any, user: IJwtPayload) {
    try {
      const client = await this.ClientRepository.findById(clientId);
      if (!client) {
        throw new AppError("Access denied", 400);
      }

      if (!this.canUserAccessClient(user, clientId)) {
        throw new AppError("Access denied", 400);
      }

      if (
        !(
          user.role === APPLICATION_ROLES.SUPER_ADMIN ||
          user.role === APPLICATION_ROLES.CLIENT_ADMIN
        )
      ) {
        throw new AppError(
          "Access denied, only super admin and client admin can create API key",
          403
        );
      }

      const { name, description, environment = "production" } = keyData;
      const keyId = uuidv4();
      const keyValue = this.generateApiKey();

      const apiKey = await this.ApiKeyRepository.create({
        keyId,
        keyValue,
        clientId,
        name,
        description,
        environment,
        createdBy: user._id
      });

      return apiKey;
    } catch (error) {
      logger.error("Error creating apiKdy", error);
      throw error;
    }
  }

  async getClientApikeys(clientId: string) {
    try {
      const apiKey = await this.ApiKeyRepository.findByClientId(clientId);
      return apiKey;
    } catch (error) {
      logger.error("Error getting apiKeys: clientServiceError", error);
      throw error;
    }
  }

  async getClientByApiKey(apiKey: string) {
    try {
      const apiKeyRecord = await this.ApiKeyRepository.findByKeyValue(apiKey);
      if (!apiKeyRecord) return null;
      if (apiKeyRecord.isExpired()) return null;

      const client = apiKeyRecord.clientId;

      return { client, apiKey: apiKeyRecord };
    } catch (error) {
      logger.error("Error getting client by apiKey: clientServiceError", error);
      throw error;
    }
  }
}
