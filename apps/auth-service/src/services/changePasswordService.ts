import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

import { getDatabase } from "../config/database.js";
import type { ChangePasswordInput } from "../schemas/changePasswordSchema.js";

export class ChangePasswordError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "ChangePasswordError";
    }
}

export async function changePassword(
    authenticatedUserId: string,
    input: ChangePasswordInput,
): Promise<void> {
    if (
        !ObjectId.isValid(
            authenticatedUserId,
        )
    ) {
        throw new ChangePasswordError(
            "INVALID_USER_ID",
            "The authenticated user ID is invalid.",
            400,
        );
    }

    const database = getDatabase();

    const user = await database
        .collection("users")
        .findOne({
            _id: new ObjectId(
                authenticatedUserId,
            ),
            accountStatus: "ACTIVE",
        });

    if (!user) {
        throw new ChangePasswordError(
            "USER_NOT_FOUND",
            "The account was not found.",
            404,
        );
    }

    const currentPasswordMatches =
        await bcrypt.compare(
            input.currentPassword,
            user.passwordHash,
        );

    if (!currentPasswordMatches) {
        throw new ChangePasswordError(
            "CURRENT_PASSWORD_INCORRECT",
            "The current password is incorrect.",
            400,
        );
    }

    const sameAsCurrentPassword =
        await bcrypt.compare(
            input.newPassword,
            user.passwordHash,
        );

    if (sameAsCurrentPassword) {
        throw new ChangePasswordError(
            "PASSWORD_NOT_CHANGED",
            "The new password must be different from the current password.",
            400,
        );
    }

    const passwordHash =
        await bcrypt.hash(
            input.newPassword,
            12,
        );

    await database
        .collection("users")
        .updateOne(
            {
                _id: user._id,
            },
            {
                $set: {
                    passwordHash,
                    passwordChangedAt:
                        new Date(),
                    updatedAt: new Date(),
                },
            },
        );
}