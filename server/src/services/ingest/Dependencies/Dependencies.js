import IngestController from "../controller/IngestController.js";
import IngestService from "../service/IngestService.js";
import eventProducerFactory from "../../../shared/events/producer/eventProducerFactory.js";

class Container {
  static init() {
    const eventProducer = eventProducerFactory();

    const service = {
      ingestService: new IngestService(eventProducer)
    };

    const controller = {
      ingestController: new IngestController(service.ingestService)
    };

    return {
      service,
      controller
    };
  }
}

const initialize = Container.init();

export { Container };
export default initialize;
