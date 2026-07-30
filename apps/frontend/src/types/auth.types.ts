import type {
    AccountStatus,
    UserRole,
} from "./common.types";

export interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export interface AuthProfile {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    displayName: string;

    studentNumber?: string;
    employeeNumber?: string;
}

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    accountStatus: AccountStatus;
    profile: AuthProfile;
}

export interface LoginResponse {
    accessToken: string;
    expiresIn: string;
    user: AuthUser;
}

export interface LoginApiResponse {
    success: true;
    data: LoginResponse;
    message?: string;
}

export interface LoginApiError {
    success: false;
    error: {
        code: string;
        message: string;
        service?: string;
        details?: Record<string, string[]>;
    };
}

export interface CurrentUserResponse {
    user: AuthUser;
}

export interface CurrentUserApiResponse {
    success: true;
    data: CurrentUserResponse;
}

export interface LogoutResponse {
    message: string;
}

export interface LogoutApiResponse {
    success: true;
    data: LogoutResponse;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ChangePasswordResponse {
    message: string;
}

export interface ChangePasswordApiResponse {
    success: true;
    data: ChangePasswordResponse;
}