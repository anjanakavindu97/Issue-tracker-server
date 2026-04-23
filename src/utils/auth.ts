import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/config";

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hashSync(password, 10);
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compareSync(password, hashedPassword);
}

export const generateToken = async (userId: string): Promise<string> => {
    return jwt.sign({ userId }, config.jwtSecret, { expiresIn: "365d", algorithm: "HS256" });
}