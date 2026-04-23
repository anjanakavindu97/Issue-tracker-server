import { Request, Response, NextFunction } from "express";
import { check, ValidationChain, validationResult } from "express-validator";
import { Validations } from "../common/validation";
import  { User } from "../models/user-model";
import { userModel } from "../schemas/user-schema";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";
import { AuthenticatedRequest } from "../types/auth.types";
import logger from "../utils/logger";

export namespace UserController {

    export function registerValidation(): ValidationChain[] {
        return [
            Validations.name(),
            Validations.email(),
            Validations.password(),
        ]
    }

    export function loginValidation(): ValidationChain[] {
        const message = "Email or Password is incorrect!";
        return [
            Validations.email(),
            check("password").isString().not().isEmpty().withMessage(message).isLength({ min: 6, max: 40 }).withMessage(message)
        ]
    }

    export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.error("Validation errors", errors.array());
                res.status(400).json({ message: "Validation errors" });
                return;
            }

            const data: User = {
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
            };

            const userExists = await userModel.findOne({ name: data.name });
            if (userExists) {
                logger.error("User already exists", data.name);
                res.status(400).json({ message: "User already exists" });
                return;
            }

            const emailExists = await userModel.findOne({ email: data.email });
            if (emailExists) {
                logger.error("Email already exists", data.email);
                res.status(400).json({ message: "Email already exists" });
                return;
            }

            const hashedPassword = await hashPassword(data.password);

            const user = await userModel.create({
                name: data.name,
                email: data.email,
                password: hashedPassword,
            });

            logger.info("User registered successfully", user);
            res.status(201).json({ message: "User registered successfully", user });
            return;
        } catch (error) {
            logger.error("Error registering user", error);
            next(error);
        }
    }

    export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.error("Validation errors", errors.array());
                res.status(400).json({ message: "Email or Password is incorrect!" });
                return;
            }

            const { email, password } = req.body;

            const user = await userModel.findOne({ email });
            if (!user) {
                logger.error("User not found", email);
                res.status(404).json({ message: "User not found" });
                return;
            }

            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) {
                logger.error("Invalid password", email);
                res.status(401).json({ message: "Invalid password" });
                return;
            }

            const token = await generateToken(user._id.toString());

            logger.info("Login successful", email);
            res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            });
            return;
        } catch (error) {
            logger.error("Error logging in", error);
            next(error);
        }
    }

    export async function user(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            const user = await userModel
                .findById(req.user.userId)
                .select("-password");

            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            res.status(200).json({
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            });
        } catch (error) {
            logger.error("Error fetching user", error);
            next(error);
        }
    }

    export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ message: "Authentication required" });
                return;
            }

            await userModel.findByIdAndUpdate(req.user.userId, { token: null });
            logger.info("Logout successful", req.user.userId);
            res.status(200).json({ message: "Logout successful" });
            return;
        } catch (error) {
            logger.error("Error logging out", error);
            next(error);
        }
    }
}