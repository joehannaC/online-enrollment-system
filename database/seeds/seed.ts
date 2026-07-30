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

dotenv.config({
    path: path.resolve(process.cwd(), "database/seeds/.env"),
});

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    throw new Error(
        "MONGODB_URI is missing from database/seeds/.env",
    );
}

const databaseName = "online_enrollment";
const resetRequested = process.argv.includes("--reset");
const seedTag = "CS-ST18-2021-DEMO";

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
        current: oid("term", "AY2026-2027-T1"),
    },
};

const curriculum: CurriculumCourse[] = [
    // 1st Trimester — 14 academic, 0 non-academic
    { code: "CCPROG1", name: "Logic Formulation and Introductory Programming", academicUnits: 3, nonAcademicUnits: 0, trimester: 1, category: "COMMON_COMPUTING" },
    { code: "CCICOMP", name: "Introduction to Computing", academicUnits: 3, nonAcademicUnits: 0, trimester: 1, category: "COMMON_COMPUTING" },
    { code: "MTH101A", name: "Algebra and Trigonometry", academicUnits: 5, nonAcademicUnits: 0, trimester: 1, category: "COMMON_MATH" },
    { code: "GEPCOMM", name: "Purposive Communication", academicUnits: 3, nonAcademicUnits: 0, trimester: 1, category: "GENERAL_EDUCATION" },
    { code: "NSTP101", name: "National Service Training Program Orientation", academicUnits: 0, nonAcademicUnits: 0, trimester: 1, category: "OTHER_NON_ACADEMIC" },

    // 2nd Trimester — 17 academic, 3 non-academic
    { code: "CCPROG2", name: "Programming with Structured Data Types", academicUnits: 3, nonAcademicUnits: 0, trimester: 2, category: "COMMON_COMPUTING" },
    { code: "CCDSTRU", name: "Discrete Structures", academicUnits: 3, nonAcademicUnits: 0, trimester: 2, category: "COMMON_COMPUTING" },
    { code: "CSMATH1", name: "Differential Calculus", academicUnits: 3, nonAcademicUnits: 0, trimester: 2, category: "COMMON_MATH" },
    { code: "GEFTWEL", name: "Physical Fitness and Wellness", academicUnits: 2, nonAcademicUnits: 0, trimester: 2, category: "GENERAL_EDUCATION" },
    { code: "GELECSP", name: "General Education Elective – Filipino", academicUnits: 3, nonAcademicUnits: 0, trimester: 2, category: "GENERAL_EDUCATION" },
    { code: "LASARE1", name: "Lasallian Reflection 1", academicUnits: 0, nonAcademicUnits: 0, trimester: 2, category: "OTHER_NON_ACADEMIC" },
    { code: "NSTP-01", name: "National Service Training Program 1", academicUnits: 0, nonAcademicUnits: 3, trimester: 2, category: "NSTP" },

    // 3rd Trimester — 17 academic, 3 non-academic
    { code: "CCPROG3", name: "Object-Oriented Programming", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "COMMON_COMPUTING" },
    { code: "CCDSALG", name: "Data Structures and Algorithms", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "COMMON_COMPUTING" },
    { code: "CSMATH2", name: "Linear Algebra for Computer Science", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "COMMON_MATH" },
    { code: "STT101A", name: "Probability and Statistics", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "COMMON_MATH" },
    { code: "GEDANCE", name: "Physical Fitness and Wellness in Dance", academicUnits: 2, nonAcademicUnits: 0, trimester: 3, category: "GENERAL_EDUCATION" },
    { code: "GESTSOC", name: "Science, Technology, and Society", academicUnits: 3, nonAcademicUnits: 0, trimester: 3, category: "GENERAL_EDUCATION" },
    { code: "SAS1000", name: "Student Affairs Services 1000", academicUnits: 0, nonAcademicUnits: 0, trimester: 3, category: "OTHER_NON_ACADEMIC" },
    { code: "NSTP-02", name: "National Service Training Program 2", academicUnits: 0, nonAcademicUnits: 3, trimester: 3, category: "NSTP" },

    // 4th Trimester — 17 academic
    { code: "CSADPRG", name: "Advanced Programming Techniques", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "CS_PROFESSIONAL" },
    { code: "CCINFOM", name: "Information Management", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "COMMON_COMPUTING" },
    { code: "CSALGCM", name: "Algorithms and Complexity", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "CS_PROFESSIONAL" },
    { code: "CSINTSY", name: "Introduction to Artificial Intelligence", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "CS_PROFESSIONAL" },
    { code: "GESPORT", name: "Physical Fitness and Wellness in Individual Sports", academicUnits: 2, nonAcademicUnits: 0, trimester: 4, category: "GENERAL_EDUCATION" },
    { code: "LCASEAN", name: "The Filipino and ASEAN", academicUnits: 3, nonAcademicUnits: 0, trimester: 4, category: "GENERAL_EDUCATION" },

    // 5th Trimester — 17 academic, 1 non-academic
    { code: "CCAPDEV", name: "Web Application Development", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "COMMON_COMPUTING" },
    { code: "CSARCH1", name: "Computer Organization and Architecture 1", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "CS_PROFESSIONAL" },
    { code: "STALGCM", name: "Advanced Algorithms and Complexities", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "ST_SPECIALIZATION" },
    { code: "ST-MATH", name: "Integral Calculus for Computer Science Students", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "ST_SPECIALIZATION" },
    { code: "GETEAMS", name: "Physical Fitness and Wellness in Team Sports", academicUnits: 2, nonAcademicUnits: 0, trimester: 5, category: "GENERAL_EDUCATION" },
    { code: "GERPHIS", name: "Readings in Philippine History", academicUnits: 3, nonAcademicUnits: 0, trimester: 5, category: "GENERAL_EDUCATION" },
    { code: "LCLSONE", name: "Lasallian Studies 1", academicUnits: 0, nonAcademicUnits: 1, trimester: 5, category: "LASALLIAN_STUDIES" },
    { code: "LASARE2", name: "Lasallian Reflection 2", academicUnits: 0, nonAcademicUnits: 0, trimester: 5, category: "OTHER_NON_ACADEMIC" },

    // 6th Trimester — 15 academic
    { code: "CSSWENG", name: "Software Engineering", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "CS_PROFESSIONAL" },
    { code: "STHCIUX", name: "Human Computer Interaction and User Experience", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "ST_SPECIALIZATION" },
    { code: "CSNETWK", name: "Introduction to Computer Networks", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "CS_PROFESSIONAL" },
    { code: "CSMODEL", name: "Modelling and Simulation", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "CS_PROFESSIONAL" },
    { code: "GELECAH", name: "General Education Elective – Arts and Humanities", academicUnits: 3, nonAcademicUnits: 0, trimester: 6, category: "GENERAL_EDUCATION" },
    { code: "SAS2000", name: "Student Affairs Services 2000", academicUnits: 0, nonAcademicUnits: 0, trimester: 6, category: "OTHER_NON_ACADEMIC" },

    // 7th Trimester — 16 academic, 1 non-academic
    { code: "STSWENG", name: "Advanced Software Engineering", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "ST_SPECIALIZATION" },
    { code: "STADVDB", name: "Advanced Database Systems", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "ST_SPECIALIZATION" },
    { code: "CSARCH2", name: "Computer Organization and Architecture 2", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "CS_PROFESSIONAL" },
    { code: "LBYARCH", name: "Computer Architecture Laboratory", academicUnits: 1, nonAcademicUnits: 0, trimester: 7, category: "CS_PROFESSIONAL" },
    { code: "STELEC1", name: "ST Professional Elective 1 – Ethical Hacking", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "PROFESSIONAL_ELECTIVE" },
    { code: "LCENWRD", name: "Encountering the Word in the World", academicUnits: 3, nonAcademicUnits: 0, trimester: 7, category: "GENERAL_EDUCATION" },
    { code: "SAS3000", name: "Student Affairs Services 3000", academicUnits: 0, nonAcademicUnits: 0, trimester: 7, category: "OTHER_NON_ACADEMIC" },
    { code: "LCLSTWO", name: "Lasallian Studies 2", academicUnits: 0, nonAcademicUnits: 1, trimester: 7, category: "LASALLIAN_STUDIES" },
    { code: "LASARE3", name: "Lasallian Reflection 3", academicUnits: 0, nonAcademicUnits: 0, trimester: 7, category: "OTHER_NON_ACADEMIC" },

    // 8th Trimester — 6 academic
    { code: "STMETHD", name: "Software Technology Research Methods", academicUnits: 3, nonAcademicUnits: 0, trimester: 8, category: "ST_SPECIALIZATION" },
    { code: "PRCCSST", name: "Practicum for Software Technology", academicUnits: 3, nonAcademicUnits: 0, trimester: 8, category: "PRACTICUM" },

    // 9th Trimester — 14 academic
    { code: "MOBDEVE", name: "Mobile Development", academicUnits: 3, nonAcademicUnits: 0, trimester: 9, category: "ST_SPECIALIZATION" },
    { code: "THS-ST1", name: "Thesis for Software Technology 1", academicUnits: 2, nonAcademicUnits: 0, trimester: 9, category: "THESIS" },
    { code: "CSOPESY", name: "Introduction to Operating Systems", academicUnits: 3, nonAcademicUnits: 0, trimester: 9, category: "CS_PROFESSIONAL" },
    { code: "STINTSY", name: "Advanced Intelligent Systems", academicUnits: 3, nonAcademicUnits: 0, trimester: 9, category: "ST_SPECIALIZATION" },
    { code: "STELEC2", name: "ST Professional Elective 2 – Solid Data Engineering", academicUnits: 3, nonAcademicUnits: 0, trimester: 9, category: "PROFESSIONAL_ELECTIVE" },

    // 10th Trimester — 14 academic
    { code: "THS-ST2", name: "Thesis for Software Technology 2", academicUnits: 2, nonAcademicUnits: 0, trimester: 10, category: "THESIS" },
    { code: "STDISCM", name: "Distributed Computing", academicUnits: 3, nonAcademicUnits: 0, trimester: 10, category: "ST_SPECIALIZATION" },
    { code: "STELEC3", name: "ST Professional Elective 3 – Human-Computer Interaction", academicUnits: 3, nonAcademicUnits: 0, trimester: 10, category: "PROFESSIONAL_ELECTIVE" },
    { code: "STELEC4", name: "ST Professional Elective 4 – Advanced Data Analytics", academicUnits: 3, nonAcademicUnits: 0, trimester: 10, category: "PROFESSIONAL_ELECTIVE" },
    { code: "GEETHIC", name: "Ethics", academicUnits: 3, nonAcademicUnits: 0, trimester: 10, category: "GENERAL_EDUCATION" },

    // 11th Trimester — 14 academic, 1 non-academic
    { code: "CSSECDV", name: "Secure Web Development", academicUnits: 3, nonAcademicUnits: 0, trimester: 11, category: "CS_PROFESSIONAL" },
    { code: "CCINOV8", name: "Innovation and Technology Management", academicUnits: 3, nonAcademicUnits: 0, trimester: 11, category: "COMMON_COMPUTING" },
    { code: "THS-ST3", name: "Thesis for Software Technology 3", academicUnits: 2, nonAcademicUnits: 0, trimester: 11, category: "THESIS" },
    { code: "GELECST", name: "General Education Elective – Filipino Literature", academicUnits: 3, nonAcademicUnits: 0, trimester: 11, category: "GENERAL_EDUCATION" },
    { code: "GEWORLD", name: "The Contemporary World", academicUnits: 3, nonAcademicUnits: 0, trimester: 11, category: "GENERAL_EDUCATION" },
    { code: "LCLSTRI", name: "Lasallian Studies 3", academicUnits: 0, nonAcademicUnits: 1, trimester: 11, category: "LASALLIAN_STUDIES" },

    // 12th Trimester — 12 academic
    { code: "GERIZAL", name: "Life and Works of Rizal", academicUnits: 3, nonAcademicUnits: 0, trimester: 12, category: "GENERAL_EDUCATION" },
    { code: "GEARTAP", name: "Art Appreciation", academicUnits: 3, nonAcademicUnits: 0, trimester: 12, category: "GENERAL_EDUCATION" },
    { code: "GEUSELF", name: "Understanding the Self", academicUnits: 3, nonAcademicUnits: 0, trimester: 12, category: "GENERAL_EDUCATION" },
    { code: "LCFAITH", name: "Faith Worth Living", academicUnits: 3, nonAcademicUnits: 0, trimester: 12, category: "GENERAL_EDUCATION" },
];

