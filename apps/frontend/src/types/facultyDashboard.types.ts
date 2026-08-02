import type {
    AcademicTermSummary,
    ISODateString,
} from "./common.types";

import type {
    FacultyProfileSummary,
    FacultySubject,
} from "./faculty.types";

export interface FacultyDashboardSummary {
    handledSubjectCount: number;
    enrolledStudentCount: number;
    pendingGradeCount: number;
    submissionPercentage: number;
}

export interface FacultyDeadline {
    id: string;
    title: string;
    deadline: ISODateString;
    daysRemaining: number;

    status:
        | "UPCOMING"
        | "DUE_SOON"
        | "OVERDUE";
}

export interface FacultyDashboardResponse {
    faculty: FacultyProfileSummary;
    currentTerm: AcademicTermSummary;
    summary: FacultyDashboardSummary;
    handledSubjects: FacultySubject[];
    upcomingDeadlines: FacultyDeadline[];
}