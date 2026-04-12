import express from "express";
import validate from "../../../shared/middleware/validate.js";
import authenticate from "../../../shared/middleware/authenticate.js";
import dependencies from "../Dependencies/dependencies.js";
import {
  onboardSuperAdminSchema,
  registrationSchema,
  loginSchema
} from "../validation/authSchema.js";

const authRouter = express.Router();

const { controller } = dependencies;
const authController = controller.authController;

// onboard super admin
authRouter.post(
  "/onboard-super-admin",
  validate(onboardSuperAdminSchema),
  (req, res, next) => authController.onboardSuperAdmin(req, res, next)
);

// register
authRouter.post(
  "/register",
  authenticate,
  validate(registrationSchema),

  (req, res, next) => authController.registration(req, res, next)
);

// login user
authRouter.get("/login", validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

// get user
authRouter.get("/get-user", authenticate, (req, res, next) =>
  authController.getUser(req, res, next)
);

// logout
authRouter.get("/logout", authenticate, (req, res, next) =>
  authController.logOut(req, res, next)
);

export default authRouter;
