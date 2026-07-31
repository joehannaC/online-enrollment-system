export type CourseEligibilityCode =
    | "ELIGIBLE"
    | "MISSING_PREREQUISITES"
    | "ALREADY_COMPLETED"
    | "ALREADY_SELECTED"
    | "SECTION_FULL"
    | "MAXIMUM_LOAD_EXCEEDED"
    | "ENROLLMENT_NOT_OPEN"
    | "ENROLLMENT_CLOSED"
    | "ENROLLMENT_SUBMITTED"
    | "FAILED_COURSE_RETAKE_NOT_ALLOWED"
    | "SCHEDULE_CONFLICT";

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
    earnedUnits: number;
    remainingUnits: number;
    enrolledUnits: number;
    enlistedUnits: number;
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