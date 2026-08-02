import type { ObjectId } from "mongodb";

export interface UserDocument {
    _id: ObjectId;
    email: string;
    username: string;
    role: "STUDENT" | "FACULTY";
    accountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    createdAt?: Date;
    updatedAt?: Date;
}

export interface StudentProfileDocument {
    _id: ObjectId;
    userId: ObjectId;
    studentNumber: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    programCode: string;
    programName: string;
    curriculumCode: string;
    college: string;
    campus: string;
    yearLevel: number;
    requiredUnits?: number;
    earnedUnits?: number;
    remainingUnits?: number;
    enrolledUnits?: number;
    status: string;
}

export interface FacultyProfileDocument {
    _id: ObjectId;
    userId: ObjectId;
    employeeNumber: string;
    title?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    department: string;
    college: string;
    status: string;
}
