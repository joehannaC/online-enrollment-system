export type RealtimeEvent =
    | {
        type: "GRADE_UPDATED";
        studentIds: string[];
        facultyId: string;
        sectionId: string;
    }
    | {
        type: "ENROLLMENT_UPDATED";
        studentId: string;
        facultyIds: string[];
        sectionIds: string[];
    };

export interface RealtimeJwtPayload {
    userId: string;
    username?: string;
    role: "STUDENT" | "FACULTY";
    studentId?: string;
    facultyId?: string;
}
