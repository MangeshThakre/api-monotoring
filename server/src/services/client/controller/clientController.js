import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/appError.js";
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js";

export default class ClientController {
  constructor(ClientService, AuthService) {
    if (!ClientService) throw new Error("clientService Required");
    if (!AuthService) throw new Error("authService required");

    this.ClientService = ClientService;
    this.AuthService = AuthService;
  }

  async createClient(req, res, next) {
    try {
      const adminUser = req.user;
      const isSuperAdmin = await this.AuthService.checkSuperAdminPermission(
        adminUser._id
      );
      if (!isSuperAdmin) {
        throw new AppError("access denied", 400);
      }
      const client = await this.ClientService.createClient(req.body, adminUser);
      return res
        .status(201)
        .json(
          ResponseFormatter.success(client, "client created successfully", 201)
        );
    } catch (error) {
      logger.error("Error creating client : clientController", error);
      res
        .status(400)
        .json(ResponseFormatter.error(error.message, error.statusCode));
    }
  }

  async createClientUser(req, res, next) {
    try {
      const { clientId } = req.params;
      const user = await this.ClientService.createClientUser(
        clientId,
        req.body,
        req.user
      );

      return res
        .status(200)
        .json(
          ResponseFormatter.success(user, "client created successfully", 201)
        );
    } catch (error) {
      logger.error("Error creating client user : clientController", error);
      res
        .status(400)
        .json(ResponseFormatter.error(error.message, error.statusCode));
    }
  }

  async createApiKey(req, res, next) {
    try {
      const { clientId } = req.params;
      const apiKey = await this.ClientService.createApiKey(
        clientId,
        req.body,
        req.user
      );
      return res
        .status(200)
        .json(
          ResponseFormatter.success(apiKey, "apikay created successfully", 201)
        );
    } catch (error) {
      logger.error("Error creating apiKeys :  clientController", error);
      res
        .status(400)
        .json(ResponseFormatter.error(error.message, error.statusCode));
    }
  }
}
