import winston from "winston";
import config from "./index.js";


/**
 * winston logger configuration
 */
const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug", // Set log level based on environment
  format: winston.format.json(),
  defaultMeta: { service: "api-monitoring" },
  transports: [
    //
    // - Write all logs with importance level of `error` or higher to `error.log`
    //   (i.e., error, fatal, but not other levels)
    //
    new winston.transports.File({ filename: "error.log", level: "error" }),
    //
    // - Write all logs with importance level of `info` or higher to `combined.log`
    //   (i.e., fatal, error, warn, and info, but not trace)
    //
    new winston.transports.File({ filename: "combined.log" })
  ]
});

if (config.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}
