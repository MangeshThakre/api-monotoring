import ResponseFormatter from "../utils/ResponseFormatter.js";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import logger from "../config/logger.js";
import { Request, Response, NextFunction } from "express";

export interface IJwtPayload {
  _id: string;
  email: string;
  userName: string;
  role: string;
  clientId?: string;
}

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    if (!token) {
      return res
        .status(400)
        .json(ResponseFormatter.error("Token is Required", 401));
    }

    const payload = jwt.verify(token, config.jwt.secret) as IJwtPayload;

    const { _id, email, role, userName, clientId } = payload;
    req.user = { _id, email, role, userName, clientId };
    next();
  } catch (error: any) {
    logger.error("Invalid token", { error: error.message, path: req.path });
    return res.status(401).json(ResponseFormatter.error("Invalid Token"));
  }
};

export default authenticate;
