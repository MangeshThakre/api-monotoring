import * as express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        userName: string;
        role: string;
        clientId?: string;
      };
    }
  }
}
