import { IApiHit } from "../../../shared/models/ApiHits.js";

export default class BaseApiHitRepository {
  constructor(protected model: any) {
    this.model = model;
  }

  async save(data: Partial<IApiHit>) {
    throw new Error("Method not implemented: save");
  }

  async find(): Promise<IApiHit> {
    throw new Error("Method not implemented: find");
  }

  async count(): Promise<number> {
    throw new Error("Method not implemented: count");
  }
  async deleteOldHits(beforeDate: Date): Promise<Number> {
    throw new Error("Method not implemented: deleteOldHits");
  }
}
