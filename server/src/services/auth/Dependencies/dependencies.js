import AuthController from "../controller/authController.js";
import AuthServer from "../service/AuthService.js";
import MongoUserRepository from "../repository/UserRepository.js";

class Container {
  static init() {
    const repositories = {
      userRepository: new MongoUserRepository()
    };

    const services = {
      authService: new AuthServer(repositories.userRepository)
    };

    const controller = {
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
