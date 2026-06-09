import express from "express";
import dependencies from "../dependencies/Dependencies.js";
import authenticate from "../../../shared/middleware/authenticate.js";

const AnalyticsRouter = express.Router();
const { controller } = dependencies;
const AnalyticsController = controller.AnalyticsController;

AnalyticsRouter.get("/stats", authenticate, (req, res, next) =>
  AnalyticsController.getOverAllStatics(req, res, next)
);

AnalyticsRouter.get("/dashboard", authenticate, (req, res, next) =>
  AnalyticsController.getDashboard(req, res, next)
);

export default AnalyticsRouter;
