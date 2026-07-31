export type UserRole = "STUDENT" | "FACULTY";

export interface JwtPayload {
    userId: string;
    role: UserRole;
    profileId: string;
    studentId?: string;
    facultyId?: string;
}

export * from "./academics/calculateAcademicSummary.js";