import logger from "../../../shared/config/logger.js";
import ResponseFormatter from "../../../shared/utils/ResponseFormatter.js";
import { Request, Response, NextFunction } from "express";
import { IApiHit } from "../../../shared/models/ApiHits.js";

interface IIngestService {
  ingestApiHit(hitData: Partial<IApiHit>): any;
}

class IngestController {
  constructor(private IngestService: IIngestService) {
    if (!IngestService) throw new Error("IngestService is required");
  }

  async ingestApiHit(req: Request, res: Response, next: NextFunction) {
    try {
      const hitData: Partial<IApiHit> = {
        ...req.body,
        clientId: req.clientId,
        apiKeyId: req.apiKeyId,
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"] || ""
      };

      const result = await this.IngestService.ingestApiHit(hitData);

      res.status(201).json(ResponseFormatter.success(result));
    } catch (error: any) {
      logger.error("Error in IngestController.ingestApiHit:", error);
      console.log("error", error);
      res
        .status(400)
        .json(ResponseFormatter.error(error.message, error.statusCode || 500));
    }
  }
}

export default IngestController;
