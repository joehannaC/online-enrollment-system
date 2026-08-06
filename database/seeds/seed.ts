import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import {
    MongoClient,
    ObjectId,
    type ClientSession,
    type Db,
} from "mongodb";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    calculateAcademicSummary,
    getGpeFromRawPercentage,
    type AcademicGradeInput,
} from "../../packages/shared/src/index.js";

const currentFilePath =
    fileURLToPath(import.meta.url);

const currentDirectory =
    path.dirname(currentFilePath);

const projectRoot =
    path.resolve(
        currentDirectory,
        "../..",
    );

const authEnvironmentPath =
    path.resolve(
        projectRoot,
        "apps/auth-service/.env",
    );

const seedEnvironmentPath =
    path.resolve(
        projectRoot,
        "database/seeds/.env",
    );

/*
 * The authentication service environment is the source of truth
 * for the MongoDB connection used by the seed. The seed-specific
 * environment file is loaded only as a fallback and does not
 * overwrite values already loaded from auth-service/.env.
 */
dotenv.config({
    path: authEnvironmentPath,
});

dotenv.config({
    path: seedEnvironmentPath,
    override: false,
});

const mongoUri =
    process.env.MONGODB_URI?.trim();

if (!mongoUri) {
    throw new Error(
        `MONGODB_URI is missing. Add it to ${authEnvironmentPath} or ${seedEnvironmentPath}.`,
    );
}

const databaseName =
    process.env.MONGODB_DATABASE?.trim() ||
    process.env.MONGODB_DB_NAME?.trim() ||
    "online_enrollment";

const resetRequested =
    process.argv.includes("--reset");

const seedTag =
    "CS-ST18-2021-DEMO";

const demoPassword =
    process.env.SEED_DEMO_PASSWORD?.trim() ||
    "Password123!";

function normalizeEmail(
    value: string,
): string {
    return value
        .trim()
        .toLowerCase();
}

type CourseCategory =
    | "GENERAL_EDUCATION"
    | "LASALLIAN_STUDIES"
    | "COMMON_COMPUTING"
    | "COMMON_MATH"
    | "CS_PROFESSIONAL"
    | "ST_SPECIALIZATION"
    | "PROFESSIONAL_ELECTIVE"
    | "THESIS"
    | "PRACTICUM"
    | "NSTP"
    | "OTHER_NON_ACADEMIC";

interface CurriculumCourse {
    code: string;
    name: string;
    academicUnits: number;
    nonAcademicUnits: number;
    trimester: number;
    category: CourseCategory;
    prerequisiteCodes?: string[];
}

function oid(scope: string, key: string): ObjectId {
    return new ObjectId(
        createHash("sha256")
            .update(`${seedTag}:${scope}:${key}`)
            .digest("hex")
            .slice(0, 24),
    );
}

const ids = {
    users: {
        student1: oid("user", "student1"),
        student2: oid("user", "student2"),
        student3: oid("user", "student3"),
        facultyCC: oid("user", "faculty-cc"),
        facultyCS: oid("user", "faculty-cs"),
        facultyGE: oid("user", "faculty-ge"),
        facultyST: oid("user", "faculty-st"),
    },

    students: {
        student1: oid("student", "student1"),
        student2: oid("student", "student2"),
        student3: oid("student", "student3"),
    },

    faculty: {
        facultyCC: oid("faculty", "faculty-cc"),
        facultyCS: oid("faculty", "faculty-cs"),
        facultyGE: oid("faculty", "faculty-ge"),
        facultyST: oid("faculty", "faculty-st"),
    },

    terms: {
        current: oid("term", "AY2025-2026-T3"),
        next: oid("term", "AY2026-2027-T1"),
    },
};

