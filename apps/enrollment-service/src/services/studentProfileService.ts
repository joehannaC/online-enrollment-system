import {
    ObjectId,
    type Document,
} from "mongodb";

import { getDatabase } from "../config/database.js";

export interface StudentProfileResponse {
    student: {
        id: string;
        studentNumber: string;

        firstName: string;
        middleName?: string;
        lastName: string;
        fullName: string;

        email: string;
        address?: string;
        birthday?: string;

        programCode: string;
        programName: string;
        curriculumCode: string;

        college: string;
        campus: string;
        yearLevel: number;

        requiredUnits: number;
        earnedUnits: number;
        remainingUnits: number;
        enrolledUnits: number;
        enlistedUnits: number;

        status:
            | "ACTIVE"
            | "INACTIVE"
            | "SUSPENDED";
    };
}

export class StudentProfileError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "StudentProfileError";
    }
}

function toObjectId(
    value: string,
): ObjectId {
    if (!ObjectId.isValid(value)) {
        throw new StudentProfileError(
            "INVALID_USER_ID",
            "The authenticated user ID is invalid.",
            400,
        );
    }

    return new ObjectId(value);
}

function buildFullName(
    student: Document,
): string {
    return [
        student.firstName,
        student.middleName,
        student.lastName,
    ]
        .filter(Boolean)
        .join(" ");
}

export async function getStudentProfile(
    authenticatedUserId: string,
): Promise<StudentProfileResponse> {
    const database = getDatabase();

    const userId = toObjectId(
        authenticatedUserId,
    );

    const user = await database
        .collection("users")
        .findOne({
            _id: userId,
            role: "STUDENT",
        });

    if (!user) {
        throw new StudentProfileError(
            "USER_NOT_FOUND",
            "The student account was not found.",
            404,
        );
    }

    const student = await database
        .collection("students")
        .findOne({
            userId,
        });

    if (!student) {
        throw new StudentProfileError(
            "STUDENT_PROFILE_NOT_FOUND",
            "The student profile was not found.",
            404,
        );
    }

    return {
        student: {
            id: student._id.toString(),
            studentNumber:
                student.studentNumber,

            firstName: student.firstName,
            middleName:
                student.middleName,
            lastName: student.lastName,
            fullName:
                student.fullName ??
                buildFullName(student),

            email: user.email,
            address: student.address,

            birthday:
                student.birthday instanceof Date
                    ? student.birthday.toISOString()
                    : student.birthday
                    ? String(student.birthday)
                    : undefined,

            programCode:
                student.programCode,
            programName:
                student.programName,
            curriculumCode:
                student.curriculumCode,

            college: student.college,
            campus: student.campus,
            yearLevel: student.yearLevel,

            requiredUnits:
                student.requiredUnits ?? 0,
            earnedUnits:
                student.earnedUnits ?? 0,
            remainingUnits:
                student.remainingUnits ?? 0,
            enrolledUnits:
                student.enrolledUnits ?? 0,
            enlistedUnits:
                student.enlistedUnits ?? 0,

            status:
                user.accountStatus,
        },
    };
}