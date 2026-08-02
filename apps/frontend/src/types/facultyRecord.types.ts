export type FacultyRecordStatus =
    | "SUBMITTED"
    | "DRAFT"
    | "INCOMPLETE";

export interface FacultyRecordStudent {
    studentId: string;
    studentNumber: string;
    fullName: string;

    activity: number | null;
    majorOutput1: number | null;
    majorOutput2: number | null;
    midtermExam: number | null;
    finalExam: number | null;

    finalGradeValue: number | null;
    gradeStatus: FacultyRecordStatus;
}

export interface FacultyRecordItem {
    sectionId: string;
    sectionCode: string;

    courseId: string;
    courseCode: string;
    courseName: string;

    enrolledStudents: number;
    submittedStudents: number;

    status: FacultyRecordStatus;
    submittedAt?: string;
    lastSavedAt?: string;

    students: FacultyRecordStudent[];
}

export interface FacultyRecordsResponse {
    term: {
        id: string;
        code: string;
        name: string;
        academicYear: string;
        termNumber: number;
    };

    summary: {
        submittedClasses: number;
        studentRecords: number;
        drafts: number;
        incomplete: number;
    };

    records: FacultyRecordItem[];
}
