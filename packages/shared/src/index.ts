export type UserRole = "student" | "faculty";

export interface JwtPayload {
    userId: string;
    role: UserRole;
    studentId?: string;
    facultyId?: string;
}