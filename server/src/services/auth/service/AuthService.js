import logger from "../../../shared/config/logger";
import bcrypt from "bcryptjs";
import config from "../../../shared/config";
import jwt from "jsonwebtoken";
import AppError from "../../../shared/utils/appError.js";

export default class AuthService {
  constructor(userRepository) {
    if (!userRepository) {
      throw new Error("UserRepository is required");
    }
  }

  generateToken(user) {
    const { _id, email, userName, role, clientId } = user;
    const payload = {
      userId: _id,
      email,
      userName,
      role,
      clientId
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
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
      const token = this.generateToken(superAdmin);

      logger.info("Admin onboarded successfully", {
        userName: user.userName
      });
      return {
        user,
        token
      };
    } catch (error) {
      logger.error("Error in onboarding superAdmin", error);
      throw error;
    }
  }
}
