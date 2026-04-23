import { Express } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { IssueController } from "../controllers/issueController";

export function initIssueRoutes(app: Express): void {
    app.get("/api/auth/issues/stats", authenticate, IssueController.stats);
    app.get("/api/auth/issues", authenticate, IssueController.list);
    app.post("/api/auth/issues", authenticate, IssueController.create);
    app.get("/api/auth/issues/:id", authenticate, IssueController.getById);
    app.patch("/api/auth/issues/:id", authenticate, IssueController.update);
}
