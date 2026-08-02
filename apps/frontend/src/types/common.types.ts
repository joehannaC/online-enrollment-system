export type ISODateString = string;

export type UserRole = "STUDENT" | "FACULTY";

export type AccountStatus =
    | "ACTIVE"
    | "INACTIVE"
    | "SUSPENDED";

export type AcademicTermStatus =
    | "UPCOMING"
    | "ACTIVE"
    | "COMPLETED";

export type EnrollmentStatus =
    | "ENLISTED"
    | "ENROLLED"
    | "DROPPED"
    | "COMPLETED";

export type SectionStatus =
    | "OPEN"
    | "CLOSED"
    | "CANCELLED";

export type GradeStatus =
    | "DRAFT"
    | "SUBMITTED"
    | "VERIFIED"
    | "RETURNED";

export type GradeResult =
    | "PASSED"
    | "FAILED"
    | "CREDITED"
    | "INCOMPLETE"
    | "PENDING";

export type GradeType =
    | "MIDTERM"
    | "FINAL"
    | "PROGRESS";

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

export interface ApiResponse<T> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        service?: string;
        details?: Record<string, unknown>;
    };
}

export interface PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: PaginationMeta;
}

export interface ScheduleItem {
    days: string[];
    startTime: string;
    endTime: string;
    room: string;
}

export interface AcademicTermSummary {
    id: string;
    code: string;
    name: string;
    academicYear: string;
    termNumber: number;
    status: AcademicTermStatus;
    isCurrent: boolean;
}