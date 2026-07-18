import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} does not exist.`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Some fields need your attention.",
      errors: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ success: false, message: "That record already exists." });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "We couldn't find that record." });
    }
  }

  logger.error("Unhandled error", { error: err instanceof Error ? err.stack : err });

  return res.status(500).json({
    success: false,
    message: "Something went wrong on our end. Please try again.",
  });
}
