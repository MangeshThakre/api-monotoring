// global level configuration for the app
import dotenv from "dotenv";
dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,

  //   mongoDB:
  mongo: {
    uri: process.env.MONGO_DB_URL || "mongodb://localhost:27017/api-monitoring",
    dbName: process.env.MONGO_DB_NAME || "api-monitoring"
  },
  // postgres
  postgres: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || "api_monitoring",
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "password"
  },

  // rabbitmq
  rabbitmq: {
    url:
      process.env.RABBITMQ_URL ||
      "amqp://admin:admin123@localhost:5672/api_monitoring",
    queue: process.env.RABBITMQ_QUEUE || "api_monitoring_queue",
    publisherConfirms:
      process.env.RABBITMQ_PUBLISHER_CONFIRM === "true" || false,
    retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS) || 5,
    retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY) || 1000
  },

  // jwt
  jwt: {
    secret: process.env.JWT_SECRET || "secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h"
  },

  //   ratelimiter
  ratelimiter: {
    windowMs: parseInt(process.env.RATE_LIMITER_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMITER_MAX) || 1000 // limit each IP to 1000 requests per windowMs
  }
};

export default config;
