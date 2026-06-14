import { Model, Document } from "mongoose";
// interface

class BaseRepository {
  constructor(protected model: Model<any>) {
    this.model = model;
  }

  async create(data: any) {
    throw new Error("method not implemented");
  }

  async findById(id: string) {
    throw new Error("method not implemented");
  }

  async findByUserName(userName: string) {
    throw new Error("method not implemented");
  }

  async findByEmail(Email: string) {
    throw new Error("method not implemented");
  }

  async findAll(): Promise<any[]> {
    throw new Error("method not implemented");
  }
}

export default BaseRepository;
