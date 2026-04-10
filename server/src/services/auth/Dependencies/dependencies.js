import AuthController from "../controller/authController.js";
import AuthServer from "../service/AuthService.js";
import MongoUserRepository from "../repository/UserRepository.js";

class Container {
  static init() {
    repositories = {
      userRepository: MongoUserRepository
    };

    services = {
      authService: new AuthServer(repositories.userRepository)
    };

    controller = {
      authController: new AuthController(services.authService)
    };
    return {
      controller,
      services,
      repositories
    };
  }
}

const initialized = Container.init();

export { Container };
export default initialized;
