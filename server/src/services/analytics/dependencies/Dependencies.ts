import ProcessorContainer from "../../processor/dependencies/Dependencies.js";
import AuthContainer from "../../auth/Dependencies/dependencies.js";
import ClientRepository from "../../client/repository/ClientRepository.js";
import AnalyticsService from "../service/AnalyticsService.js";
import AnalyticsController from "../controller/AnalyticsController.js";

class Container {
  static init() {
    const repository = {
      ClientRepository: new ClientRepository(),
      MetricsRepository: ProcessorContainer.repository.MetricsRepository
    };

    const services = {
      AnalyticsService: new AnalyticsService(repository.MetricsRepository),
      AuthService: AuthContainer.services && AuthContainer.services.authService
    };

    const controller = {
      AnalyticsController: new AnalyticsController({
        AnalyticsService: services.AnalyticsService,
        AuthService: services.AuthService,
        ClientRepository: repository.ClientRepository
      })
    };
    return {
      repository,
      services,
      controller
    };
  }
}

const initialized = Container.init();
export default initialized;
export { Container };
