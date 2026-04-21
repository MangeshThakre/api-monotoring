import logger from "../../../shared/config/logger.js";
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
      const isSuperAdmin = await this.AuthService.checkSuperAdminPermission;
      if (!isSuperAdmin) {
        return res
          .status(400)
          .json(ResponseFormatter.error("Access denied", 403));
      }
      const client = await this.ClientService.createClient(req.body, adminUser);
      return res
        .status(200)
        .json(
          ResponseFormatter.success(client, "client created successfully", 200)
        );
    } catch (error) {
      logger.error("Error creating client : clientController", error);
      res
        .status(400)
        .json(ResponseFormatter.error("Error creating client", error));
    }
  }
}
