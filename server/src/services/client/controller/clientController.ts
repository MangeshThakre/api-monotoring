import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js";
import { Request, Response, NextFunction } from "express";

interface IClientService {
  createClient(clientData: any, adminUser: any): Promise<any>;
  createClientUser(
    clientId: string,
    userData: any,
    adminUser: any
  ): Promise<any>;
  createApiKey(clientId: string, apiKeyData: any, adminUser: any): Promise<any>;
  getClientApikeys(clientId: string): Promise<any>;
}

interface IAuthService {
  checkSuperAdminPermission(userId: string): Promise<boolean>;
}

interface IParams {
  clientId: string;
}

export default class ClientController {
  constructor(
    private ClientService: IClientService,
    private AuthService: IAuthService
  ) {
    if (!ClientService) throw new Error("clientService Required");
    if (!AuthService) throw new Error("authService required");
  }

  async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = req.user;

      if (!adminUser) {
        throw new AppError("Unauthorized", 401);
      }

      const isSuperAdmin = await this.AuthService.checkSuperAdminPermission(
        adminUser._id
      );
      if (!isSuperAdmin) {
        throw new AppError("access denied", 403);
      }
      const client = await this.ClientService.createClient(req.body, adminUser);
      return res
        .status(201)
        .json(
          ResponseFormatter.success(client, "client created successfully", 201)
        );
    } catch (error: any) {
      logger.error("Error creating client : clientController", error);
      res
        .status(400)
        .json(ResponseFormatter.error(error.message, error.statusCode));
    }
  }

  // SUPER_ADMIN can create users for any client.
  // CLIENT_ADMIN can create users only for their own client.
  async createClientUser(
    req: Request<IParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { clientId } = req.params as IParams;
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
    } catch (error: any) {
      logger.error("Error creating client user : clientController", error);
      res
        .status(400)
        .json(ResponseFormatter.error(error.message, error.statusCode));
    }
  }

  async createApiKey(req: Request<IParams>, res: Response, next: NextFunction) {
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
          ResponseFormatter.success(apiKey, "apiKey created successfully", 201)
        );
    } catch (error: any) {
      logger.error("Error creating apiKeys :  clientController", error);
      res
        .status(400)
        .json(ResponseFormatter.error(error.message, error.statusCode));
    }
  }

  async getClientApiKeys(
    req: Request<IParams>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { clientId } = req.params;
      const apiKeys = await this.ClientService.getClientApikeys(clientId);
      return res
        .status(200)
        .json(ResponseFormatter.success(apiKeys, "Successfully get api keys"));
    } catch (error: any) {
      logger.error("Error getting ApiKeys: clientController", error);
      res
        .status(400)
        .json(ResponseFormatter.error(error.message, error.statusCode));
    }
  }
}
