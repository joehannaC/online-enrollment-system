export type FacultySubjectGradeStatus =
    | "PENDING"
    | "DRAFT"
    | "SUBMITTED"
    | "VERIFIED"
    | "RETURNED";

export interface FacultySubjectSchedule {
    days: string[];
    startTime: string;
    endTime: string;
    room: string;
}

export interface FacultySubjectStudent {
    studentId: string;
    studentNumber: string;
    fullName: string;
    finalGradeValue: number | null;
    gradeStatus: FacultySubjectGradeStatus;
}

export interface FacultySubjectItem {
    sectionId: string;
    sectionCode: string;

    courseId: string;
    courseCode: string;
    courseName: string;

    schedule: FacultySubjectSchedule[];

    enrolledStudents: number;
    gradedStudents: number;
    pendingGrades: number;

    students: FacultySubjectStudent[];
}

export interface FacultySubjectsResponse {
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

    subjects: FacultySubjectItem[];
}
