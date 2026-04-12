import express from "express";
import { Controller } from "../Dependencies";

const clientRouter = express.Router();

const ClientController = Controller.ClientController;

export default clientRouter;
