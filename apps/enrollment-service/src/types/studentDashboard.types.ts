export type EnrollmentStatus =
    | "REGISTERED"
    | "IN_PROGRESS";

export type AcademicTermStatus =
    | "UPCOMING"
    | "ACTIVE"
    | "COMPLETED";

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

export interface RegisteredCourse {
    enrollmentId: string;
    sectionId: string;

    courseCode: string;
    courseName: string;

    units: number;
    nonAcademicUnits: number;

    sectionCode: string;

    schedule: ScheduleItem[];

    enrollmentStatus:
        EnrollmentStatus;
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
    publishedAt: string;
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