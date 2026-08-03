export type StudentGradeStatus =
    | "PASSED"
    | "FAILED"
    | "CREDITED";

export interface StudentGradeItem {
    id: string;

    courseId: string;
    courseCode: string;
    courseName: string;

    /** Used for display compatibility. Never use this field for GPA math. */
    units: number;

    /** The only units included in GPA calculations. */
    academicUnits: number;

    /** NSTP, LCLSONE, LCLSTWO, LCLSTRI, and similar units. */
    nonAcademicUnits: number;

    academicYear: string;
    termNumber: number;

    grade: string;
    numericGrade?: number;

    status: StudentGradeStatus;
}

export interface StudentGradeSummary {
    programName: string;
    curriculumCode: string;
    studentNumber: string;

    campus: string;
    college: string;

    previousGpa: number | null;
    previousGradedUnits: number;
    previousGradePoints: number;

    latestTermGpa: number | null;
    latestTermGradedUnits: number;
    latestTermGradePoints: number;

    currentGpa: number | null;
    cumulativeGpa: number | null;

    gradedUnits: number;
    totalGradePoints: number;

    creditedUnits: number;
}

export interface StudentGradeAcademicPeriod {
    academicYear: string;
    termNumber: number;
    label: string;
}

export interface StudentGradeResponse {
    summary: StudentGradeSummary;

    grades: StudentGradeItem[];

    filters: {
        academicPeriods:
            StudentGradeAcademicPeriod[];

        statuses:
            StudentGradeStatus[];
    };

    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
}