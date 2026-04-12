export default class BaseClientRepository {
  constructor(modal) {
    this.modal = modal;
  }

  async create(clientData) {
    throw new Error("method not implemented");
  }

  async findById(ClientId) {
    throw new Error("Method not implemented");
  }

  async findBySlug(slug) {
    throw new Error("Method not implemented");
  }
}
