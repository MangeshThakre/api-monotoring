import { Model } from "mongoose";
import { IClient } from "../../../shared/models/Client.js";

export default class BaseClientRepository {
  constructor(protected model: Model<any>) {
    this.model = model;
  }

  async create(clientData: Partial<IClient>) {
    throw new Error("method not implemented");
  }

  async findById(ClientId: string) {
    throw new Error("Method not implemented");
  }

  async findBySlug(slug: string) {
    throw new Error("Method not implemented");
  }
}
