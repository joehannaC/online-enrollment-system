import type {
    ISODateString,
} from "./common.types";

export type FacultySubjectGradeStatus =
    | "PENDING"
    | "DRAFT"
    | "SUBMITTED"
    | "VERIFIED"
    | "RETURNED";

export interface FacultySubjectRosterStudent {
    studentId: string;
    studentNumber: string;
    fullName: string;
    finalGradeValue: number | null;
    gradeStatus: FacultySubjectGradeStatus;
}

export interface FacultySubjectListItem {
    sectionId: string;
    sectionCode: string;

    courseId: string;
    courseCode: string;
    courseName: string;

    schedule: Array<{
        days: string[];
        startTime: string;
        endTime: string;
        room: string;
    }>;

    enrolledStudents: number;
    gradedStudents: number;
    pendingGrades: number;

    students:
        FacultySubjectRosterStudent[];
}

export interface FacultySubjectsPageResponse {
    faculty: {
        id: string;
        employeeNumber: string;
        fullName: string;
        department: string;
        college: string;
    };

    term: {
        id: string;
        code: string;
        name: string;
        academicYear: string;
        termNumber: number;
        status: string;
        isCurrent: boolean;
    };

    summary: {
        handledSubjectCount: number;
        enrolledStudentCount: number;
    };

    subjects:
        FacultySubjectListItem[];
}
