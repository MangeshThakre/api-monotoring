export default class BaseApiHitRepository {
  constructor(modal) {
    this.modal = modal;
  }

  async save(data) {
    throw new Error("Method not implemented: save");
  }

  async find() {
    throw new Error("Method not implemented: find");
  }

  async count() {
    throw new Error("Method not implemented: count");
  }
  async deleteOldHits() {
    throw new Error("Method not implemented: deleteOldHits");
  }
}
