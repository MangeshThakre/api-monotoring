import express from "express";
import Container from "../Dependencies/Dependencies.js";
import validateApiKey from "../../../shared/middleware/validateApiKey.js";
import rateLimiter from "express-rate-limit";
import config from "../../../shared/config/index.js";

const ingestRouter = express.Router();

const { ingestController } = Container.controller;

const ingestRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

ingestRouter.use(ingestRateLimiter);

ingestRouter.post("/", validateApiKey, (req, res, next) =>
  ingestController.ingestApiHit(req, res, next)
);

export default ingestRouter;
