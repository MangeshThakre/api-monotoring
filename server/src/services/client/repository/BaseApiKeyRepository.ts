import { Model } from "mongoose";
import { IApiKey } from "../../../shared/models/ApiKey.js";

export default class BaseApiKeyRepository {
  constructor(protected model: Model<any>) {
    this.model = model;
  }

  async create(apiKeyData: Partial<IApiKey>) {
    throw new Error("method not implemented");
  }

  async findByKeyValue(keyValue: string, includeInActive: boolean = false) {
    throw new Error("Method not Implemented");
  }

  async findByClientId(clientId: string): Promise<IApiKey[]> {
    throw new Error("Method not Implemented");
  }
  async countByClientId(clientId: string, filters: any) {
    throw new Error("Method not Implemented");
  }
}
