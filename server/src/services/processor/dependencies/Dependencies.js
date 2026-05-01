import logger from "../../../shared/config/logger.js";
import postgres from "../../../shared/config/postgres.js";
import ApiHit from "../../../shared/models/ApiHits.js";
import ApiHitRepository from "../repository/ApiHitRepository.js";
import MetricsRepository from "../repository/MetricsRepository.js";
import ProcessorService from "../service/ProcessorService.js";

class Container {
  static init() {
    const repository = {
      ApiHitRepository: new ApiHitRepository({ modal: ApiHit, logger }),
      MetricsRepository: new MetricsRepository({ logger, postgres })
    };

    const service = {
      ProcessorService: new ProcessorService({
        ApiHitRepository: repository.ApiHitRepository,
        MetricsRepository: repository.MetricsRepository
      })
    };

    return { repository, service };
  }
}

const initialize = Container.init();
export default initialize;
export { Container };
