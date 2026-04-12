export default class ClientService {
  constructor(ClientRepository, ApiKeyRepository) {
    if (!ClientRepository) throw new Error("clientRepository required");
    if (!ApiKeyRepository) throw new Error("apiKeyRepository required");

    this.ClientRepository = ClientRepository;
    this.ApiKeyRepository = ApiKeyRepository;
  }
}
