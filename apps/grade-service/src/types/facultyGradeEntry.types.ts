export interface GradeComponents {
    activitiesScore?: number;
    majorOutput1Score?: number;
    majorOutput2Score?: number;
    midtermExamScore?: number;
    finalExamScore?: number;
}

export interface GradeEntryStudent {
    gradeId?: string;
    studentId: string;
    studentNumber: string;
    fullName: string;

    components: GradeComponents;

    rawFinalGrade?: number;
    finalGradeValue?: number;

    status:
        | "DRAFT"
        | "SUBMITTED";

    version: number;
}

export interface GradeEntrySubject {
    sectionId: string;
    sectionCode: string;
    courseId: string;
    courseCode: string;
    courseName: string;
    scheduleLabel: string;
    room: string;
    totalStudents: number;
    gradedStudents: number;
    submissionStatus:
        | "DRAFT"
        | "SUBMITTED";
}

export interface GradeEntryPageResponse {
    selectedSection:
        GradeEntrySubject | null;

    subjects:
        GradeEntrySubject[];

    students:
        GradeEntryStudent[];

    lastSavedAt?: string;
}

export interface GradeDraftInput {
    sectionId: string;
    grades: Array<{
        gradeId?: string;
        studentId: string;
        expectedVersion: number;
        components: GradeComponents;
    }>;
}

export interface GradeDraftResult {
    sectionId: string;
    savedCount: number;
    completedCount: number;
    totalStudents: number;
    status: "DRAFT";
    savedAt: string;
}

export interface SubmitGradesResult {
    sectionId: string;
    completedCount: number;
    totalStudents: number;
    status: "SUBMITTED";
    submittedAt: string;
}
