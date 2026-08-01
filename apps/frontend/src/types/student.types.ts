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
    nonAcademicUnits: number;

    sectionCode: string;

    schedule:
        ScheduleItem[];

    enrollmentStatus:
        | "REGISTERED"
        | "IN_PROGRESS";
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
    student:
        StudentProfileSummary;

    currentTerm:
        AcademicTermSummary;

    summary: {
        registeredCourseCount:
            number;

        registeredUnits:
            number;

        registeredNonAcademicUnits:
            number;
    };

    registeredCourses:
        RegisteredCourse[];

    todaySchedule:
        StudentScheduleEntry[];

    announcements:
        AnnouncementItem[];
}