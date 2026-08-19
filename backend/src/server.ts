import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { prisma } from "./config/db";

// --- Vercel Serverless: export the Express app as the default export ---
export default app;

// --- Traditional server: only listen when NOT running on Vercel ---
if (!process.env.VERCEL) {
  const server = app.listen(env.port, () => {
    logger.info(`Wander API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  async function shutdown(signal: string) {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection", { reason });
  });
}
