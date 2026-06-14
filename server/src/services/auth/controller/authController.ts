import logger from "../../../shared/config/logger.js";
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js";
import { Request, Response, NextFunction } from "express";
import { IUser } from "../../../shared/models/User.js";

interface IAuthService {
  onboardSuperAdmin(superAdmin: any): Promise<{ user: any; token: string }>;
  registration(userData: any): Promise<{ user: any; token: string }>;
  login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: any; token: string }>;
  getUser(id: string): Promise<any>;
  logOut(): Promise<void>;
}

export default class AuthController {
  constructor(private authService: IAuthService) {
    if (!authService) {
      throw new Error("authService is required");
    }
  }

  async onboardSuperAdmin(req: Request, res: Response, next: NextFunction) {
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

  async registration(req: Request, res: Response, next: NextFunction) {
    try {
      const { userName, email, password, role } = req.body;

      const { user, token } = await this.authService.registration({
        userName,
        email,
        password,
        role
      });

      res.cookie("authToken", token, {
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

  async login(req: Request, res: Response, next: NextFunction) {
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

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { _id } = req.user as any; // Assuming req.user is populated by the authenticate middleware
      const user = await this.authService.getUser(_id);
      return res
        .status(200)
        .json(
          ResponseFormatter.success(user, "Got user data successfully", 200)
        );
    } catch (error) {
      logger.error("Error Getting User: authController:", error);
      next(error);
    }
  }
  async logOut(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie("authToken");
      return res
        .status(200)
        .json(ResponseFormatter.success("", "logged out successfully", 200));
    } catch (error) {
      logger.error("Error during logout :authController:", error);
      next(error);
    }
  }
}
