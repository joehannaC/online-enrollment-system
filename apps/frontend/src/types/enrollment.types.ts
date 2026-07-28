import type {
    AcademicTermSummary,
    EnrollmentStatus,
    ISODateString,
    ScheduleItem,
} from "./common.types";

export interface EnrollmentRequest {
    sectionId: string;
}

export interface EnrollmentResponse {
    enrollment: {
        id: string;
        studentId: string;
        sectionId: string;
        academicTermId: string;
        status: EnrollmentStatus;
        enrolledAt: ISODateString;
    };

    section: {
        id: string;
        courseCode: string;
        courseName: string;
        sectionCode: string;
        units: number;
        enrolledCount: number;
        capacity: number;
        availableSlots: number;
    };
}

export interface EnrollmentSelection {
    sectionId: string;
    courseCode: string;
    courseName: string;
    sectionCode: string;
    units: number;
    facultyName: string;
    schedule: ScheduleItem[];
}

export interface EnrollmentConfirmationResponse {
    academicTerm: AcademicTermSummary;
    selections: EnrollmentSelection[];

    summary: {
        courseCount: number;
        totalUnits: number;
    };
}

export interface CurrentEnrollmentRecord {
    enrollmentId: string;
    sectionId: string;

    courseCode: string;
    courseName: string;
    sectionCode: string;
    units: number;

    facultyName: string;
    schedule: ScheduleItem[];

    status: EnrollmentStatus;
    enrolledAt?: ISODateString;
}

export interface CurrentEnrollmentsResponse {
    academicTerm: AcademicTermSummary;
    enrollments: CurrentEnrollmentRecord[];
    totalUnits: number;
}