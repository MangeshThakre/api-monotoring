import logger from "../../../shared/config/logger.js";
import config from "../../../shared/config/index.js";
import jwt from "jsonwebtoken";
import AppError from "../../../shared/utils/appError.js";
import bcrypt from "bcrypt";

export default class AuthService {
  constructor(userRepository) {
    if (!userRepository) {
      throw new Error("UserRepository is required");
    }
    this.userRepository = userRepository;
  }

  // generate jwt token
  generateToken(user) {
    const { _id, email, userName, role, clientId } = user;
    const payload = {
      _id,
      email,
      userName,
      role,
      clientId
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }
  //compare password
  comparePassword(userEnteredPassword, hashedPassword) {
    return bcrypt.compare(userEnteredPassword, hashedPassword);
  }

  async onboardSuperAdmin(superAdmin) {
    try {
      const existingUser = await this.userRepository.findAll();
      // first person to login in the app = "superAdmin"
      if (existingUser && existingUser.length > 0) {
        throw new AppError("superAdmin onboarding is disabled", 403);
      }
      // this is the first person added in the DB "superAdmin"
      const user = await this.userRepository.create(superAdmin);

      const token = this.generateToken(user);

      logger.info("Admin onboarded successfully", {
        userName: user.userName
      });
      return { user, token };
    } catch (error) {
      logger.error("Error in onboarding superAdmin authService", error);
      throw error;
    }
  }

  async registration(userData) {
    try {
      const permissions = {
        canManageUsers: false,
        canCreateApiKeys: false,
        canViewAnalytics: false,
        canExportData: false
      };
      const user = await this.userRepository.create({
        ...userData,
        permissions
      });

      const token = this.generateToken(user);
      logger.info("user registered successfully", { userName: user.userName });

      return { user, token };
    } catch (error) {
      logger.error("Error registering user", error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      const user = await this.userRepository.findByEmail(credentials.email);
      if (!user) {
        throw new Error("Invalid credentials", 400);
      }
      if (!user.isActive) {
        throw new Error("Account is deactivated", 400);
      }
      const isMatch = await this.comparePassword(
        credentials.password,
        user.password
      );

      if (!isMatch) {
        throw new Error("Invalid credentials", 400);
      }
      const token = this.generateToken(user);
      logger.info("user Login successfully : authService");

      return { user, token };
    } catch (error) {
      logger.error("Error in login :authService", error);
      throw error;
    }
  }

  async getUser(id) {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new AppError("invalid user ID", 400);
      }
      logger.info("User got successfully :authService");
      return user;
    } catch (error) {
      logger.error("Error Getting user: authService:", error);
      throw error;
    }
  }
}
