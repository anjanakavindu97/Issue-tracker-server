import { Express } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { UserController } from "../controllers/userController";

export function initAuthRoutes(app: Express): void {
    /* PUBLIC ROUTES */
    app.post("/api/public/register", UserController.registerValidation(), UserController.register);
    app.post("/api/public/login", UserController.loginValidation(), UserController.login);

    /* AUTH ROUTES */
    app.get('/api/auth/user', authenticate, UserController.user);
    app.post('/api/auth/logout', authenticate, UserController.logout);
}