import logger from "../../../shared/config/logger.js";
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js";
class IngestController {
  constructor(IngestService) {
    if (!IngestService) throw new Error("IngestService is required");

    this.IngestService = IngestService;
  }

  async ingestApiHit(req, res, next) {
    try {
      const hitData = {
        ...req.body,
        clientId: req.client._id,
        apiKeyId: req.apiKey._id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"] || ""
      };

      const result = await this.IngestService.ingestApiHit(hitData);
      res.status(201).json(ResponseFormatter.success(result));
    } catch (error) {
      logger.error("Error in IngestController.ingestApiHit:", error);
      console.log(error);
      res
        .status(400)
        .json(ResponseFormatter.error(error.message, error.statusCode || 500));
    }
  }
}

export default IngestController;
