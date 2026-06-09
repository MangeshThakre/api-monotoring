export default class BaseApiKeyRepository {
  constructor(modal) {
    this.modal = modal;
  }

  async create(apiKeyData) {
    throw new Error("method not implemented");
  }

  async findByKeyValue(keyValue) {
    throw new Error("Method not Implemented");
  }

  async findByClientId(clientId) {
    throw new Error("Method not Implemented");
  }
  async countByClientId(clientId, filters) {
    throw new Error1("Method not Implemented");
  }
}
