import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/config";
import { AuthenticatedRequest, JwtPayload } from "../types/auth.types";
import logger from "../utils/logger";

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      logger.warn("Token expired", { error: err.message });
      res.status(401).json({ message: "Token expired" });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid token", { error: err.message });
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    logger.error("Auth middleware error", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
