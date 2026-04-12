import BaseRepository from "./baseRepository.js";
import User from "../../../shared/models/User.js";
import logger from "../../../shared/config/logger.js";

class MongoUserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async create(userData) {
    try {
      let data = { ...userData };
      if ((data.role === "super_admin") & !data.permissions) {
        data.permissions = {
          canManageUsers: true,
          canCreateApiKeys: true,
          canViewAnalytics: true,
          canExportData: true
        };
      }
      const user = new this.modal(data);
      await user.save();
      logger.info("user create successfully..");
      return user;
    } catch (error) {
      logger.error("Error creating user", error);
      throw error;
    }
  }

  async findById(userId) {
    try {
      const user = await this.modal.findById(userId);
      return user;
    } catch (error) {
      logger.error("Error getting user");
      throw error;
    }
  }

  async findByUserName(userName) {
    try {
      const user = await this.modal.findOne({ userName: userName });
      return user;
    } catch (error) {
      logger.error("Error getting User", error);
    }
  }

  async findByEmail(userEmail) {
    try {
      const user = await this.modal.findOne({ email: userEmail });
      return user;
    } catch (error) {
      logger.error("Error getting User", error);
      throw error;
    }
  }

  async findAll() {
    try {
      const user = await this.modal
        .find({ isActive: true })
        .select("-password");
      return user;
    } catch (error) {
      logger.error("Error getting users", error);
      throw error;
    }
  }
}

export default MongoUserRepository;
