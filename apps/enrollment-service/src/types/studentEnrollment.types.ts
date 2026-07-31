export type StudentEnrollmentStatus =
    | "DRAFT"
    | "SUBMITTED"
    | "CANCELLED";

export type EnrollmentPageMode =
    | "EDITABLE_DRAFT"
    | "EDITABLE_SUBMITTED"
    | "READ_ONLY";

type CourseEligibilityCode =
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
    disabledReason?: string;
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

interface CourseEligibility {
    canEnroll: boolean;

    code:
        CourseEligibilityCode;

    title: string;

    message: string;

    missingPrerequisiteCodes?:
        string[];
}

function getCourseEligibility({
    enrollmentOpen,
    enrollmentHasStarted,
    enrollmentHasEnded,
    enrollmentSubmitted,
    alreadyCompleted,
    alreadySelected,
    isFull,
    wouldExceedMaximumLoad,
    missingPrerequisiteCodes,
}: {
    enrollmentOpen: boolean;
    enrollmentHasStarted: boolean;
    enrollmentHasEnded: boolean;
    enrollmentSubmitted: boolean;
    alreadyCompleted: boolean;
    alreadySelected: boolean;
    isFull: boolean;
    wouldExceedMaximumLoad: boolean;
    missingPrerequisiteCodes: string[];
}): CourseEligibility {
    if (enrollmentSubmitted) {
        return {
            canEnroll: false,
            code:
                "ENROLLMENT_SUBMITTED",
            title:
                "Enrollment submitted",
            message:
                "Your enrollment has already been submitted and can no longer be changed.",
        };
    }

    if (!enrollmentHasStarted) {
        return {
            canEnroll: false,
            code:
                "ENROLLMENT_NOT_OPEN",
            title:
                "Enrollment not yet open",
            message:
                "Enrollment will become available once the official enrollment period begins.",
        };
    }

    if (enrollmentHasEnded) {
        return {
            canEnroll: false,
            code:
                "ENROLLMENT_CLOSED",
            title:
                "Enrollment period ended",
            message:
                "The official enrollment period has already ended.",
        };
    }

    if (alreadyCompleted) {
        return {
            canEnroll: false,
            code:
                "ALREADY_COMPLETED",
            title:
                "Already completed",
            message:
                "You already passed or received credit for this course and cannot enroll in it again.",
        };
    }

    if (alreadySelected) {
        return {
            canEnroll: false,
            code:
                "ALREADY_SELECTED",
            title:
                "Already selected",
            message:
                "This course is already included in your enrollment draft.",
        };
    }

    if (
        missingPrerequisiteCodes.length >
        0
    ) {
        return {
            canEnroll: false,
            code:
                "MISSING_PREREQUISITES",
            title:
                "Cannot yet be enlisted",
            message:
                `Complete the following prerequisite${
                    missingPrerequisiteCodes.length >
                    1
                        ? "s"
                        : ""
                } first: ${missingPrerequisiteCodes.join(
                    ", ",
                )}.`,

            missingPrerequisiteCodes,
        };
    }

    if (isFull) {
        return {
            canEnroll: false,
            code:
                "SECTION_FULL",
            title:
                "Section full",
            message:
                "This section has reached its maximum capacity of 45 students.",
        };
    }

    if (
        wouldExceedMaximumLoad
    ) {
        return {
            canEnroll: false,
            code:
                "MAXIMUM_LOAD_EXCEEDED",
            title:
                "Maximum load exceeded",
            message:
                "Adding this course would exceed the maximum academic load of 21 units.",
        };
    }

    if (!enrollmentOpen) {
        return {
            canEnroll: false,
            code:
                "ENROLLMENT_NOT_OPEN",
            title:
                "Enrollment unavailable",
            message:
                "Enrollment is not currently available.",
        };
    }

    return {
        canEnroll: true,
        code:
            "ELIGIBLE",
        title:
            "Eligible",
        message:
            "You meet the requirements and may enroll in this section.",
    };
}