const exactStudentMissingCourses = new Set([
    "PRCCSST",
    "STDISCM",
]);

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
    ]);
}

async function clearSeedData(
    db: Db,
    session: ClientSession,
): Promise<void> {
    const collections = [
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
        .update(`${studentKey}:${courseCode}`)
        .digest();

    const computedScore = 76 + (hash[0] % 22);

    let finalGradeValue = 2.0;

    if (computedScore >= 95) {
        finalGradeValue = 4.0;
    } else if (computedScore >= 90) {
        finalGradeValue = 3.5;
    } else if (computedScore >= 85) {
        finalGradeValue = 3.0;
    } else if (computedScore >= 80) {
        finalGradeValue = 2.5;
    }

    return {
        computedScore,
        finalGradeValue,
    };
}

async function seedDatabase(): Promise<void> {
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();

        const db = client.db(databaseName);

        console.log(
            `Connected to MongoDB database: ${databaseName}`,
        );

        await createIndexes(db);

        const passwordHash = await bcrypt.hash(
            "Password123!",
            12,
        );

        const now = new Date();
        const session = client.startSession();

        try {
            await session.withTransaction(async () => {
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
                            passwordHash,
                            accountStatus: "ACTIVE",
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
                        earnedUnits: 167,
                        earnedNonAcademicUnits: 9,
                        remainingUnits: 0,
                        enrolledUnits: 6,
                        enlistedUnits: 0,
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
                        earnedUnits: 116,
                        earnedNonAcademicUnits: 7,
                        remainingUnits: 57,
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
                        earnedUnits: 74,
                        earnedNonAcademicUnits: 6,
                        remainingUnits: 99,
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
                            requiredUnits: 173,
                            requiredNonAcademicUnits: 9,
                            enrolledUnits:
                                student.enrolledUnits ?? 0,
                            enlistedUnits:
                                student.enlistedUnits ?? 0,
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
                        code: "AY2026-2027-T1",
                        name: "Term 1",
                        academicYear: "2026-2027",
                        termNumber: 1,
                        startDate: new Date(
                            "2026-07-01",
                        ),
                        endDate: new Date(
                            "2026-10-31",
                        ),
                        enrollmentStart: new Date(
                            "2026-06-20",
                        ),
                        enrollmentEnd: new Date(
                            "2026-08-05",
                        ),
                        gradeSubmissionDeadline:
                            new Date("2026-11-10"),
                        status: "ACTIVE",
                        isCurrent: true,
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
                        ) =>
                            !exactStudentMissingCourses.has(
                                course.code,
                            ),
                    },
                    {
                        studentId:
                            ids.students.student2,
                        studentKey: "student2",
                        completed: (
                            course: CurriculumCourse,
                        ) =>
                            course.trimester <= 8 ||
                            [
                                "MOBDEVE",
                                "THS-ST1",
                                "CSOPESY",
                            ].includes(course.code),
                    },
                    {
                        studentId:
                            ids.students.student3,
                        studentKey: "student3",
                        completed: (
                            course: CurriculumCourse,
                        ) =>
                            course.trimester <= 5 ||
                            [
                                "CSSWENG",
                                "CSNETWK",
                                "GELECAH",
                            ].includes(course.code),
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
                            capacity: 40,
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
                                        score.computedScore,
                                    finalGradeValue:
                                        score.finalGradeValue,
                                    result:
                                        rule.studentKey === "student1"
                                            ? "CREDITED"
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

                const currentSectionDefinitions = [
                    {
                        courseCode: "PRCCSST",
                        sectionCode: "O01",
                        schedule: [
                            {
                                days: ["FRIDAY"],
                                startTime: "09:00",
                                endTime: "12:00",
                                room: "Online",
                            },
                        ],
                        capacity: 30,
                    },
                    {
                        courseCode: "STINTSY",
                        sectionCode: "S11",
                        schedule: [
                            {
                                days: [
                                    "TUESDAY",
                                    "THURSDAY",
                                ],
                                startTime: "10:00",
                                endTime: "11:30",
                                room: "G205",
                            },
                        ],
                        capacity: 30,
                    },
                    {
                        courseCode: "STDISCM",
                        sectionCode: "S12",
                        schedule: [
                            {
                                days: [
                                    "MONDAY",
                                    "WEDNESDAY",
                                ],
                                startTime: "08:00",
                                endTime: "09:30",
                                room: "G304",
                            },
                        ],
                        capacity: 32,
                    },
                    {
                        courseCode: "THS-ST3",
                        sectionCode: "T01",
                        schedule: [
                            {
                                days: ["SATURDAY"],
                                startTime: "13:00",
                                endTime: "15:00",
                                room: "G301",
                            },
                        ],
                        capacity: 20,
                    },
                    {
                        courseCode: "CCAPDEV",
                        sectionCode: "S13",
                        schedule: [
                            {
                                days: [
                                    "MONDAY",
                                    "WEDNESDAY",
                                ],
                                startTime: "13:00",
                                endTime: "14:30",
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
                                    "THURSDAY",
                                ],
                                startTime: "08:00",
                                endTime: "09:30",
                                room: "A110",
                            },
                        ],
                        capacity: 30,
                    },
                    {
                        courseCode: "GEWORLD",
                        sectionCode: "G01",
                        schedule: [
                            {
                                days: ["FRIDAY"],
                                startTime: "13:00",
                                endTime: "16:00",
                                room: "Yuchengco 308",
                            },
                        ],
                        capacity: 35,
                    },
                ];

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

                const currentEnrollmentDefinitions = [
                    {
                        studentId:
                            ids.students.student1,
                        studentKey: "student1",
                        courseCodes: [
                            "STDISCM",
                            "PRCCSST",
                        ],
                    },
                    {
                        studentId:
                            ids.students.student2,
                        studentKey: "student2",
                        courseCodes: [
                            "STINTSY",
                            "STDISCM",
                            "CCAPDEV",
                        ],
                    },
                    {
                        studentId:
                            ids.students.student3,
                        studentKey: "student3",
                        courseCodes: [
                            "CCAPDEV",
                            "CSSECDV",
                            "GEWORLD",
                        ],
                    },
                ];

                for (const definition of currentEnrollmentDefinitions) {
                    for (const courseCode of definition.courseCodes) {
                        const sectionId = oid(
                            "section-current",
                            courseCode,
                        );

                        await upsertById(
                            db,
                            "enrollments",
                            {
                                _id: oid(
                                    "enrollment-current",
                                    `${definition.studentKey}:${courseCode}`,
                                ),
                                studentId:
                                    definition.studentId,
                                sectionId,
                                academicTermId:
                                    ids.terms.current,
                                status: "ENROLLED",
                                enrolledAt: new Date(
                                    "2026-07-02",
                                ),
                                seedTag,
                                updatedAt: now,
                            },
                            session,
                        );

                        await db
                            .collection("sections")
                            .updateOne(
                                { _id: sectionId },
                                {
                                    $inc: {
                                        enrolledCount: 1,
                                    },
                                },
                                { session },
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
                            "Students may enroll in available sections until August 5, 2026.",
                        audience: "STUDENT",
                        publishedAt: new Date(
                            "2026-07-28",
                        ),
                    },
                    {
                        key: "curriculum-audit",
                        title:
                            "Curriculum audit has been updated",
                        message:
                            "Review completed, remaining, enrolled, and enlisted units in Academic Records.",
                        audience: "STUDENT",
                        publishedAt: new Date(
                            "2026-07-25",
                        ),
                    },
                    {
                        key: "grade-deadline",
                        title:
                            "Grade submission deadline",
                        message:
                            "Faculty members must submit final grades on or before November 10, 2026.",
                        audience: "FACULTY",
                        publishedAt: new Date(
                            "2026-07-24",
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
            });
        } finally {
            await session.endSession();
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

        console.log("");
        console.log("Seed completed successfully.");
        console.log(
            `Curriculum total: ${academicTotal} academic units and ${nonAcademicTotal} non-academic units.`,
        );
        console.log("");
        console.log("Student demo curriculum progress:");
        console.log(
            "  Email: student@university.edu",
        );
        console.log("  Username: student.demo");
        console.log("  Password: Password123!");
        console.log(
            "  Progress: 167 earned, 0 remaining, 6 enrolled, 0 enlisted.",
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
            "  Password for all accounts: Password123!",
        );
    } finally {
        await client.close();
    }
}

seedDatabase().catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
});