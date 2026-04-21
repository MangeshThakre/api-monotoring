import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/appError.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

import {
  APPLICATION_ROLES,
  isValidClientRole
} from "../../../shared/constant/roles.js";
import { create } from "domain";

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

  canUserAccessClient(user, clientId) {
    if (user.role === APPLICATION_ROLES.SUPER_ADMIN) {
      return true;
    }
    return user.clientId && user.clientId.toString() === clientId.toString();
  }

  generateApiKey() {
    const prefix = "apims";
    const randomBytes = crypto.randomBytes(20);
    return `${prefix}-${randomBytes}`;
  }

  async createClient(clientData, adminUser) {
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

  async createClientUser(clientId, userData, admin) {
    try {
      if (!this.canUserAccessClient(admin, clientId)) {
        throw new AppError("Access denied", 400);
      }
      const {
        userName,
        email,
        password,
        role = APPLICATION_ROLES.CLIENT_VIEWER
      } = userData;

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

  async createApiKey(clientId, keyData, user) {
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
}