const curriculum: CurriculumCourse[] = [
    // 1st Trimester — 14 academic, 0 non-academic
    { code: "CCPROG1", name: "Logic Formulation and Introductory Programming", academicUnits: 3, nonAcademicUnits: 0, trimester: 1, category: "COMMON_COMPUTING" },
    { code: "CCICOMP", name: "Introduction to Computing", academicUnits: 3, nonAcademicUnits: 0, trimester: 1, category: "COMMON_COMPUTING" },
    { code: "MTH101A", name: "Algebra and Trigonometry", academicUnits: 5, nonAcademicUnits: 0, trimester: 1, category: "COMMON_MATH" },
    { code: "GEPCOMM", name: "Purposive Communication", academicUnits: 3, nonAcademicUnits: 0, trimester: 1, category: "GENERAL_EDUCATION" },
    
    // 2nd Trimester — 17 academic, 3 non-academic
    { code: "CCPROG2", name: "Programming with Structured Data Types", academicUnits: 3, nonAcademicUnits: 0, trimester: 2, category: "COMMON_COMPUTING", prerequisiteCodes: ["CCPROG1"] },
    { code: "CCDSTRU", name: "Discrete Structures", academicUnits: 3, nonAcademicUnits: 0, trimester: 2, category: "COMMON_COMPUTING", prerequisiteCodes: ["MTH101A"] },
    { code: "CSMATH1", name: "Differential Calculus", academicUnits: 3, nonAcademicUnits: 0, trimester: 2, category: "COMMON_MATH", prerequisiteCodes: ["MTH101A"] },
    { code: "GEFTWEL", name: "Physical Fitness and Wellness", academicUnits: 2, nonAcademicUnits: 0, trimester: 2, category: "GENERAL_EDUCATION" },
    { code: "GELECSP", name: "General Education Elective – Filipino", academicUnits: 3, nonAcademicUnits: 0, trimester: 2, category: "GENERAL_EDUCATION" },
    { code: "LASARE1", name: "Lasallian Reflection 1", academicUnits: 0, nonAcademicUnits: 0, trimester: 2, category: "OTHER_NON_ACADEMIC" },
    { code: "NSTP-01", name: "National Service Training Program 1", academicUnits: 0, nonAcademicUnits: 3, trimester: 2, category: "NSTP" },

    // 3rd Trimester — 17 academic, 3 non-academic
    { code: "CCPROG3", name: "Object-Oriented Programming", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "COMMON_COMPUTING", prerequisiteCodes: ["CCPROG2"] },
    { code: "CCDSALG", name: "Data Structures and Algorithms", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "COMMON_COMPUTING", prerequisiteCodes: ["CCPROG2", "CCDSTRU"] },
    { code: "CSMATH2", name: "Linear Algebra for Computer Science", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "COMMON_MATH", prerequisiteCodes: ["CSMATH1"] },
    { code: "STT101A", name: "Probability and Statistics", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "COMMON_MATH" },
    { code: "GEDANCE", name: "Physical Fitness and Wellness in Dance", academicUnits: 2, nonAcademicUnits: 0, trimester: 3, category: "GENERAL_EDUCATION" },
    { code: "GESTSOC", name: "Science, Technology, and Society", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "GENERAL_EDUCATION" },
    { code: "SAS1000", name: "Student Affairs Services 1000", academicUnits: 0, nonAcademicUnits: 0, trimester: 3, category: "OTHER_NON_ACADEMIC" },
    { code: "NSTP-02", name: "National Service Training Program 2", academicUnits: 0, nonAcademicUnits: 3, trimester: 3, category: "NSTP" },

    // 4th Trimester — 17 academic
    { code: "CSADPRG", name: "Advanced Programming Techniques", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CCPROG3"] },
    { code: "CCINFOM", name: "Information Management", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "COMMON_COMPUTING", prerequisiteCodes: ["CCPROG2"] },
    { code: "CSALGCM", name: "Algorithms and Complexity", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CCDSALG", "CCDSTRU"] },
    { code: "CSINTSY", name: "Introduction to Artificial Intelligence", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CCDSALG"] },
    { code: "GESPORT", name: "Physical Fitness and Wellness in Individual Sports", academicUnits: 2, nonAcademicUnits: 0, trimester: 4, category: "GENERAL_EDUCATION" },
    { code: "LCASEAN", name: "The Filipino and ASEAN", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "GENERAL_EDUCATION" },

    // 5th Trimester — 17 academic, 1 non-academic
    { code: "CCAPDEV", name: "Web Application Development", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "COMMON_COMPUTING", prerequisiteCodes: ["CCPROG3", "CCINFOM"] },
    { code: "CSARCH1", name: "Computer Organization and Architecture 1", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CCICOMP", "CCPROG2"] },
    { code: "STALGCM", name: "Advanced Algorithms and Complexities", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "ST_SPECIALIZATION", prerequisiteCodes: ["CSALGCM"] },
    { code: "ST-MATH", name: "Integral Calculus for Computer Science Students", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "ST_SPECIALIZATION", prerequisiteCodes: ["CSMATH1"] },
    { code: "GETEAMS", name: "Physical Fitness and Wellness in Team Sports", academicUnits: 2, nonAcademicUnits: 0, trimester: 5, category: "GENERAL_EDUCATION" },
    { code: "GERPHIS", name: "Readings in Philippine History", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "GENERAL_EDUCATION" },
    { code: "LCLSONE", name: "Lasallian Studies 1", academicUnits: 0, nonAcademicUnits: 1, trimester: 5, category: "LASALLIAN_STUDIES" },
    { code: "LASARE2", name: "Lasallian Reflection 2", academicUnits: 0, nonAcademicUnits: 0, trimester: 5, category: "OTHER_NON_ACADEMIC" },

    // 6th Trimester — 15 academic
    { code: "CSSWENG", name: "Software Engineering", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CCAPDEV"] },
    { code: "STHCIUX", name: "Human Computer Interaction and User Experience", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "ST_SPECIALIZATION", prerequisiteCodes: ["CCAPDEV"] },
    { code: "CSNETWK", name: "Introduction to Computer Networks", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CSARCH1"] },
    { code: "CSMODEL", name: "Modelling and Simulation", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CCPROG3", "STT101A"] },
    { code: "GELECAH", name: "General Education Elective – Arts and Humanities", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "GENERAL_EDUCATION" },
    { code: "SAS2000", name: "Student Affairs Services 2000", academicUnits: 0, nonAcademicUnits: 0, trimester: 6, category: "OTHER_NON_ACADEMIC" },

    // 7th Trimester — 16 academic, 1 non-academic
    { code: "STSWENG", name: "Advanced Software Engineering", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "ST_SPECIALIZATION", prerequisiteCodes: ["CSSWENG"] },
    { code: "STADVDB", name: "Advanced Database Systems", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "ST_SPECIALIZATION", prerequisiteCodes: ["CCINFOM"] },
    { code: "CSARCH2", name: "Computer Organization and Architecture 2", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CSARCH1"] },
    { code: "LBYARCH", name: "Computer Architecture Laboratory", academicUnits: 1, nonAcademicUnits: 0, trimester: 7, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CSARCH1"] },
    { code: "STELEC1", name: "ST Professional Elective 1 – Ethical Hacking", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "PROFESSIONAL_ELECTIVE" },
    { code: "LCENWRD", name: "Encountering the Word in the World", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "GENERAL_EDUCATION" },
    { code: "SAS3000", name: "Student Affairs Services 3000", academicUnits: 0, nonAcademicUnits: 0, trimester: 7, category: "OTHER_NON_ACADEMIC", prerequisiteCodes: ["SAS2000"] },
    { code: "LCLSTWO", name: "Lasallian Studies 2", academicUnits: 0, nonAcademicUnits: 1, trimester: 7, category: "LASALLIAN_STUDIES" },
    { code: "LASARE3", name: "Lasallian Reflection 3", academicUnits: 0, nonAcademicUnits: 0, trimester: 7, category: "OTHER_NON_ACADEMIC" },

    // 8th Trimester — 6 academic
    { code: "STMETHD", name: "Software Technology Research Methods", academicUnits: 3, nonAcademicUnits: 0, trimester: 8, category: "ST_SPECIALIZATION", prerequisiteCodes: ["STSWENG"] },
    { code: "PRCCSST", name: "Practicum for Software Technology", academicUnits: 3, nonAcademicUnits: 0, trimester: 8, category: "PRACTICUM", prerequisiteCodes: ["CSSWENG"] },

    // 9th Trimester — 14 academic
    { code: "MOBDEVE", name: "Mobile Development", academicUnits: 3, nonAcademicUnits: 0, trimester: 9, category: "ST_SPECIALIZATION", prerequisiteCodes: ["CCAPDEV"] },
    { code: "THS-ST1", name: "Thesis for Software Technology 1", academicUnits: 2, nonAcademicUnits: 0, trimester: 9, category: "THESIS", prerequisiteCodes: ["STMETHD"] },
    { code: "CSOPESY", name: "Introduction to Operating Systems", academicUnits: 3, nonAcademicUnits: 0, trimester: 9, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CSARCH2"] },
    { code: "STINTSY", name: "Advanced Intelligent Systems", academicUnits: 3, nonAcademicUnits: 0, trimester: 9, category: "ST_SPECIALIZATION", prerequisiteCodes: ["CSINTSY"] },
    { code: "STELEC2", name: "ST Professional Elective 2 – Solid Data Engineering", academicUnits: 3, nonAcademicUnits: 0, trimester: 9, category: "PROFESSIONAL_ELECTIVE" },

    // 10th Trimester — 14 academic
    { code: "THS-ST2", name: "Thesis for Software Technology 2", academicUnits: 2, nonAcademicUnits: 0, trimester: 10, category: "THESIS", prerequisiteCodes: ["THS-ST1"] },
    { code: "STDISCM", name: "Distributed Computing", academicUnits: 3, nonAcademicUnits: 0, trimester: 10, category: "ST_SPECIALIZATION", prerequisiteCodes: ["CSNETWK", "CSOPESY"] },
    { code: "STELEC3", name: "ST Professional Elective 3 – Human-Computer Interaction", academicUnits: 3, nonAcademicUnits: 0, trimester: 10, category: "PROFESSIONAL_ELECTIVE" },
    { code: "STELEC4", name: "ST Professional Elective 4 – Advanced Data Analytics", academicUnits: 3, nonAcademicUnits: 0, trimester: 10, category: "PROFESSIONAL_ELECTIVE" },
    { code: "GEETHIC", name: "Ethics", academicUnits: 3, nonAcademicUnits: 0, trimester: 10, category: "GENERAL_EDUCATION" },

    // 11th Trimester — 14 academic, 1 non-academic
    { code: "CSSECDV", name: "Secure Web Development", academicUnits: 3, nonAcademicUnits: 0, trimester: 11, category: "CS_PROFESSIONAL", prerequisiteCodes: ["CCAPDEV"] },
    { code: "CCINOV8", name: "Innovation and Technology Management", academicUnits: 3, nonAcademicUnits: 0, trimester: 11, category: "COMMON_COMPUTING", prerequisiteCodes: ["CSSWENG"] },
    { code: "THS-ST3", name: "Thesis for Software Technology 3", academicUnits: 2, nonAcademicUnits: 0, trimester: 11, category: "THESIS", prerequisiteCodes: ["THS-ST2"] },
    { code: "GELECST", name: "General Education Elective – Filipino Literature", academicUnits: 3, nonAcademicUnits: 0, trimester: 11, category: "GENERAL_EDUCATION" },
    { code: "GEWORLD", name: "The Contemporary World", academicUnits: 3, nonAcademicUnits: 0, trimester: 11, category: "GENERAL_EDUCATION" },
    { code: "LCLSTRI", name: "Lasallian Studies 3", academicUnits: 0, nonAcademicUnits: 1, trimester: 11, category: "LASALLIAN_STUDIES" },

    // 12th Trimester — 12 academic
    { code: "GERIZAL", name: "Life and Works of Rizal", academicUnits: 3, nonAcademicUnits: 0, trimester: 12, category: "GENERAL_EDUCATION" },
    { code: "GEARTAP", name: "Art Appreciation", academicUnits: 3, nonAcademicUnits: 0, trimester: 12, category: "GENERAL_EDUCATION" },
    { code: "GEUSELF", name: "Understanding the Self", academicUnits: 3, nonAcademicUnits: 0, trimester: 12, category: "GENERAL_EDUCATION" },
    { code: "LCFAITH", name: "Faith Worth Living", academicUnits: 3, nonAcademicUnits: 0, trimester: 12, category: "GENERAL_EDUCATION", prerequisiteCodes: ["LCLSTRI"] },
];

const exactStudentMissingCourses = new Set([
    "PRCCSST",
    "STDISCM",
    "CSADPRG",
]);

const student1CreditedCourses = new Set([
    "CCPROG1",
    "CCICOMP",
    "MTH101A",
]);

const student2FailedCourses = new Set([
    // Trimester 7 maps to Term 1. It can be retaken in Term 1
    // of a later academic year, including AY 2026-2027.
    "STELEC1",
]);

const studentCurrentCourses = {
    student1: new Set([
        "STDISCM",
        "PRCCSST",
    ]),
    student2: new Set([
        "STINTSY",
        "STDISCM",
        "CSADPRG",
    ]),
    student3: new Set([
        "CSADPRG",
        "CSSECDV",
        "GEWORLD",
    ]),
} as const;

interface PreviousAcademicRecord {
    previousGpa: number;
    previousGradedUnits: number;
    previousGradePoints: number;
}

const previousAcademicRecords:
    Partial<
        Record<
            "student1" |
                "student2" |
                "student3",
            PreviousAcademicRecord
        >
    > = {
        student1: {
            previousGpa: 1.88,
            previousGradedUnits: 161,
            previousGradePoints: 302.68,
    },
        student2: {
            previousGpa: 2.79,
            previousGradedUnits: 115,
            previousGradePoints: 320.85,
    },
    };

const facultyProfiles = [
    {
        key: "facultyCC",
        email: "cc.faculty@university.edu",
        username: "prof.cc",
        employeeNumber: "FAC-CC-001",
        title: "Prof.",
        firstName: "Carla",
        lastName: "Cruz",
        department: "Common Computing Courses",
        specializationGroup: "CC",
        address: "Manila, Metro Manila",
        birthday: new Date("1987-04-15"),
        campus: "Manila Campus",
    },
    {
        key: "facultyCS",
        email: "cs.faculty@university.edu",
        username: "prof.cs",
        employeeNumber: "FAC-CS-001",
        title: "Prof.",
        firstName: "Carlos",
        lastName: "Santos",
        department: "Computer Science",
        specializationGroup: "CS",
        address: "Makati City, Metro Manila",
        birthday: new Date("1983-09-23"),
        campus: "Manila Campus",
    },
    {
        key: "facultyGE",
        email: "ge.faculty@university.edu",
        username: "prof.ge",
        employeeNumber: "FAC-GE-001",
        title: "Prof.",
        firstName: "Grace",
        lastName: "Evangelista",
        department: "General Education",
        specializationGroup: "GE",
        address: "Quezon City, Metro Manila",
        birthday: new Date("1989-01-12"),
        campus: "Manila Campus",
    },
    {
        key: "facultyST",
        email: "faculty@university.edu",
        username: "prof.reyes",
        employeeNumber: "FAC-ST-001",
        title: "Prof.",
        firstName: "Andrea",
        lastName: "Reyes",
        department: "Software Technology",
        specializationGroup: "ST_AND_OTHER",
        address: "Pasig City, Metro Manila",
        birthday: new Date("1985-07-30"),
        campus: "Manila Campus",
    },
] as const;

function facultyIdForCourse(
    course: CurriculumCourse,
): ObjectId {
    if (course.category === "COMMON_COMPUTING") {
        return ids.faculty.facultyCC;
    }

    if (
        course.category === "COMMON_MATH" ||
        course.category === "CS_PROFESSIONAL"
    ) {
        return ids.faculty.facultyCS;
    }

    if (
        course.category === "GENERAL_EDUCATION" ||
        course.category === "LASALLIAN_STUDIES" ||
        course.category === "NSTP"
    ) {
        return ids.faculty.facultyGE;
    }

    return ids.faculty.facultyST;
}

function getHistoricalTermDates(trimester: number): {
    startDate: Date;
    endDate: Date;
    academicYear: string;
    termNumber: number;
} {
    const sequence = trimester - 1;
    const academicYearStart = 2021 + Math.floor(sequence / 3);
    const termNumber = (sequence % 3) + 1;
    const startMonths = [0, 4, 8];
    const month = startMonths[termNumber - 1];

    return {
        startDate: new Date(
            Date.UTC(academicYearStart, month, 10),
        ),
        endDate: new Date(
            Date.UTC(
                termNumber === 3
                    ? academicYearStart + 1
                    : academicYearStart,
                termNumber === 1
                    ? 3
                    : termNumber === 2
                        ? 7
                        : 11,
                20,
            ),
        ),
        academicYear: `${academicYearStart}-${academicYearStart + 1}`,
        termNumber,
    };
}

async function createIndexes(db: Db): Promise<void> {
    await Promise.all([
        db.collection("users").createIndex(
            { email: 1 },
            { unique: true },
        ),
        db.collection("users").createIndex(
            { username: 1 },
            { unique: true },
        ),
        db.collection("students").createIndex(
            { userId: 1 },
            { unique: true },
        ),
        db.collection("students").createIndex(
            { studentNumber: 1 },
            { unique: true },
        ),
        db.collection("faculty").createIndex(
            { userId: 1 },
            { unique: true },
        ),
        db.collection("faculty").createIndex(
            { employeeNumber: 1 },
            { unique: true },
        ),
        db.collection("academicTerms").createIndex(
            { code: 1 },
            { unique: true },
        ),
        db.collection("courses").createIndex(
            { courseCode: 1 },
            { unique: true },
        ),
        db.collection("sections").createIndex(
            {
                courseId: 1,
                sectionCode: 1,
                academicTermId: 1,
            },
            { unique: true },
        ),
        db.collection("enrollments").createIndex(
            {
                studentId: 1,
                sectionId: 1,
            },
            { unique: true },
        ),
        db.collection("grades").createIndex(
            {
                studentId: 1,
                sectionId: 1,
            },
            { unique: true },
        ),
        db.collection("gradeSubmissions").createIndex(
            {
                sectionId: 1,
                gradeType: 1,
            },
            { unique: true },
        ),
        db.collection("studentEnrollments").createIndex(
            {
                studentId: 1,
                academicTermId: 1,
            },
            {
                unique: true,
                name: "unique_student_enrollment_term",
            },
        ),
        db.collection("studentEnrollmentItems").createIndex(
            {
                enrollmentId: 1,
                courseId: 1,
            },
            {
                unique: true,
                name: "unique_enrollment_course",
            },
        ),
        db.collection("studentEnrollmentItems").createIndex(
            {
                enrollmentId: 1,
                sectionId: 1,
            },
            {
                unique: true,
                name: "unique_enrollment_section",
            },
        ),
    ]);
}

async function clearSeedData(
    db: Db,
    session: ClientSession,
): Promise<void> {
    const collections = [
        "studentEnrollmentItems",
        "studentEnrollments",
        "gradeSubmissions",
        "grades",
        "enrollments",
        "sections",
        "announcements",
        "courses",
        "academicTerms",
        "faculty",
        "students",
        "users",
    ];

    for (const collectionName of collections) {
        await db.collection(collectionName).deleteMany(
            {},
            { session },
        );
    }
}

async function upsertById(
    db: Db,
    collectionName: string,
    document: Record<string, unknown> & {
        _id: ObjectId;
    },
    session: ClientSession,
): Promise<void> {
    const { _id, ...fields } = document;

    await db.collection(collectionName).updateOne(
        { _id },
        {
            $set: fields,
            $setOnInsert: {
                createdAt: new Date(),
            },
        },
        {
            upsert: true,
            session,
        },
    );
}

function scoreFor(
    studentKey: string,
    courseCode: string,
): {
    computedScore: number;
    finalGradeValue: number;
} {
    const hash = createHash("sha256")
        .update(
            `${studentKey}:${courseCode}`,
        )
        .digest();

    /*
     * Generate deterministic demo grades from
     * 60 through 100. The same student/course
     * pair always receives the same raw score.
     */
    const computedScore =
        60 + (hash[0] % 41);

    return {
        computedScore,
        finalGradeValue:
            getGpeFromRawPercentage(
                computedScore,
            ),
    };
}


const enrollmentDemoCounts = [
    0,
    1,
    3,
    5,
    12,
    22,
    23,
    30,
    39,
    42,
    44,
    45,
] as const;

function getDemoEnrolledCount(
    sectionIndex: number,
): number {
    return enrollmentDemoCounts[
        sectionIndex %
            enrollmentDemoCounts.length
    ];
}

function validateCurriculumUnits(): void {
    const academicTotal =
        curriculum.reduce(
            (sum, course) =>
                sum +
                course.academicUnits,
            0,
        );

    const nonAcademicCourses =
        curriculum.filter(
            (course) =>
                course.nonAcademicUnits >
                0,
        );

    const nonAcademicTotal =
        nonAcademicCourses.reduce(
            (sum, course) =>
                sum +
                course.nonAcademicUnits,
            0,
        );

    if (academicTotal !== 170) {
        throw new Error(
            `Expected 170 academic units, but found ${academicTotal}.`,
        );
    }

    const expectedNonAcademicUnits =
        new Map<string, number>([
            ["NSTP-01", 3],
            ["NSTP-02", 3],
            ["LCLSONE", 1],
            ["LCLSTWO", 1],
            ["LCLSTRI", 1],
        ]);

    const hasExpectedBreakdown =
        expectedNonAcademicUnits.size ===
            nonAcademicCourses.length &&
        nonAcademicCourses.every(
            (course) =>
                expectedNonAcademicUnits.get(
                    course.code,
                ) ===
                course.nonAcademicUnits,
        );

    if (
        nonAcademicTotal !== 9 ||
        !hasExpectedBreakdown
    ) {
        throw new Error(
            "The non-academic units must be NSTP-01=3, NSTP-02=3, LCLSONE=1, LCLSTWO=1, and LCLSTRI=1, for a total of 9.",
        );
    }
}

async function seedDatabase(): Promise<void> {
    validateCurriculumUnits();

    const client = new MongoClient(mongoUri);

    try {
        await client.connect();

        const db = client.db(databaseName);

        console.log(
            `Connected to MongoDB database: ${databaseName}`,
        );

        await createIndexes(db);

        const passwordHash =
            await bcrypt.hash(
                demoPassword,
                12,
            );

        const now = new Date();
        const session = client.startSession();

        try {
            /*
             * The local development database may be a standalone
             * MongoDB server. Standalone servers do not support
             * multi-document transactions, so the seed runs the
             * same idempotent upsert operations without starting
             * a transaction.
             *
             * The ClientSession is still passed to the operations;
             * it simply is not placed inside withTransaction().
             */
            await (async () => {
                if (resetRequested) {
                    console.log(
                        "Removing existing demo seed records...",
                    );

                    await clearSeedData(db, session);
                }

                const userDocuments = [
                    {
                        _id: ids.users.student1,
                        email: "student@university.edu",
                        username: "student.demo",
                        role: "STUDENT",
                    },
                    {
                        _id: ids.users.student2,
                        email: "angela.cruz@university.edu",
                        username: "angela.cruz",
                        role: "STUDENT",
                    },
                    {
                        _id: ids.users.student3,
                        email: "marco.delarosa@university.edu",
                        username: "marco.delarosa",
                        role: "STUDENT",
                    },
                    ...facultyProfiles.map((profile) => ({
                        _id:
                            ids.users[
                            profile.key as keyof typeof ids.users
                            ],
                        email: profile.email,
                        username: profile.username,
                        role: "FACULTY",
                    })),
                ];

                for (const user of userDocuments) {
                    await upsertById(
                        db,
                        "users",
                        {
                            ...user,
                            email:
                                normalizeEmail(
                                    user.email,
                                ),
                            username:
                                user.username
                                    .trim()
                                    .toLowerCase(),
                            passwordHash,
                            accountStatus:
                                "ACTIVE",
                            status:
                                "ACTIVE",
                            requiresPasswordChange:
                                false,
                            failedLoginAttempts:
                                0,
                            lockedUntil:
                                null,
                            seedTag,
                            updatedAt: now,
                        },
                        session,
                    );
                }

                const studentDocuments = [
                    {
                        _id: ids.students.student1,
                        userId: ids.users.student1,
                        studentNumber: "12345678",
                        firstName: "John",
                        lastName: "Doe",
                        address: "Manila, Metro Manila",
                        birthday: new Date("2000-01-01"),
                        yearLevel: 4,
                        earnedUnits: 0,
                        earnedNonAcademicUnits: 0,
                        remainingUnits: 170,
                        enrolledUnits: 0,
                        enrolledNonAcademicUnits: 0,
                        enlistedUnits: 0,
                        enlistedNonAcademicUnits: 0,
                    },
                    {
                        _id: ids.students.student2,
                        userId: ids.users.student2,
                        studentNumber: "12345001",
                        firstName: "Angela",
                        lastName: "Cruz",
                        address: "Quezon City, Metro Manila",
                        birthday: new Date("2002-06-14"),
                        yearLevel: 3,
                        earnedUnits: 0,
                        earnedNonAcademicUnits: 0,
                        remainingUnits: 170,
                        enrolledUnits: 0,
                        enrolledNonAcademicUnits: 0,
                        enlistedUnits: 0,
                        enlistedNonAcademicUnits: 0,
                    },
                    {
                        _id: ids.students.student3,
                        userId: ids.users.student3,
                        studentNumber: "12345002",
                        firstName: "Marco",
                        lastName: "Dela Rosa",
                        address: "Makati City, Metro Manila",
                        birthday: new Date("2003-11-08"),
                        yearLevel: 2,
                        earnedUnits: 0,
                        earnedNonAcademicUnits: 0,
                        remainingUnits: 170,
                        enrolledUnits: 0,
                        enrolledNonAcademicUnits: 0,
                        enlistedUnits: 0,
                        enlistedNonAcademicUnits: 0,
                    },
                ];

                for (const student of studentDocuments) {
                    await upsertById(
                        db,
                        "students",
                        {
                            ...student,
                            programCode: "BSCS-ST",
                            programName:
                                "Bachelor of Science in Computer Science major in Software Technology",
                            curriculumCode: "CS-ST18 (2021)",
                            college:
                                "College of Computer Studies",
                            campus: "Manila Campus",
                            requiredUnits: 170,
                            requiredNonAcademicUnits: 9,
                            enrolledUnits:
                                student.enrolledUnits ?? 0,
                            enrolledNonAcademicUnits:
                                student.enrolledNonAcademicUnits ?? 0,
                            enlistedUnits:
                                student.enlistedUnits ?? 0,
                            enlistedNonAcademicUnits:
                                student.enlistedNonAcademicUnits ?? 0,
                            status: "ACTIVE",
                            seedTag,
                            updatedAt: now,
                        },
                        session,
                    );
                }

                for (const profile of facultyProfiles) {
                    const facultyKey =
                        profile.key as keyof typeof ids.faculty;
                    const userKey =
                        profile.key as keyof typeof ids.users;

                    await upsertById(
                        db,
                        "faculty",
                        {
                            _id: ids.faculty[facultyKey],
                            userId: ids.users[userKey],
                            employeeNumber:
                                profile.employeeNumber,
                            title: profile.title,
                            firstName: profile.firstName,
                            lastName: profile.lastName,
                            department: profile.department,
                            college:
                                profile.specializationGroup ===
                                    "GE"
                                    ? "College of Liberal Arts"
                                    : "College of Computer Studies",
                            specializationGroup:
                                profile.specializationGroup,
                            address: profile.address,
                            birthday: profile.birthday,
                            campus: profile.campus,
                            status: "ACTIVE",
                            seedTag,
                            updatedAt: now,
                        },
                        session,
                    );
                }

                for (
                    let trimester = 1;
                    trimester <= 12;
                    trimester += 1
                ) {
                    const dates =
                        getHistoricalTermDates(trimester);

                    await upsertById(
                        db,
                        "academicTerms",
                        {
                            _id: oid(
                                "term",
                                `curriculum-${trimester}`,
                            ),
                            code: `CS-ST18-TRIM-${trimester}`,
                            name: `Trimester ${trimester}`,
                            academicYear:
                                dates.academicYear,
                            termNumber:
                                dates.termNumber,
                            curriculumTrimester:
                                trimester,
                            startDate: dates.startDate,
                            endDate: dates.endDate,
                            status: "COMPLETED",
                            isCurrent: false,
                            isEnrollmentTerm: false,
                            seedTag,
                            updatedAt: now,
                        },
                        session,
                    );
                }

                await upsertById(
                    db,
                    "academicTerms",
                    {
                        _id: ids.terms.current,
                        code: "AY2025-2026-T3",
                        name: "Term 3",
                        academicYear: "2025-2026",
                        termNumber: 3,
                        startDate: new Date(
                            "2026-05-04",
                        ),
                        endDate: new Date(
                            "2026-08-29",
                        ),
                        enrollmentStart: new Date(
                            "2026-04-15",
                        ),
                        enrollmentEnd: new Date(
                            "2026-05-15",
                        ),
                        gradeSubmissionDeadline:
                            new Date("2026-09-08"),
                        status: "ACTIVE",
                        isCurrent: true,
                        isEnrollmentTerm: false,
                        seedTag,
                        updatedAt: now,
                    },
                    session,
                );

                await upsertById(
                    db,
                    "academicTerms",
                    {
                        _id: ids.terms.next,
                        code: "AY2026-2027-T1",
                        name: "Term 1",
                        academicYear: "2026-2027",
                        termNumber: 1,
                        startDate: new Date(
                            "2026-09-01T00:00:00+08:00",
                        ),
                        endDate: new Date(
                            "2026-12-19",
                        ),
                        enrollmentStart: new Date(
                            "2026-08-01T00:00:00+08:00",
                        ),
                        enrollmentEnd: new Date(
                            "2026-08-15T23:59:59+08:00",
                        ),
                        gradeSubmissionDeadline:
                            new Date("2027-01-08"),
                        status: "UPCOMING",
                        isCurrent: false,
                        isEnrollmentTerm: true,
                        seedTag,
                        updatedAt: now,
                    },
                    session,
                );

                for (const course of curriculum) {
                    await upsertById(
                        db,
                        "courses",
                        {
                            _id: oid(
                                "course",
                                course.code,
                            ),
                            courseCode: course.code,
                            courseName: course.name,
                            units: course.academicUnits,
                            academicUnits:
                                course.academicUnits,
                            nonAcademicUnits:
                                course.nonAcademicUnits,
                            category: course.category,
                            curriculumCode:
                                "CS-ST18 (2021)",
                            recommendedTrimester:
                                course.trimester,
                            prerequisiteCodes:
                                course.prerequisiteCodes ?? [],
                            department:
                                course.category ===
                                    "GENERAL_EDUCATION"
                                    ? "General Education"
                                    : course.category ===
                                        "COMMON_COMPUTING"
                                        ? "Common Computing"
                                        : course.category ===
                                            "CS_PROFESSIONAL"
                                            ? "Computer Science"
                                            : "Software Technology",
                            status: "ACTIVE",
                            seedTag,
                            updatedAt: now,
                        },
                        session,
                    );
                }

                const studentCompletionRules = [
                    {
                        studentId:
                            ids.students.student1,
                        studentKey: "student1",
                        completed: (
                            course: CurriculumCourse,
                        ): boolean =>
                            !exactStudentMissingCourses.has(
                                course.code,
                            ) &&
                            !studentCurrentCourses.student1.has(
                                course.code,
                            ),
                    },
                    {
                        studentId:
                            ids.students.student2,
                        studentKey: "student2",
                        completed: (
                            course: CurriculumCourse,
                        ): boolean => {
                            if (
                                studentCurrentCourses.student2.has(
                                    course.code,
                                )
                            ) {
                                return false;
                            }

                            if (course.trimester <= 7) {
                                return true;
                            }

                            return [
                                "STMETHD",
                                "MOBDEVE",
                                "THS-ST1",
                                "CSOPESY",
                            ].includes(course.code);
                        },
                    },
                    {
                        studentId:
                            ids.students.student3,
                        studentKey: "student3",
                        completed: (
                            course: CurriculumCourse,
                        ): boolean => {
                            if (
                                studentCurrentCourses.student3.has(
                                    course.code,
                                )
                            ) {
                                return false;
                            }

                            if (course.trimester <= 4) {
                                return true;
                            }

                            return [
                                "CSARCH1",
                                "CSSWENG",
                                "CSNETWK",
                                "GELECAH",
                            ].includes(course.code);
                        },
                    },
                ];

                for (const course of curriculum) {
                    if (
                        course.academicUnits === 0 &&
                        course.nonAcademicUnits === 0
                    ) {
                        continue;
                    }

                    const historicalTermId = oid(
                        "term",
                        `curriculum-${course.trimester}`,
                    );
                    const historicalSectionId = oid(
                        "section-history",
                        course.code,
                    );

                    await upsertById(
                        db,
                        "sections",
                        {
                            _id: historicalSectionId,
                            courseId: oid(
                                "course",
                                course.code,
                            ),
                            academicTermId:
                                historicalTermId,
                            facultyId:
                                facultyIdForCourse(course),
                            sectionCode: `H${String(
                                course.trimester,
                            ).padStart(2, "0")}`,
                            schedule: [],
                            capacity:45,
                            enrolledCount: 0,
                            status: "CLOSED",
                            seedTag,
                            updatedAt: now,
                        },
                        session,
                    );

                    let completedCount = 0;

                    for (const rule of studentCompletionRules) {
                        if (!rule.completed(course)) {
                            continue;
                        }

                        completedCount += 1;

                        const enrollmentId = oid(
                            "enrollment-history",
                            `${rule.studentKey}:${course.code}`,
                        );

                        await upsertById(
                            db,
                            "enrollments",
                            {
                                _id: enrollmentId,
                                studentId: rule.studentId,
                                sectionId:
                                    historicalSectionId,
                                academicTermId:
                                    historicalTermId,
                                status: "COMPLETED",
                                enrolledAt:
                                    getHistoricalTermDates(
                                        course.trimester,
                                    ).startDate,
                                completedAt:
                                    getHistoricalTermDates(
                                        course.trimester,
                                    ).endDate,
                                seedTag,
                                updatedAt: now,
                            },
                            session,
                        );

                        if (course.academicUnits > 0) {
                            const score = scoreFor(
                                rule.studentKey,
                                course.code,
                            );

                            await upsertById(
                                db,
                                "grades",
                                {
                                    _id: oid(
                                        "grade-history",
                                        `${rule.studentKey}:${course.code}`,
                                    ),
                                    studentId:
                                        rule.studentId,
                                    sectionId:
                                        historicalSectionId,
                                    academicTermId:
                                        historicalTermId,
                                    facultyId:
                                        facultyIdForCourse(
                                            course,
                                        ),
                                    computedScore:
                                        rule.studentKey === "student2" &&
                                        student2FailedCourses.has(
                                            course.code,
                                        )
                                            ? 59
                                            : score.computedScore,
                                    finalGradeValue:
                                        rule.studentKey === "student1" &&
                                        student1CreditedCourses.has(
                                            course.code,
                                        )
                                            ? 3.5
                                            : rule.studentKey === "student2" &&
                                                student2FailedCourses.has(
                                                    course.code,
                                                )
                                                ? 0
                                                : score.finalGradeValue,
                                    result:
                                        rule.studentKey === "student1" &&
                                        student1CreditedCourses.has(
                                            course.code,
                                        )
                                            ? "CREDITED"
                                            : rule.studentKey === "student2" &&
                                                student2FailedCourses.has(
                                                    course.code,
                                                )
                                                ? "FAILED"
                                                : "PASSED",
                                    status: "VERIFIED",
                                    version: 1,
                                    submittedAt:
                                        getHistoricalTermDates(
                                            course.trimester,
                                        ).endDate,
                                    verifiedAt:
                                        getHistoricalTermDates(
                                            course.trimester,
                                        ).endDate,
                                    seedTag,
                                    updatedAt: now,
                                },
                                session,
                            );
                        }
                    }

                    await db
                        .collection("sections")
                        .updateOne(
                            {
                                _id: historicalSectionId,
                            },
                            {
                                $set: {
                                    enrolledCount:
                                        completedCount,
                                    updatedAt: now,
                                },
                            },
                            { session },
                        );
                }

                const academicTotal = curriculum.reduce(
                    (sum, course) =>
                        sum + course.academicUnits,
                    0,
                );

                const nonAcademicTotal = curriculum.reduce(
                    (sum, course) =>
                        sum + course.nonAcademicUnits,
                    0,
                );

                for (
                    const rule of
                    studentCompletionRules
                ) {
                    const academicGradeInputs:
                        AcademicGradeInput[] = [];

                    let earnedNonAcademicUnits =
                        0;

                    for (
                        const course of
                        curriculum
                    ) {
                        if (
                            !rule.completed(
                                course,
                            )
                        ) {
                            continue;
                        }

                        earnedNonAcademicUnits +=
                            course.nonAcademicUnits;

                        if (
                            course.academicUnits ===
                            0
                        ) {
                            continue;
                        }

                        const isCredited =
                            rule.studentKey ===
                                "student1" &&
                            student1CreditedCourses.has(
                                course.code,
                            );

                        const isFailed =
                            rule.studentKey ===
                                "student2" &&
                            student2FailedCourses.has(
                                course.code,
                            );

                        const score =
                            scoreFor(
                                rule.studentKey,
                                course.code,
                            );

                        academicGradeInputs.push({
                            academicUnits:
                                course.academicUnits,

                            rawPercentage:
                                isCredited
                                    ? null
                                    : isFailed
                                    ? 59
                                    : score.computedScore,

                            finalGradeValue:
                                isCredited
                                    ? 3.5
                                    : isFailed
                                    ? 0
                                    : score.finalGradeValue,

                            result:
                                isCredited
                                    ? "CREDITED"
                                    : isFailed
                                    ? "FAILED"
                                    : "PASSED",

                            status:
                                "VERIFIED",
                        });
                    }

                    /*
                    * This summary represents all completed
                    * courses before the current/latest term.
                    */
                    const academicSummary =
                        calculateAcademicSummary(
                            academicGradeInputs,
                        );

                    const storedPreviousRecord =
                        previousAcademicRecords[
                            rule.studentKey as
                                keyof typeof previousAcademicRecords
                        ];

                    const previousGpa =
                        storedPreviousRecord
                            ?.previousGpa ??
                        academicSummary
                            .currentGpa;

                    const previousGradedUnits =
                        storedPreviousRecord
                            ?.previousGradedUnits ??
                        academicSummary
                            .gpaAcademicUnits;

                    const previousGradePoints =
                        storedPreviousRecord
                            ?.previousGradePoints ??
                        academicSummary
                            .totalGradePoints;

                    await db
                        .collection(
                            "students",
                        )
                        .updateOne(
                            {
                                _id:
                                    rule.studentId,
                            },
                            {
                                $set: {
                                    requiredUnits:
                                        academicTotal,

                                    requiredNonAcademicUnits:
                                        nonAcademicTotal,

                                    earnedUnits:
                                        academicSummary
                                            .earnedAcademicUnits,

                                    earnedNonAcademicUnits,

                                    remainingUnits:
                                        Math.max(
                                            0,
                                            academicTotal -
                                                academicSummary
                                                    .earnedAcademicUnits,
                                        ),

                                    enrolledUnits:
                                        0,

                                    enrolledNonAcademicUnits:
                                        0,

                                    enlistedUnits:
                                        0,

                                    enlistedNonAcademicUnits:
                                        0,

                                    /*
                                    * Values before the latest term.
                                    * These are consumed by the
                                    * student grade service.
                                    */
                                    previousGpa,

                                    previousGradedUnits,

                                    previousGradePoints,

                                    /*
                                    * Keep the existing field names
                                    * for other services that may
                                    * still use them.
                                    */
                                    currentGpa:
                                        previousGpa,

                                    cumulativeGpa:
                                        previousGpa,

                                    gpaAcademicUnits:
                                        previousGradedUnits,

                                    totalGradePoints:
                                        previousGradePoints,

                                    creditedAcademicUnits:
                                        academicSummary
                                            .creditedAcademicUnits,

                                    failedAcademicUnits:
                                        academicSummary
                                            .failedAcademicUnits,

                                    updatedAt:
                                        now,
                                },
                            },
                            {
                                session,
                            },
                        );

                    console.log(
                        `[seed] Previous GPA record for ${rule.studentKey}`,
                        {
                            previousGpa,
                            previousGradedUnits,
                            previousGradePoints,
                        },
                    );
                }

                const currentSectionDefinitions = [
                    {
                        courseCode: "PRCCSST",
                        sectionCode: "O01",
                        schedule: [
                            {
                                days: ["ARRANGED"],
                                startTime: "",
                                endTime: "",
                                room: "Off Campus",
                            },
                        ],
                        capacity: 30,
                    },

                    /*
                    * Same schedule:
                    * STDISCM and CSADPRG
                    */
                    {
                        courseCode: "STDISCM",
                        sectionCode: "S12",
                        schedule: [
                            {
                                days: [
                                    "MONDAY",
                                    "THURSDAY",
                                ],
                                startTime: "08:00",
                                endTime: "09:30",
                                room: "G304",
                            },
                        ],
                        capacity: 45,
                    },
                    {
                        courseCode: "CSADPRG",
                        sectionCode: "S13",
                        schedule: [
                            {
                                days: [
                                    "MONDAY",
                                    "THURSDAY",
                                ],
                                startTime: "08:00",
                                endTime: "09:30",
                                room: "G205",
                            },
                        ],
                        capacity: 30,
                    },

                    /*
                    * Same schedule:
                    * STINTSY and CSSECDV
                    */
                    {
                        courseCode: "STINTSY",
                        sectionCode: "S11",
                        schedule: [
                            {
                                days: [
                                    "TUESDAY",
                                    "FRIDAY",
                                ],
                                startTime: "10:00",
                                endTime: "11:30",
                                room: "G205",
                            },
                        ],
                        capacity: 30,
                    },
                    {
                        courseCode: "CSSECDV",
                        sectionCode: "S14",
                        schedule: [
                            {
                                days: [
                                    "TUESDAY",
                                    "FRIDAY",
                                ],
                                startTime: "10:00",
                                endTime: "11:30",
                                room: "A110",
                            },
                        ],
                        capacity: 30,
                    },

                    /*
                    * Wednesday-only schedule.
                    */
                    {
                        courseCode: "GEWORLD",
                        sectionCode: "G01",
                        schedule: [
                            {
                                days: ["WEDNESDAY"],
                                startTime: "13:00",
                                endTime: "16:00",
                                room: "Yuchengco 308",
                            },
                        ],
                        capacity: 35,
                    },

                    /*
                    * Saturday-only schedule.
                    */
                    {
                        courseCode: "THS-ST3",
                        sectionCode: "T01",
                        schedule: [
                            {
                                days: ["SATURDAY"],
                                startTime: "13:00",
                                endTime: "16:00",
                                room: "G301",
                            },
                        ],
                        capacity: 20,
                    },
                ];

                const enrollmentScheduleSlots = [
                    // Monday and Thursday
                    {
                        days: [
                            "MONDAY",
                            "THURSDAY",
                        ],
                        startTime: "08:00",
                        endTime: "09:30",
                        room: "G201",
                    },
                    {
                        days: [
                            "MONDAY",
                            "THURSDAY",
                        ],
                        startTime: "09:45",
                        endTime: "11:15",
                        room: "G202",
                    },
                    {
                        days: [
                            "MONDAY",
                            "THURSDAY",
                        ],
                        startTime: "11:30",
                        endTime: "13:00",
                        room: "G203",
                    },
                    {
                        days: [
                            "MONDAY",
                            "THURSDAY",
                        ],
                        startTime: "13:15",
                        endTime: "14:45",
                        room: "G204",
                    },
                    {
                        days: [
                            "MONDAY",
                            "THURSDAY",
                        ],
                        startTime: "15:00",
                        endTime: "16:30",
                        room: "G205",
                    },

                    // Tuesday and Friday
                    {
                        days: [
                            "TUESDAY",
                            "FRIDAY",
                        ],
                        startTime: "08:00",
                        endTime: "09:30",
                        room: "G301",
                    },
                    {
                        days: [
                            "TUESDAY",
                            "FRIDAY",
                        ],
                        startTime: "09:45",
                        endTime: "11:15",
                        room: "G302",
                    },
                    {
                        days: [
                            "TUESDAY",
                            "FRIDAY",
                        ],
                        startTime: "11:30",
                        endTime: "13:00",
                        room: "G303",
                    },
                    {
                        days: [
                            "TUESDAY",
                            "FRIDAY",
                        ],
                        startTime: "13:15",
                        endTime: "14:45",
                        room: "G304",
                    },
                    {
                        days: [
                            "TUESDAY",
                            "FRIDAY",
                        ],
                        startTime: "15:00",
                        endTime: "16:30",
                        room: "G305",
                    },

                    // Wednesday only
                    {
                        days: ["WEDNESDAY"],
                        startTime: "08:00",
                        endTime: "11:00",
                        room: "Y201",
                    },
                    {
                        days: ["WEDNESDAY"],
                        startTime: "11:15",
                        endTime: "14:15",
                        room: "Y202",
                    },
                    {
                        days: ["WEDNESDAY"],
                        startTime: "14:30",
                        endTime: "17:30",
                        room: "Y203",
                    },

                    // Saturday only
                    {
                        days: ["SATURDAY"],
                        startTime: "08:00",
                        endTime: "11:00",
                        room: "Y301",
                    },
                    {
                        days: ["SATURDAY"],
                        startTime: "11:15",
                        endTime: "14:15",
                        room: "Y302",
                    },
                    {
                        days: ["SATURDAY"],
                        startTime: "14:30",
                        endTime: "17:30",
                        room: "Y303",
                    },
                ] as const;

                const termOneOfferedCourses =
                    curriculum.filter(
                        (course) =>
                            ((course.trimester - 1) % 3) + 1 === 1 ||
                            course.code === "PRCCSST",
                    );

                /*
                 * Every offered course receives two or three
                 * sections with different schedules and seat
                 * counts. STDISCM is the exception: it has one
                 * section only, with 44 of 45 seats occupied.
                 */
                for (
                    let courseIndex = 0;
                    courseIndex <
                    termOneOfferedCourses.length;
                    courseIndex += 1
                ) {
                    const course =
                        termOneOfferedCourses[
                            courseIndex
                        ];

                    const sectionCount =
                        course.code ===
                        "STDISCM"
                            ? 1
                            : courseIndex %
                                  2 ===
                              0
                              ? 2
                              : 3;

                    for (
                        let sectionIndex = 0;
                        sectionIndex <
                        sectionCount;
                        sectionIndex += 1
                    ) {
                        const scheduleIndex =
                            (
                                courseIndex *
                                    3 +
                                sectionIndex
                            ) %
                            enrollmentScheduleSlots.length;

                        const isSharedConflictSection =
                            sectionIndex === 0 &&
                            (
                                course.code ===
                                    "CSADPRG" ||
                                course.code ===
                                    "STDISCM"
                            );

                        const scheduleSlot =
                            course.code ===
                            "PRCCSST"
                                ? {
                                      days: [
                                          "ARRANGED",
                                      ],
                                      startTime:
                                          "",
                                      endTime:
                                          "",
                                      room: `Off Campus ${
                                          sectionIndex +
                                          1
                                      }`,
                                  }
                                : isSharedConflictSection
                                  ? {
                                        days: [
                                            "MONDAY",
                                            "THURSDAY",
                                        ],
                                        startTime:
                                            "08:00",
                                        endTime:
                                            "09:30",
                                        room:
                                            course.code ===
                                            "STDISCM"
                                                ? "G304"
                                                : "G205",
                                    }
                                  : enrollmentScheduleSlots[
                                        scheduleIndex
                                    ];

                        const enrolledCount =
                            course.code ===
                            "STDISCM"
                                ? 44
                                : getDemoEnrolledCount(
                                      courseIndex *
                                          3 +
                                          sectionIndex,
                                  );

                        await upsertById(
                            db,
                            "sections",
                            {
                                _id: oid(
                                    "section-next",
                                    `${course.code}:${
                                        sectionIndex +
                                        1
                                    }`,
                                ),

                                courseId: oid(
                                    "course",
                                    course.code,
                                ),

                                academicTermId:
                                    ids.terms.next,

                                facultyId:
                                    facultyIdForCourse(
                                        course,
                                    ),

                                sectionCode: `N${String(
                                    courseIndex +
                                        1,
                                ).padStart(
                                    2,
                                    "0",
                                )}-${String(
                                    sectionIndex +
                                        1,
                                ).padStart(
                                    2,
                                    "0",
                                )}`,

                                schedule: [
                                    {
                                        days: [
                                            ...scheduleSlot.days,
                                        ],

                                        startTime:
                                            scheduleSlot.startTime,

                                        endTime:
                                            scheduleSlot.endTime,

                                        room:
                                            scheduleSlot.room,
                                    },
                                ],

                                capacity: 45,

                                enrolledCount,

                                status: "OPEN",
                                seedTag,
                                updatedAt: now,
                            },
                            session,
                        );
                    }
                }


                for (const definition of currentSectionDefinitions) {
                    const course = curriculum.find(
                        (item) =>
                            item.code ===
                            definition.courseCode,
                    );

                    if (!course) {
                        throw new Error(
                            `Missing curriculum course: ${definition.courseCode}`,
                        );
                    }

                    const sectionId = oid(
                        "section-current",
                        definition.courseCode,
                    );

                    await upsertById(
                        db,
                        "sections",
                        {
                            _id: sectionId,
                            courseId: oid(
                                "course",
                                definition.courseCode,
                            ),
                            academicTermId:
                                ids.terms.current,
                            facultyId:
                                facultyIdForCourse(course),
                            sectionCode:
                                definition.sectionCode,
                            schedule:
                                definition.schedule,
                            capacity:
                                definition.capacity,
                            enrolledCount: 0,
                            status: "OPEN",
                            seedTag,
                            updatedAt: now,
                        },
                        session,
                    );
                }

                for (const definition of currentSectionDefinitions) {
                    const course = curriculum.find(
                        (item) =>
                            item.code ===
                            definition.courseCode,
                    );

                    if (!course) {
                        continue;
                    }

                    const sectionId = oid(
                        "section-current",
                        definition.courseCode,
                    );
                    const enrolledCount =
                        await db
                            .collection("enrollments")
                            .countDocuments(
                                {
                                    sectionId,
                                    status: "ENROLLED",
                                },
                                { session },
                            );

                    await upsertById(
                        db,
                        "gradeSubmissions",
                        {
                            _id: oid(
                                "grade-submission",
                                definition.courseCode,
                            ),
                            sectionId,
                            academicTermId:
                                ids.terms.current,
                            facultyId:
                                facultyIdForCourse(course),
                            gradeType: "FINAL",
                            totalStudents:
                                enrolledCount,
                            completedCount: 0,
                            status: "DRAFT",
                            seedTag,
                            updatedAt: now,
                        },
                        session,
                    );
                }

                const announcements = [
                    {
                        key: "enrollment-open",
                        title:
                            "Enrollment period is now open",
                        message:
                            "Students may enroll in available sections from August 1 to August 15, 2026.",
                        audience: "STUDENT",
                        publishedAt: new Date(
                            "2026-07-28",
                        ),
                    },
                ];

                for (const announcement of announcements) {
                    await upsertById(
                        db,
                        "announcements",
                        {
                            _id: oid(
                                "announcement",
                                announcement.key,
                            ),
                            title: announcement.title,
                            message:
                                announcement.message,
                            audience:
                                announcement.audience,
                            publishedAt:
                                announcement.publishedAt,
                            createdBy:
                                ids.users.facultyST,
                            status: "PUBLISHED",
                            seedTag,
                            updatedAt: now,
                        },
                        session,
                    );
                }
            })();
        } finally {
            await session.endSession();
        }


        const seededUsers =
            await db
                .collection<{
                    email: string;
                    username: string;
                    passwordHash?: string;
                    accountStatus?: string;
                    status?: string;
                }>("users")
                .find({
                    seedTag,
                })
                .toArray();

        if (
            seededUsers.length === 0
        ) {
            throw new Error(
                "Seed verification failed: no demo users were written to the users collection.",
            );
        }

        for (
            const seededUser of
            seededUsers
        ) {
            if (
                typeof seededUser.passwordHash !==
                    "string" ||
                seededUser.passwordHash.length ===
                    0
            ) {
                throw new Error(
                    `Seed verification failed: ${seededUser.email} has no passwordHash.`,
                );
            }

            const passwordMatches =
                await bcrypt.compare(
                    demoPassword,
                    seededUser.passwordHash,
                );

            if (!passwordMatches) {
                throw new Error(
                    `Seed verification failed: the password hash for ${seededUser.email} does not match the configured demo password.`,
                );
            }

            if (
                seededUser.accountStatus !==
                    "ACTIVE" &&
                seededUser.status !==
                    "ACTIVE"
            ) {
                throw new Error(
                    `Seed verification failed: ${seededUser.email} is not active.`,
                );
            }
        }

        console.log(
            `Verified ${seededUsers.length} seeded login account(s) in ${databaseName}.`,
        );

        const curriculumAcademicTotal = curriculum.reduce(
            (sum, course) =>
                sum + course.academicUnits,
            0,
        );
        const curriculumNonAcademicTotal = curriculum.reduce(
            (sum, course) =>
                sum + course.nonAcademicUnits,
            0,
        );

        console.log("");
        console.log("Seed completed successfully.");
        console.log(
            `Curriculum total: ${curriculumAcademicTotal} academic units and ${curriculumNonAcademicTotal} non-academic units.`,
        );
        console.log("");
        console.log("Student demo curriculum progress:");
        console.log(
            "  Email: student@university.edu",
        );
        console.log("  Username: student.demo");
        console.log(`  Password: ${demoPassword}`);
        console.log(
            "  Student enrolled units start at 0 until enrollment is submitted.",
        );
        console.log(
            "  GPA uses the shared calculator: credited = 3.5, failed = 0.0.",
        );
        console.log(
            "  Upcoming sections use deterministic demo seat counts from 0 to 45.",
        );
        console.log("");
        console.log("Faculty accounts:");
        console.log(
            "  CC: prof.cc / cc.faculty@university.edu",
        );
        console.log(
            "  CS: prof.cs / cs.faculty@university.edu",
        );
        console.log(
            "  GE: prof.ge / ge.faculty@university.edu",
        );
        console.log(
            "  ST and other: prof.reyes / faculty@university.edu",
        );
        console.log(
            `  Password for all accounts: ${demoPassword}`,
        );
    } finally {
        await client.close();
    }
}

seedDatabase().catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
});