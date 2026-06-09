import ClientController from "../controller/clientController.js";
import ClientService from "../service/clientService.js";
import MongoClientRepository from "../repository/ClientRepository.js";
import ApiKeyRepository from "../repository/ApiKeyRepository.js";
import UserRepository from "../../auth/repository/UserRepository.js";
import AuthContainer from "../../auth/Dependencies/dependencies.js";

class Container {
  static init() {
    const repository = {
      ClientRepository: new MongoClientRepository(),
      ApiKeyRepository: new ApiKeyRepository(),
      userRepository: new UserRepository()
    };

    const service = {
      clientService: new ClientService(
        repository.ClientRepository,
        repository.ApiKeyRepository,
        repository.userRepository
      )
    };

    const controller = {
      clientController: new ClientController(
        service.clientService,
        AuthContainer.services.authService
      )
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
