import { HydratedDocument, Model } from "mongoose";


export interface User {
    name: string;
    email: string;
    password: string;
}

export type UserModel = Model<User>;

export type UserDocument = HydratedDocument<User>