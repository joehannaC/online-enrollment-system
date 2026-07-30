import type {
    AccountStatus,
    AcademicTermSummary,
    EnrollmentStatus,
    GradeResult,
    ISODateString,
    ScheduleItem,
} from "./common.types";

export interface StudentProfileSummary {
    id: string;
    studentNumber: string;

    firstName: string;
    middleName?: string;
    lastName: string;
    fullName: string;

    programCode: string;
    programName: string;
    curriculumCode: string;

    college: string;
    campus: string;
    yearLevel: number;
    requiredUnits: number;
}

export interface StudentProfileResponse {
    student: {
        id: string;
        studentNumber: string;

        firstName: string;
        middleName?: string;
        lastName: string;
        fullName: string;

        email: string;
        address?: string;
        birthday?: ISODateString;

        programCode: string;
        programName: string;
        curriculumCode: string;

        college: string;
        campus: string;
        yearLevel: number;

        requiredUnits: number;
        earnedUnits: number;
        remainingUnits: number;
        enrolledUnits: number;
        enlistedUnits: number;

        status: AccountStatus;
    };
}

export interface RegisteredCourse {
    enrollmentId: string;
    sectionId: string;

    courseCode: string;
    courseName: string;
    units: number;
    sectionCode: string;

    schedule: ScheduleItem[];
    enrollmentStatus: EnrollmentStatus;
}

export interface StudentScheduleEntry {
    enrollmentId: string;
    sectionId: string;

    courseCode: string;
    courseName: string;
    sectionCode: string;

    day: string;
    startTime: string;
    endTime: string;
    room: string;
}

export interface AnnouncementItem {
    id: string;
    title: string;
    message: string;
    publishedAt: ISODateString;
}

export interface StudentDashboardResponse {
    student: StudentProfileSummary;
    currentTerm: AcademicTermSummary;

    summary: {
        registeredCourseCount: number;
        registeredUnits: number;
    };

    registeredCourses: RegisteredCourse[];
    todaySchedule: StudentScheduleEntry[];
    announcements: AnnouncementItem[];
}

export interface AcademicRecordSummary {
    requiredUnits: number;
    earnedUnits: number;
    remainingUnits: number;
    enrolledUnits: number;
    enlistedUnits: number;
}

export interface CourseHistoryRecord {
    enrollmentId: string;
    courseId: string;
    sectionId: string;
    academicTermId: string;

    courseCode: string;
    courseName: string;
    units: number;

    academicYear: string;
    termName: string;
    sectionCode: string;

    enrollmentStatus: EnrollmentStatus;
    grade?: number;
    gradeCode?: string;
    result?: GradeResult;
}

export interface StudentRecordsResponse {
    student: StudentProfileSummary;
    summary: AcademicRecordSummary;
    availableTerms: AcademicTermSummary[];
    records: CourseHistoryRecord[];
}