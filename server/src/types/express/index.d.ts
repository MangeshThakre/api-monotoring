import * as express from "express";
import { IClient } from "../../shared/models/Client.js";
import { IApiKey } from "../../shared/models/ApiKey.js";

declare global {
  namespace Express {
    interface Request {
      // payload of jwt
      user?: {
        _id: string;
        email: string;
        userName: string;
        role: string;
        clientId?: string;
      };
      // for ingest middleware validApikeys
      clientId: string;
      clientName: stringL;
      apiKeyId: string;
    }
  }
}
