import type {
    CourseEligibilityCode,
} from "./common.types";

export type StudentEnrollmentStatus =
    | "DRAFT"
    | "SUBMITTED"
    | "CANCELLED";

export type EnrollmentPageMode =
    | "EDITABLE_DRAFT"
    | "EDITABLE_SUBMITTED"
    | "READ_ONLY";

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

    eligibilityCode:
        CourseEligibilityCode;

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

        items:
            EnrollmentSummaryItem[];
    };

    availableSections:
        EnrollmentSectionOption[];

    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
}


export interface RejectedEnrollmentSection {
    itemId: string;
    sectionId: string;
    sectionCode: string;
    courseId: string;
    courseCode: string;
    courseName: string;
    reason: "SECTION_FULL";
}

export interface SubmitEnrollmentResult {
    outcome:
        | "SUCCESS"
        | "PARTIAL_SUCCESS"
        | "ALL_SECTIONS_FULL";

    message: string;

    submittedCourseCount: number;
    rejectedCourseCount: number;

    rejectedSections:
        RejectedEnrollmentSection[];
}
