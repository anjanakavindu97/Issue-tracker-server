import { Express } from "express";
import { initAuthRoutes } from "./authRoute";
import { initIssueRoutes } from "./issueRoute";

export function initRoutes(app: Express): void {
    initAuthRoutes(app);
    initIssueRoutes(app);
}