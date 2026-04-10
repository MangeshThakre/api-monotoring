import logger from "../../../shared/config/logger";
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js";

export default class AuthController {
  controller(authService) {
    if (!authService) {
      throw new error("authService is required");
    }
    this.authService = authService;
  }

  async onboardSuperAdmin(req, res, next) {
    try {
      const { userName, email, password } = user;
      const superAdminData = { userName, email, password, role: "super_admin" };
      const { user, token } = await this.authService(superAdminData);

      res.cookie("authToken", {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
      });
      return res
        .status(200)
        .json(
          ResponseFormatter.success(superAdmin),
          "superAdmin onboarded successfully",
          201
        );
    } catch (error) {
      logger.error("error onboarding superAdmin", error);
      next(error);
    }
  }
}
