import ClientController from "../controller/clientController.js";
import ClientService from "../service/clientService.js";
import MongoClientRepository from "../repository/ClientRepository.js";
import ApiKeyRepository from "../repository/ApiKeyRepository.js";

class Container {
  static init() {
    const repository = {
      baseClientRepository: new MongoClientRepository(),
      baseApiKeyRepository: new ApiKeyRepository()
    };

    const service = {
      clientService: new ClientService(
        repository.baseClientRepository,
        repository.baseApiKeyRepository
      )
    };

    const controller = {
      clientController: new ClientController(service.clientService)
    };
    return {
      repository,
      service,
      controller
    };
  }
}

const initialized = Container.init();
export { Container };
export default initialized;
