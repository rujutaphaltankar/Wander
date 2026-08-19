import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import "express-async-errors";

import path from "path";
import { env } from "./config/env";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { logger } from "./utils/logger";

export const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(
  morgan(env.nodeEnv === "production" ? "combined" : "dev", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);
app.use("/api", apiLimiter);
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
