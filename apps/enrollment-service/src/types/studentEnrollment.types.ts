export type StudentEnrollmentStatus =
    | "DRAFT"
    | "SUBMITTED"
    | "CANCELLED";

export type EnrollmentPageMode =
    | "EDITABLE_DRAFT"
    | "EDITABLE_SUBMITTED"
    | "READ_ONLY";

export type EnrollmentItemStatus =
    | "DRAFT"
    | "ENROLLED";

export type CourseEligibilityCode =
    | "ELIGIBLE"
    | "MISSING_PREREQUISITES"
    | "ALREADY_COMPLETED"
    | "ALREADY_CREDITED"
    | "ALREADY_SELECTED"
    | "ALREADY_ENROLLED"
    | "SECTION_FULL"
    | "MAXIMUM_LOAD_EXCEEDED"
    | "ENROLLMENT_NOT_OPEN"
    | "ENROLLMENT_CLOSED"
    | "ENROLLMENT_SUBMITTED"
    | "FAILED_COURSE_RETAKE_NOT_ALLOWED"
    | "SCHEDULE_CONFLICT";

export interface EnrollmentSectionOption {
    sectionId: string;
    courseId: string;

    courseCode: string;
    courseName: string;

    academicUnits: number;
    nonAcademicUnits: number;

    sectionCode: string;

    instructorName: string;
    scheduleLabel: string;

    capacity: number;
    enrolledCount: number;
    availableSlots: number;

    isFull: boolean;

    canEnroll: boolean;

    eligibilityCode: CourseEligibilityCode;

    eligibilityTitle: string;

    eligibilityMessage: string;

    missingPrerequisiteCodes?: string[];
}

export interface EnrollmentSummaryItem {
    itemId: string;

    sectionId: string;
    courseId: string;

    courseCode: string;
    courseName: string;

    academicUnits: number;
    nonAcademicUnits: number;

    sectionCode: string;

    instructorName: string;
    scheduleLabel: string;

    status: EnrollmentItemStatus;
    canDrop: boolean;

    enrolledAt?: string;
}

export interface StudentEnrollmentResponse {
    term: {
        academicTermId: string;

        academicYear: string;
        termNumber: number;
        name: string;

        enrollmentStart: string;
        enrollmentEnd: string;
        termStart: string;

        maximumAcademicUnits: number;

        isEnrollmentOpen: boolean;
    };

    enrollment: {
        enrollmentId?: string;

        status?:
            StudentEnrollmentStatus;

        mode:
            EnrollmentPageMode;

        version: number;

        submittedAt?: string;

        totalAcademicUnits: number;
        totalNonAcademicUnits: number;

        enrolledAcademicUnits?: number;
        enrolledNonAcademicUnits?: number;

        draftAcademicUnits?: number;
        draftNonAcademicUnits?: number;

        enrolledCourseCount?: number;
        draftCourseCount?: number;

        items: EnrollmentSummaryItem[];
    };

    availableSections: EnrollmentSectionOption[];

    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
}

export type RejectedEnrollmentReason =
    | "SECTION_FULL"
    | "SCHEDULE_CONFLICT";

export interface RejectedEnrollmentSection {
    itemId: string;

    sectionId: string;
    sectionCode: string;

    courseId: string;
    courseCode: string;
    courseName: string;

    reason:
        RejectedEnrollmentReason;
}

export interface SubmitEnrollmentResult {
    outcome:
        | "SUCCESS"
        | "PARTIAL_SUCCESS"
        | "ALL_SECTIONS_FULL";

    message: string;

    submittedCourseCount: number;

    rejectedCourseCount: number;

    rejectedSections: RejectedEnrollmentSection[];

    enrollmentVersion?: number;

    canContinueEnrollment?: boolean;
}