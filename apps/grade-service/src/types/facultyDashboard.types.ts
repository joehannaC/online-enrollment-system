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

export interface FacultySubjectStudent {
    studentId: string;
    studentNumber: string;
    fullName: string;

    activity: number | null;
    majorOutput1: number | null;
    majorOutput2: number | null;
    midtermExam: number | null;
    finalExam: number | null;

    rawFinalGrade: number | null;
    finalGradeValue: number | null;

    gradeStatus:
        | "INCOMPLETE"
        | "DRAFT"
        | "SUBMITTED";
}

export interface FacultySubject {
    sectionId: string;
    sectionCode: string;

    courseId: string;
    courseCode: string;
    courseName: string;

    schedule: ScheduleItem[];

    enrolledStudents: number;

    submittedGrades: number;

    gradedStudents: number;

    pendingGrades: number;

    submissionPercentage: number;
    submissionStatus: GradeStatus;

    students: FacultySubjectStudent[];
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
