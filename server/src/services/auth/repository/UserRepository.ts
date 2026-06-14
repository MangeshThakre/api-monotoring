import BaseRepository from "./baseRepository.js";
import logger from "../../../shared/config/logger.js";
import User, { IUser } from "../../../shared/models/User.js";

interface IUserRepository {
  create(userData: any): Promise<any>;
  findById(userId: string): Promise<any>;
  findByUserName(userName: string): Promise<any>;
  findByEmail(userEmail: string): Promise<any>;
  findAll(): Promise<any>;
}

class MongoUserRepository extends BaseRepository implements IUserRepository {
  constructor() {
    super(User);
  }

  async create(userData: Partial<IUser>) {
    try {
      let data = { ...userData };
      if (data.role === "super_admin" && !data.permissions) {
        data.permissions = {
          canManageUsers: true,
          canCreateApiKeys: true,
          canViewAnalytics: true,
          canExportData: true
        };
      }
      const user = new this.model(data);
      await user.save();
      logger.info("user create successfully..");
      return user;
    } catch (error) {
      logger.error("Error creating user", error);
      throw error;
    }
  }

  async findById(userId: string) {
    try {
      const user = await this.model.findById(userId);
      return user;
    } catch (error) {
      logger.error("Error getting user");
      throw error;
    }
  }

  async findByUserName(userName: string) {
    try {
      const user = await this.model.findOne({ userName: userName });
      return user;
    } catch (error) {
      logger.error("Error getting User", error);
    }
  }

  async findByEmail(userEmail: string) {
    try {
      const user = await this.model.findOne({ email: userEmail });
      return user;
    } catch (error) {
      logger.error("Error getting User", error);
      throw error;
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const user = await this.model
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
