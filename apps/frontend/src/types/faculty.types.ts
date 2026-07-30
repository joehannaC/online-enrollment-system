import type {
    AccountStatus,
    AcademicTermSummary,
    GradeStatus,
    ISODateString,
    ScheduleItem,
} from "./common.types";

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
        deadline: ISODateString;
        daysRemaining: number;
        status: "UPCOMING" | "DUE_SOON" | "OVERDUE";
    }>;
}

export interface FacultySubjectsResponse {
    faculty: FacultyProfileSummary;
    currentTerm: AcademicTermSummary;

    summary: {
        handledSubjectCount: number;
        enrolledStudentCount: number;
    };

    subjects: FacultySubject[];
}

export interface FacultyGradeRecordsResponse {
    summary: {
        submittedClasses: number;
        studentRecords: number;
        drafts: number;
        returned: number;
    };

    submissions: Array<{
        id: string;
        sectionId: string;

        courseCode: string;
        courseName: string;
        sectionCode: string;

        gradeType: string;
        submittedAt?: ISODateString;

        completedCount: number;
        totalStudents: number;

        status: GradeStatus;
        returnReason?: string;
    }>;
}

export interface FacultyProfileResponse {
    faculty: {
        id: string;
        employeeNumber: string;

        title?: string;
        firstName: string;
        middleName?: string;
        lastName: string;
        fullName: string;

        email: string;
        address?: string;
        birthday?: ISODateString;

        department: string;
        college: string;
        specializationGroup?: string;
        campus: string;

        status: AccountStatus;
    };
}