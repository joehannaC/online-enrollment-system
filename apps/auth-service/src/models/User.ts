import {
    Schema,
    model,
    models,
    type HydratedDocument,
    type Model,
} from "mongoose";

export type UserRole = "STUDENT" | "FACULTY";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface IUser {
    email: string;
    username: string;
    passwordHash: string;
    role: UserRole;
    accountStatus: AccountStatus;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        username: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        passwordHash: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: ["STUDENT", "FACULTY"],
            required: true,
        },

        accountStatus: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
            default: "ACTIVE",
            },

            lastLoginAt: {
            type: Date,
            },
        },
        {
            timestamps: true,
            collection: "users",
        },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });

export const User: Model<IUser> = models.User || model<IUser>("User", userSchema);