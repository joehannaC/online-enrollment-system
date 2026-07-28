import bcrypt from "bcryptjs";

import { Faculty } from "../models/Faculty.js";
import { Student } from "../models/Student.js";
import { User } from "../models/User.js";
import type {
    AuthProfile,
    AuthTokenPayload,
    LoginResult,
} from "../types/auth.types.js";
import { AuthError } from "../utils/AuthError.js";
import { generateAccessToken } from "../utils/jwt.js";
import type { LoginInput } from "../schemas/authSchema.js";
import { env } from "../config/env.js";

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
        input.usernameOrEmail.trim().toLowerCase();

    const user = await User.findOne({
        $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
        ],
    })
        .select("+passwordHash")
        .lean();

    if (!user) {
        throw new AuthError(
        "Invalid username/email or password.",
        );
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.passwordHash,
    );

    if (!passwordMatches) {
        throw new AuthError(
        "Invalid username/email or password.",
        );
    }

    if (user.accountStatus !== "ACTIVE") {
        throw new AuthError(
        "Your account is currently unavailable.",
        403,
        "ACCOUNT_NOT_ACTIVE",
        );
    }

    let profile: AuthProfile;
    let tokenPayload: AuthTokenPayload;

    if (user.role === "STUDENT") {
        const student = await Student.findOne({
        userId: user._id,
        }).lean();

        if (!student) {
        throw new AuthError(
            "The student profile linked to this account was not found.",
            500,
            "STUDENT_PROFILE_NOT_FOUND",
        );
        }

        profile = {
        id: student._id.toString(),
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        displayName: buildDisplayName(student),
        studentNumber: student.studentNumber,
        };

        tokenPayload = {
        userId: user._id.toString(),
        role: "STUDENT",
        profileId: student._id.toString(),
        studentId: student._id.toString(),
        };
    } else {
        const faculty = await Faculty.findOne({
        userId: user._id,
        }).lean();

        if (!faculty) {
        throw new AuthError(
            "The faculty profile linked to this account was not found.",
            500,
            "FACULTY_PROFILE_NOT_FOUND",
        );
        }

        profile = {
        id: faculty._id.toString(),
        firstName: faculty.firstName,
        middleName: faculty.middleName,
        lastName: faculty.lastName,
        displayName: buildDisplayName(faculty),
        employeeNumber: faculty.employeeNumber,
        };

        tokenPayload = {
        userId: user._id.toString(),
        role: "FACULTY",
        profileId: faculty._id.toString(),
        facultyId: faculty._id.toString(),
        };
    }

    const accessToken = generateAccessToken(tokenPayload);

    await User.updateOne(
        { _id: user._id },
        {
        $set: {
            lastLoginAt: new Date(),
        },
        },
    );

    return {
        accessToken,
        expiresIn: env.JWT_EXPIRES_IN,
        user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        accountStatus: user.accountStatus,
        profile,
        },
    };
}