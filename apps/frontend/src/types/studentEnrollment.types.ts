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

/**
 * Item-level status is required because a partially
 * successful submission can contain:
 *
 * - permanently enrolled courses;
 * - newly selected draft courses.
 */
export type EnrollmentItemStatus =
    | "DRAFT"
    | "ENROLLED";

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

    /**
     * DRAFT:
     * The student may still remove the course.
     *
     * ENROLLED:
     * The course was successfully reserved and can
     * no longer be removed or selected again.
     */
    status:
        EnrollmentItemStatus;

    /**
     * Backend-calculated permission.
     *
     * This should normally be true only when:
     * - item.status is DRAFT;
     * - enrollment remains open;
     * - the enrollment is not read-only.
     */
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

        /**
         * This should only represent final submission.
         * For PARTIAL_SUCCESS, the header should remain
         * DRAFT and submittedAt should normally remain
         * undefined.
         */
        submittedAt?: string;

        /**
         * Totals include both DRAFT and ENROLLED items.
         */
        totalAcademicUnits: number;
        totalNonAcademicUnits: number;

        /**
         * Optional breakdown for clearer UI logic.
         */
        draftAcademicUnits?: number;
        enrolledAcademicUnits?: number;

        draftCourseCount?: number;
        enrolledCourseCount?: number;

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

    /**
     * Courses accepted during the current submission
     * attempt, not the student's lifetime total.
     */
    submittedCourseCount: number;

    rejectedCourseCount: number;

    rejectedSections:
        RejectedEnrollmentSection[];

    /**
     * Latest enrollment version after the transaction.
     * This is useful for avoiding another GET before the
     * next edit, although reloading remains recommended.
     */
    enrollmentVersion?: number;

    /**
     * True when the student may continue adding,
     * dropping draft items, and submitting again.
     */
    canContinueEnrollment?: boolean;
}