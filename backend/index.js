const app = require("./server");
const config = require("./Config/index");
const { connectDatabase, disconnectDatabase } = require("./Config/database");
const logger = require("./Config/logger");

const start = async () => {
  await connectDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} [${config.env}]`);
    logger.info(`API: http://localhost:${config.port}/api/v1`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info("Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (err) => {
    logger.error("Unhandled Rejection:", err);
    shutdown("unhandledRejection");
  });
};

start();
