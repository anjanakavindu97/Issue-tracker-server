import { model, Schema } from "mongoose";
import { User, UserModel } from "../models/user-model";

const userSchema = new Schema<User>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

export const userModel = model<User, UserModel>("user", userSchema);
