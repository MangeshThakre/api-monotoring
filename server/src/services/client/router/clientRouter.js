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

export default clientRouter;
