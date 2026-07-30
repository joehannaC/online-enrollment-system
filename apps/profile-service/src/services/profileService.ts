import {
    ObjectId,
    type Document,
} from "mongodb";

import {
    getDatabase,
} from "../config/database.js";
import type {
    AccountStatus,
    FacultyProfileData,
    ProfileResponse,
    StudentProfileData,
    UserRole,
} from "../types/profile.types.js";

export class ProfileServiceError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name =
            "ProfileServiceError";
    }
}

function toObjectId(
    value: string,
): ObjectId {
    if (!ObjectId.isValid(value)) {
        throw new ProfileServiceError(
            "INVALID_USER_ID",
            "The authenticated user ID is invalid.",
            400,
        );
    }

    return new ObjectId(value);
}

function normalizeDate(
    value: unknown,
): string | undefined {
    if (!value) {
        return undefined;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    const date = new Date(
        String(value),
    );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return undefined;
    }

    return date.toISOString();
}

function normalizeStatus(
    value: unknown,
): AccountStatus {
    switch (value) {
        case "INACTIVE":
        case "SUSPENDED":
        case "ACTIVE":
            return value;

        default:
            return "ACTIVE";
    }
}

function buildStudentFullName(
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

function buildFacultyFullName(
    faculty: Document,
): string {
    return [
        faculty.title,
        faculty.firstName,
        faculty.middleName,
        faculty.lastName,
    ]
        .filter(Boolean)
        .join(" ");
}

async function getStudentProfile(
    user: Document,
): Promise<StudentProfileData> {
    const database =
        getDatabase();

    const student =
        await database
            .collection("students")
            .findOne({
                userId: user._id,
            });

    if (!student) {
        throw new ProfileServiceError(
            "STUDENT_PROFILE_NOT_FOUND",
            "The student profile was not found.",
            404,
        );
    }

    return {
        role: "STUDENT",

        id:
            student._id.toString(),

        userId:
            user._id.toString(),

        studentNumber:
            String(
                student.studentNumber,
            ),

        firstName:
            String(
                student.firstName,
            ),

        middleName:
            student.middleName
                ? String(
                      student.middleName,
                  )
                : undefined,

        lastName:
            String(
                student.lastName,
            ),

        fullName:
            student.fullName
                ? String(
                      student.fullName,
                  )
                : buildStudentFullName(
                      student,
                  ),

        email:
            String(user.email),

        address:
            student.address
                ? String(
                      student.address,
                  )
                : undefined,

        birthday:
            normalizeDate(
                student.birthday,
            ),

        programCode:
            String(
                student.programCode ??
                    "",
            ),

        programName:
            String(
                student.programName ??
                    "",
            ),

        curriculumCode:
            String(
                student.curriculumCode ??
                    "",
            ),

        college:
            String(
                student.college ??
                    "",
            ),

        campus:
            String(
                student.campus ??
                    "Manila Campus",
            ),

        yearLevel:
            Number(
                student.yearLevel ??
                    0,
            ),

        requiredUnits:
            Number(
                student.requiredUnits ??
                    0,
            ),

        requiredNonAcademicUnits:
            Number(
                student.requiredNonAcademicUnits ??
                    0,
            ),

        earnedUnits:
            Number(
                student.earnedUnits ??
                    0,
            ),

        earnedNonAcademicUnits:
            Number(
                student.earnedNonAcademicUnits ??
                    0,
            ),

        remainingUnits:
            Number(
                student.remainingUnits ??
                    0,
            ),

        enrolledUnits:
            Number(
                student.enrolledUnits ??
                    0,
            ),

        enlistedUnits:
            Number(
                student.enlistedUnits ??
                    0,
            ),

        status:
            normalizeStatus(
                user.accountStatus ??
                    student.status,
            ),
    };
}

async function getFacultyProfile(
    user: Document,
): Promise<FacultyProfileData> {
    const database =
        getDatabase();

    const faculty =
        await database
            .collection("faculty")
            .findOne({
                userId: user._id,
            });

    if (!faculty) {
        throw new ProfileServiceError(
            "FACULTY_PROFILE_NOT_FOUND",
            "The faculty profile was not found.",
            404,
        );
    }

    return {
        role: "FACULTY",

        id:
            faculty._id.toString(),

        userId:
            user._id.toString(),

        employeeNumber:
            String(
                faculty.employeeNumber,
            ),

        title:
            faculty.title
                ? String(
                      faculty.title,
                  )
                : undefined,

        firstName:
            String(
                faculty.firstName,
            ),

        middleName:
            faculty.middleName
                ? String(
                      faculty.middleName,
                  )
                : undefined,

        lastName:
            String(
                faculty.lastName,
            ),

        fullName:
            faculty.fullName
                ? String(
                      faculty.fullName,
                  )
                : buildFacultyFullName(
                      faculty,
                  ),

        email:
            String(user.email),

        address:
            faculty.address
                ? String(
                      faculty.address,
                  )
                : undefined,

        birthday:
            normalizeDate(
                faculty.birthday,
            ),

        department:
            String(
                faculty.department ??
                    "",
            ),

        college:
            String(
                faculty.college ??
                    "",
            ),

        specializationGroup:
            faculty.specializationGroup
                ? String(
                      faculty.specializationGroup,
                  )
                : undefined,

        campus:
            String(
                faculty.campus ??
                    "Manila Campus",
            ),

        status:
            normalizeStatus(
                user.accountStatus ??
                    faculty.status,
            ),
    };
}

export async function getProfileByUserId(
    authenticatedUserId: string,
    tokenRole: UserRole,
): Promise<ProfileResponse> {
    const database =
        getDatabase();

    const userId =
        toObjectId(
            authenticatedUserId,
        );

    const user =
        await database
            .collection("users")
            .findOne({
                _id: userId,
            });

    if (!user) {
        throw new ProfileServiceError(
            "USER_NOT_FOUND",
            "The user account was not found.",
            404,
        );
    }

    if (
        user.accountStatus !==
        "ACTIVE"
    ) {
        throw new ProfileServiceError(
            "ACCOUNT_NOT_ACTIVE",
            "The account is not active.",
            403,
        );
    }

    if (
        user.role !== tokenRole
    ) {
        throw new ProfileServiceError(
            "ROLE_MISMATCH",
            "The access token role does not match the user account.",
            403,
        );
    }

    if (
        tokenRole ===
        "STUDENT"
    ) {
        return {
            profile:
                await getStudentProfile(
                    user,
                ),
        };
    }

    if (
        tokenRole ===
        "FACULTY"
    ) {
        return {
            profile:
                await getFacultyProfile(
                    user,
                ),
        };
    }

    throw new ProfileServiceError(
        "UNSUPPORTED_ROLE",
        "The user role is not supported by the Profile Service.",
        403,
    );
}