import type {
    AcademicTermSummary,
    GradeResult,
    GradeStatus,
    GradeType,
    ISODateString,
} from "./common.types";

export interface StudentGradeRecord {
    id: string;
    studentId: string;
    sectionId: string;
    academicTermId: string;

    courseCode: string;
    courseName: string;
    sectionCode: string;
    units: number;

    numericGrade?: number;
    gradeCode?: string;

    result: GradeResult;
    status: GradeStatus;

    submittedAt?: ISODateString;
    verifiedAt?: ISODateString;
}

export interface StudentGradesResponse {
    student: {
        id: string;
        studentNumber: string;
        programName: string;
        curriculumCode: string;
        college: string;
        campus: string;
    };

    currentGpa: number | null;
    availableTerms: AcademicTermSummary[];
    grades: StudentGradeRecord[];
}

export interface GradeComponents {
    activitiesScore?: number;
    midtermScore?: number;
    finalScore?: number;
}

export interface GradeEntryStudent {
    gradeId?: string;

    studentId: string;
    studentNumber: string;
    fullName: string;

    components: GradeComponents;

    computedScore?: number;
    numericGrade?: number;
    gradeCode?: string;

    result: GradeResult;
    status: GradeStatus;
    version: number;
}

export interface GradeEntrySectionResponse {
    section: {
        id: string;
        sectionCode: string;

        courseCode: string;
        courseName: string;

        scheduleLabel: string;
        room: string;

        totalStudents: number;
        gradedStudents: number;
    };

    gradeType: GradeType;
    submissionStatus: GradeStatus;
    lastSavedAt?: ISODateString;

    students: GradeEntryStudent[];
    }

export interface GradeUpdateInput {
    gradeId?: string;
    studentId: string;

    activitiesScore?: number;
    midtermScore?: number;
    finalScore?: number;

    expectedVersion: number;
}

export interface SaveGradeDraftRequest {
    sectionId: string;
    gradeType: GradeType;
    grades: GradeUpdateInput[];
}

export interface SaveGradeDraftResponse {
    sectionId: string;
    gradeType: GradeType;
    savedCount: number;
    completedCount: number;
    totalStudents: number;
    status: "DRAFT";
    savedAt: ISODateString;
}

export interface SubmitGradesRequest {
    sectionId: string;
    gradeType: GradeType;
}

export interface SubmitGradesResponse {
    sectionId: string;
    gradeType: GradeType;
    completedCount: number;
    totalStudents: number;
    status: "SUBMITTED";
    submittedAt: ISODateString;
}

export interface GradeSubmissionRecord {
    id: string;
    sectionId: string;

    courseCode: string;
    courseName: string;
    sectionCode: string;

    gradeType: GradeType;
    submittedAt?: ISODateString;

    completedCount: number;
    totalStudents: number;

    status: GradeStatus;
    returnReason?: string;
}