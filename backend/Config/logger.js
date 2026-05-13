const winston = require("winston");
const config = require("./index");

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${stack || message}`;
  if (Object.keys(meta).length > 0) {
    log += `\n${JSON.stringify(meta, null, 2)}`;
  }
  return log;
});

const logger = winston.createLogger({
  level: config.isDev ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
  ),
  transports: [
    new winston.transports.Console({
      format: config.isDev ? combine(colorize(), devFormat) : combine(json()),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: json(),
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: json(),
    }),
  ],
});

module.exports = logger;
