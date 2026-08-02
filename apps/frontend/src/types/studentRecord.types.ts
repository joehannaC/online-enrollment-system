import type {
    CourseEligibilityCode,
} from "./common.types";

export type StudentRecordStatus =
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANNOT_YET_BE_ENLISTED"
    | "REGISTERED"
    | "CAN_BE_ENLISTED"
    | "CREDITED";

export interface AcademicPeriodOption {
    academicYear: string;
    termNumber: number;
    label: string;
}

export interface StudentRecordItem {
    id: string;
    courseId: string;

    courseCode: string;
    courseName: string;

    units: number;
    nonAcademicUnits: number;
    curriculumTerm: number;

    academicYear: string;
    academicTerm: number;

    status: StudentRecordStatus;

    eligibilityCode:
        CourseEligibilityCode;

    eligibilityTitle: string;
    eligibilityMessage: string;

    grade?: string;

    prerequisiteCodes: string[];

    missingPrerequisiteCodes:
        string[];
}

export interface StudentRecordSummary {
    requiredUnits: number;
    requiredNonAcademicUnits: number;

    earnedUnits: number;
    earnedNonAcademicUnits: number;

    remainingUnits: number;
    remainingNonAcademicUnits: number;

    enrolledUnits: number;
    enrolledNonAcademicUnits: number;

    enlistedUnits: number;
    enlistedNonAcademicUnits: number;
}

export interface StudentRecordFilters {
    academicPeriods:
        AcademicPeriodOption[];

    statuses:
        StudentRecordStatus[];
}

export interface StudentRecordPagination {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
}

export interface StudentRecordResponse {
    summary:
        StudentRecordSummary;

    records:
        StudentRecordItem[];

    filters:
        StudentRecordFilters;

    pagination:
        StudentRecordPagination;
}