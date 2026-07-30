export type AccountStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "SUSPENDED";

export type UserRole =
    | "STUDENT"
    | "FACULTY";

export interface StudentProfileData {
    role: "STUDENT";

    id: string;
    userId: string;
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
    requiredNonAcademicUnits: number;

    earnedUnits: number;
    earnedNonAcademicUnits: number;

    remainingUnits: number;
    enrolledUnits: number;
    enlistedUnits: number;

    status: AccountStatus;
}

export interface FacultyProfileData {
    role: "FACULTY";

    id: string;
    userId: string;
    employeeNumber: string;

    title?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName: string;

    email: string;
    address?: string;
    birthday?: string;

    department: string;
    college: string;
    specializationGroup?: string;
    campus: string;

    status: AccountStatus;
}

export type ProfileData =
    | StudentProfileData
    | FacultyProfileData;

export interface ProfileResponse {
    profile: ProfileData;
}