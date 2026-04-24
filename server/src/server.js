import express from "express";
import config from "./shared/config/index.js";
import logger from "./shared/config/logger.js";
import helmet from "helmet";
import cors from "cors";
import MongoConnection from "./shared/config/mongoDb.js";
import PostgresConnection from "./shared/config/postgres.js";
import RabbitMQConnection from "./shared/config/rabbitmq.js";
import errorHandler from "./shared/middleware/errorHandler.js";
import ResponseFormatter from "./shared/utils/ResponseFormatter.js";
import cookieParser from "cookie-parser";
//router
import authRouter from "./services/auth/router/authRouter.js";
import clientRouter from "./services/client/router/clientRouter.js";
import ingestRouter from "./services/ingest/router/ingestRouter.js";
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.use(cors({ credentials: true }));

app.use(cookieParser());

// logger middleware for incoming requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.header["user-agent"]
  });
  next();
});

// health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json(
    ResponseFormatter.success({
      status: "healthy ",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  );
});

app.use("/api/auth/", authRouter);
app.use("/api/hit", ingestRouter);
app.use("/api", clientRouter);
// 404 handler
app.use((req, res) => {
  res.status(404).json(ResponseFormatter.error("Endpoint not found", 404));
});

async function initializeConnections() {
  logger.info("Initializing database and message queue connections...");
  try {
    await MongoConnection.connect(); // Connect to MongoDB
    await PostgresConnection.testConnection(); // Test PostgreSQL connection
    await RabbitMQConnection.connect(); // Connect to RabbitMQ
    logger.info("All connections initialized successfully");
  } catch (error) {
    logger.error("Error initializing connections", { error: error.message });
  }
}

async function startServer() {
  try {
    await initializeConnections();
    app.listen(config.PORT, () => {
      logger.info(`Server is running on port ${config.PORT}`);
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          await MongoConnection.disconnect();
          await PostgresConnection.close();
          await RabbitMQConnection.close();
          logger.info("All connections closed, exiting process");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error("Forced shutdown");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", {
        promise: promise,
        "reason:": reason
      });
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.error("Error starting server", { error: error.message });
  }
}

startServer();

app.use(errorHandler);
