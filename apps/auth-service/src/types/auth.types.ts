export type UserRole = "STUDENT" | "FACULTY";

export interface AuthProfile {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    displayName: string;
    studentNumber?: string;
    employeeNumber?: string;
}

export interface AuthUserResponse {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    accountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    profile: AuthProfile;
}

export interface LoginResult {
    accessToken: string;
    expiresIn: string;
    user: AuthUserResponse;
}

export interface AuthTokenPayload {
    userId: string;
    role: UserRole;
    profileId: string;
    studentId?: string;
    facultyId?: string;
}