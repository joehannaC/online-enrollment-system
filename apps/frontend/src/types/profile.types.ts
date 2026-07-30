import type {
    AccountStatus,
    ISODateString,
} from "./common.types";

interface BaseProfile {
    id: string;
    userId: string;

    firstName: string;
    middleName?: string;
    lastName: string;
    fullName: string;

    email: string;
    address?: string;
    birthday?: ISODateString;

    status: AccountStatus;
}

export interface StudentProfileData
    extends BaseProfile {
    role: "STUDENT";

    studentNumber: string;

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
}

export interface FacultyProfileData
    extends BaseProfile {
    role: "FACULTY";

    employeeNumber: string;
    title?: string;

    department: string;
    college: string;
    specializationGroup?: string;
    campus: string;
}

export type ProfileData =
    | StudentProfileData
    | FacultyProfileData;

export interface ProfileResponse {
    profile: ProfileData;
}