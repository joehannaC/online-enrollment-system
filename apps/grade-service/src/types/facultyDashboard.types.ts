export type AcademicTermStatus =
    | "UPCOMING"
    | "ACTIVE"
    | "COMPLETED";

export type GradeStatus =
    | "DRAFT"
    | "SUBMITTED"
    | "VERIFIED"
    | "RETURNED";

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

export interface FacultyProfileSummary {
    id: string;
    employeeNumber: string;
    title?: string;

    firstName: string;
    middleName?: string;
    lastName: string;
    fullName: string;

    department: string;
    college: string;
}

export interface FacultySubject {
    sectionId: string;
    sectionCode: string;

    courseId: string;
    courseCode: string;
    courseName: string;

    schedule: ScheduleItem[];

    enrolledStudents: number;
    gradedStudents: number;
    pendingGrades: number;

    submissionStatus: GradeStatus;
}

export interface FacultyDashboardResponse {
    faculty: FacultyProfileSummary;
    currentTerm: AcademicTermSummary;

    summary: {
        handledSubjectCount: number;
        enrolledStudentCount: number;
        pendingGradeCount: number;
        submissionPercentage: number;
    };

    handledSubjects: FacultySubject[];

    upcomingDeadlines: Array<{
        id: string;
        title: string;
        deadline: string;
        daysRemaining: number;
        status:
            | "UPCOMING"
            | "DUE_SOON"
            | "OVERDUE";
    }>;
}