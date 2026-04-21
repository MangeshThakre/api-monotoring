import express from "express";
import Dependencies from "../Dependencies/Dependencies.js";
import authenticate from "../../../shared/middleware/authenticate.js";
const clientRouter = express.Router();
const { controller } = Dependencies;
const clientController = controller.clientController;

clientRouter.use(authenticate); // no need to add in each router

clientRouter.post("/admin/client/onboard", (req, res, next) =>
  clientController.createClient(req, res, next)
);

clientRouter.post("/admin/client/:clientId/users", (req, res, next) =>
  clientController.createClientUser(req, res, next)
);

clientRouter.post("/admin/client/:clientId/api/key", (req, res, next) => {
  clientController.createApiKey(req, res, next);
});

clientRouter.get("/admin/client/:clientId/api/key", (req, res, next) => {
  clientController.getClientApiKeys(req, res, next);
});

export default clientRouter;
