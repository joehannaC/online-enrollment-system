export type StudentRecordStatus =
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANNOT_YET_BE_ENLISTED"
    | "REGISTERED"
    | "CAN_BE_ENLISTED"
    | "CREDITED";

export interface StudentRecordSummary {
    requiredUnits: number;
    earnedUnits: number;
    remainingUnits: number;
    enrolledUnits: number;
    enlistedUnits: number;
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

    grade?: string;

    prerequisiteCodes: string[];
    missingPrerequisiteCodes: string[];
}

export interface AcademicPeriodOption {
    academicYear: string;
    termNumber: number;
    label: string;
}

export interface StudentRecordResponse {
    summary: StudentRecordSummary;

    records: StudentRecordItem[];

    filters: {
        academicPeriods:
            AcademicPeriodOption[];

        statuses:
            StudentRecordStatus[];
    };

    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
}