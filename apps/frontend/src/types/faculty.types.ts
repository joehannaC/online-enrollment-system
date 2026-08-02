import type {
    AccountStatus,
    AcademicTermSummary,
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

    submissionStatus:
        | "DRAFT"
        | "SUBMITTED"
        | "VERIFIED"
        | "RETURNED";

    students: FacultySubjectStudent[];
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
        birthday?: string;

        department: string;
        college: string;
        specializationGroup?: string;
        campus: string;

        status: AccountStatus;
    };
}