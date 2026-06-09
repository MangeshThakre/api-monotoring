import logger from "../../../shared/config/logger.js";
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js";

export default class AuthController {
  constructor(authService) {
    if (!authService) {
      throw new error("authService is required");
    }
    this.authService = authService;
  }

  async onboardSuperAdmin(req, res, next) {
    try {
      const { userName, email, password } = req.body;
      const superAdminData = { userName, email, password, role: "super_admin" };
      const { user, token } =
        await this.authService.onboardSuperAdmin(superAdminData);

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
      });
      return res
        .status(200)
        .json(
          ResponseFormatter.success(
            user,
            "superAdmin onboarded successfully",
            200
          )
        );
    } catch (error) {
      logger.error("error onboarding superAdmin", error);
      next(error);
    }
  }

  async registration(req, res, next) {
    try {
      const { userName, email, password, role } = req.body;

      const { user, token } = await this.authService.registration({
        userName,
        email,
        password,
        role
      });

      req.cookie("authToken", token, {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
      });
      return res
        .status(200)
        .json(
          ResponseFormatter.success(user, "user Registered successfully", 200)
        );
    } catch (error) {
      logger.error("Error Registering user", error);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const { user, token } = await this.authService.login({ email, password });

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
      });

      return res
        .status(200)
        .json(ResponseFormatter.success(user, "login successfully", 200));
    } catch (error) {
      logger.error("Error login user: authController:", error);
      next(error);
    }
  }

  async getUser(req, res, next) {
    try {
      const { _id } = req.user;
      const user = await this.authService.getUser(_id);
      return res
        .status(200)
        .json(ResponseFormatter.success(user, "Got user data successfully"));
    } catch (error) {
      logger.error("Error Getting User: authController:", error);
      next(error);
    }
  }
  async logOut(req, res, next) {
    try {
      res.clearCookie("authToken");
      return res
        .status(200)
        .json(ResponseFormatter.success("logged out successfully", 200));
    } catch (error) {
      logger.error("Error during logout :authController:", error);
      next(error);
    }
  }
}
