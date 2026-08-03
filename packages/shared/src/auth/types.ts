import type { JwtPayload } from "jsonwebtoken";

export type UserRole = "STUDENT" | "FACULTY";

export interface AccessTokenClaims extends JwtPayload {
    sub: string;
    userId: string;
    role: UserRole;
    username?: string;
    studentId?: string;
    facultyId?: string;
}
