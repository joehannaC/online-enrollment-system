import bcrypt from "bcryptjs";

import { Faculty } from "../models/Faculty.js";
import { Student } from "../models/Student.js";
import { User } from "../models/User.js";

import type {
    AuthProfile,
    LoginResult,
} from "../types/auth.types.js";

import type {
    LoginInput,
} from "../schemas/authSchema.js";

import {
    AuthError,
} from "../utils/AuthError.js";

import {
    createAccessToken,
} from "../auth/createAccessToken.js";

import {
    env,
} from "../config/env.js";

function buildDisplayName(input: {
    firstName: string;
    middleName?: string;
    lastName: string;
}): string {
    return [
        input.firstName,
        input.middleName,
        input.lastName,
    ]
        .filter(Boolean)
        .join(" ");
}

export async function loginUser(
    input: LoginInput,
): Promise<LoginResult> {
    const normalizedIdentifier =
        input.usernameOrEmail
            .trim()
            .toLowerCase();

    const user =
        await User.findOne({
            $or: [
                {
                    email:
                        normalizedIdentifier,
                },
                {
                    username:
                        normalizedIdentifier,
                },
            ],
        })
            .select(
                "+passwordHash",
            )
            .lean();

    if (!user) {
        throw new AuthError(
            "Invalid username/email or password.",
        );
    }

    const passwordMatches =
        await bcrypt.compare(
            input.password,
            user.passwordHash,
        );

    if (!passwordMatches) {
        throw new AuthError(
            "Invalid username/email or password.",
        );
    }

    if (
        user.accountStatus !==
        "ACTIVE"
    ) {
        throw new AuthError(
            "Your account is currently unavailable.",
            403,
            "ACCOUNT_NOT_ACTIVE",
        );
    }

    let profile: AuthProfile;
    let studentId:
        | string
        | undefined;
    let facultyId:
        | string
        | undefined;

    if (
        user.role ===
        "STUDENT"
    ) {
        const student =
            await Student.findOne({
                userId:
                    user._id,
            }).lean();

        if (!student) {
            throw new AuthError(
                "The student profile linked to this account was not found.",
                500,
                "STUDENT_PROFILE_NOT_FOUND",
            );
        }

        studentId =
            student._id.toString();

        profile = {
            id:
                studentId,

            firstName:
                student.firstName,

            middleName:
                student.middleName,

            lastName:
                student.lastName,

            displayName:
                buildDisplayName(
                    student,
                ),

            studentNumber:
                student.studentNumber,
        };
    } else if (
        user.role ===
        "FACULTY"
    ) {
        const faculty =
            await Faculty.findOne({
                userId:
                    user._id,
            }).lean();

        if (!faculty) {
            throw new AuthError(
                "The faculty profile linked to this account was not found.",
                500,
                "FACULTY_PROFILE_NOT_FOUND",
            );
        }

        facultyId =
            faculty._id.toString();

        profile = {
            id:
                facultyId,

            firstName:
                faculty.firstName,

            middleName:
                faculty.middleName,

            lastName:
                faculty.lastName,

            displayName:
                buildDisplayName(
                    faculty,
                ),

            employeeNumber:
                faculty.employeeNumber,
        };
    } else {
        throw new AuthError(
            "The account role is not supported.",
            403,
            "UNSUPPORTED_ROLE",
        );
    }

    const accessToken =
        createAccessToken({
            userId:
                user._id.toString(),

            username:
                user.username,

            role:
                user.role,

            studentId,

            facultyId,
        });

    await User.updateOne(
        {
            _id:
                user._id,
        },
        {
            $set: {
                lastLoginAt:
                    new Date(),
            },
        },
    );

    return {
        accessToken,

        expiresIn:
            env.JWT_ACCESS_EXPIRES_IN ??
            env.JWT_EXPIRES_IN,

        user: {
            id:
                user._id.toString(),

            email:
                user.email,

            username:
                user.username,

            role:
                user.role,

            accountStatus:
                user.accountStatus,

            profile,
        },
    };
}