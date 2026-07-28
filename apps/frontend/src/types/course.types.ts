import type {
    AcademicTermSummary,
    ScheduleItem,
    SectionStatus,
} from "./common.types";

export interface CourseSummary {
    id: string;
    courseCode: string;
    courseName: string;
    description?: string;
    units: number;
    department: string;
}

export interface AvailableSection {
    id: string;
    sectionCode: string;

    course: CourseSummary;
    academicTerm: AcademicTermSummary;

    faculty: {
        id: string;
        employeeNumber: string;
        displayName: string;
    };

    schedule: ScheduleItem[];

    capacity: number;
    enrolledCount: number;
    availableSlots: number;

    status: SectionStatus;
    isFull: boolean;
    isAlreadyEnrolled: boolean;
}

export interface AvailableCoursesResponse {
    currentTerm: AcademicTermSummary;
    sections: AvailableSection[];
}