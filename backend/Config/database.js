const { PrismaClient } = require("@prisma/client");
const config = require("./index");
const logger = require("./logger");

const prisma = new PrismaClient({
  log: config.isDev ? ["warn", "error"] : ["error"],
});

async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
}

async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info("Database disconnected");
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
