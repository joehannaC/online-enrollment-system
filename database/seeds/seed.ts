import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import {
    MongoClient,
    ObjectId,
    type ClientSession,
    type Db,
} from "mongodb";
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

// Deterministic IDs make the script repeatable.
const ids = {
    users: {
        student1: new ObjectId("650000000000000000000001"),
        student2: new ObjectId("650000000000000000000002"),
        student3: new ObjectId("650000000000000000000003"),
        faculty1: new ObjectId("650000000000000000000101"),
    },

    students: {
        student1: new ObjectId("650000000000000000000001"),
        student2: new ObjectId("650000000000000000000002"),
        student3: new ObjectId("650000000000000000000003"),
    },

    faculty: {
        faculty1: new ObjectId("650000000000000000000101"),
    },

    terms: {
        current: new ObjectId("653000000000000000000001"),
        previous: new ObjectId("653000000000000000000002"),
    },

    courses: {
        distributedSystems: new ObjectId(
        "654000000000000000000001",
        ),
        webDevelopment: new ObjectId(
        "654000000000000000000002",
        ),
        softwareEngineering: new ObjectId(
        "654000000000000000000003",
        ),
        practicum: new ObjectId("654000000000000000000004"),
        databaseManagement: new ObjectId(
        "654000000000000000000005",
        ),
        computerNetworks: new ObjectId(
        "654000000000000000000006",
        ),
    },

    sections: {
        distributedSystems: new ObjectId(
        "655000000000000000000001",
        ),
        webDevelopment: new ObjectId(
        "655000000000000000000002",
        ),
        softwareEngineering: new ObjectId(
        "655000000000000000000003",
        ),
        practicum: new ObjectId("655000000000000000000004"),
        databaseManagement: new ObjectId(
        "655000000000000000000005",
        ),
        computerNetworks: new ObjectId(
        "655000000000000000000006",
        ),
    },

    enrollments: {
        current1: new ObjectId("656000000000000000000001"),
        current2: new ObjectId("656000000000000000000002"),
        current3: new ObjectId("656000000000000000000003"),
        current4: new ObjectId("656000000000000000000004"),
        classmate1: new ObjectId("656000000000000000000005"),
        classmate2: new ObjectId("656000000000000000000006"),
        previous1: new ObjectId("656000000000000000000101"),
        previous2: new ObjectId("656000000000000000000102"),
    },

    grades: {
        currentStudent1: new ObjectId(
        "657000000000000000000001",
        ),
        currentStudent2: new ObjectId(
        "657000000000000000000002",
        ),
        currentStudent3: new ObjectId(
        "657000000000000000000003",
        ),
        previous1: new ObjectId("657000000000000000000101"),
        previous2: new ObjectId("657000000000000000000102"),
    },

    gradeSubmissions: {
        distributedSystems: new ObjectId(
        "658000000000000000000001",
        ),
    },

    announcements: {
        enrollmentOpen: new ObjectId(
        "659000000000000000000001",
        ),
        gradesAvailable: new ObjectId(
        "659000000000000000000002",
        ),
    },
};

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
    const collectionIds = {
        users: Object.values(ids.users),
        students: Object.values(ids.students),
        faculty: Object.values(ids.faculty),
        academicTerms: Object.values(ids.terms),
        courses: Object.values(ids.courses),
        sections: Object.values(ids.sections),
        enrollments: Object.values(ids.enrollments),
        grades: Object.values(ids.grades),
        gradeSubmissions: Object.values(ids.gradeSubmissions),
        announcements: Object.values(ids.announcements),
    };

    for (const [collectionName, objectIds] of Object.entries(
        collectionIds,
    )) {
        await db.collection(collectionName).deleteMany(
        {
            _id: {
            $in: objectIds,
            },
        },
        { session },
        );
    }
}

async function seedDatabase(): Promise<void> {
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();

        const db = client.db(databaseName);

        console.log(`Connected to MongoDB database: ${databaseName}`);

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
            console.log("Removing existing demo seed records...");
            await clearSeedData(db, session);
            }

            await db.collection("users").bulkWrite(
            [
                {
                updateOne: {
                    filter: { _id: ids.users.student1 },
                    update: {
                    $set: {
                        email: "student@university.edu",
                        username: "student.demo",
                        passwordHash,
                        role: "STUDENT",
                        accountStatus: "ACTIVE",
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
                {
                updateOne: {
                    filter: { _id: ids.users.student2 },
                    update: {
                    $set: {
                        email: "angela.cruz@university.edu",
                        username: "angela.cruz",
                        passwordHash,
                        role: "STUDENT",
                        accountStatus: "ACTIVE",
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
                {
                updateOne: {
                    filter: { _id: ids.users.student3 },
                    update: {
                    $set: {
                        email: "marco.delarosa@university.edu",
                        username: "marco.delarosa",
                        passwordHash,
                        role: "STUDENT",
                        accountStatus: "ACTIVE",
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
                {
                updateOne: {
                    filter: { _id: ids.users.faculty1 },
                    update: {
                    $set: {
                        email: "faculty@university.edu",
                        username: "prof.reyes",
                        passwordHash,
                        role: "FACULTY",
                        accountStatus: "ACTIVE",
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
            ],
            { session },
            );

            await db.collection("students").bulkWrite(
            [
                {
                updateOne: {
                    filter: { _id: ids.students.student1 },
                    update: {
                    $set: {
                        userId: ids.users.student1,
                        studentNumber: "12345678",
                        firstName: "John",
                        lastName: "Doe",
                        programCode: "BSCS-ST",
                        programName:
                        "Bachelor of Science in Computer Science major in Software Technology",
                        curriculumCode: "CS-STM 2021",
                        college: "College of Computer Studies",
                        campus: "Manila Campus",
                        yearLevel: 4,
                        requiredUnits: 173,
                        status: "ACTIVE",
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
                {
                updateOne: {
                    filter: { _id: ids.students.student2 },
                    update: {
                    $set: {
                        userId: ids.users.student2,
                        studentNumber: "12345001",
                        firstName: "Angela",
                        lastName: "Cruz",
                        programCode: "BSCS-ST",
                        programName: "Bachelor of Science in Computer Science major in Software Technology",
                        curriculumCode: "CS-STM 2021",
                        college: "College of Computer Studies",
                        campus: "Manila Campus",
                        yearLevel: 4,
                        requiredUnits: 173,
                        status: "ACTIVE",
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
                {
                updateOne: {
                    filter: { _id: ids.students.student3 },
                    update: {
                    $set: {
                        userId: ids.users.student3,
                        studentNumber: "12345002",
                        firstName: "Marco",
                        lastName: "Dela Rosa",
                        programCode: "BSCS-ST",
                        programName:
                        "Bachelor of Science in Computer Science major in Software Technology",
                        curriculumCode: "CS-STM 2021",
                        college: "College of Computer Studies",
                        campus: "Manila Campus",
                        yearLevel: 4,
                        requiredUnits: 173,
                        status: "ACTIVE",
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
            ],
            { session },
            );

            await db.collection("faculty").updateOne(
            { _id: ids.faculty.faculty1 },
            {
                $set: {
                userId: ids.users.faculty1,
                employeeNumber: "FAC-2026-001",
                title: "Prof.",
                firstName: "Andrea",
                lastName: "Reyes",
                department: "Computer Science",
                college: "College of Computer Studies",
                status: "ACTIVE",
                updatedAt: now,
                },
                $setOnInsert: {
                createdAt: now,
                },
            },
            {
                upsert: true,
                session,
            },
            );

            await db.collection("academicTerms").bulkWrite(
            [
                {
                updateOne: {
                    filter: { _id: ids.terms.current },
                    update: {
                    $set: {
                        code: "AY2026-2027-T1",
                        name: "Term 1",
                        academicYear: "2026-2027",
                        termNumber: 1,
                        startDate: new Date("2026-07-01"),
                        endDate: new Date("2026-10-31"),
                        enrollmentStart: new Date("2026-06-20"),
                        enrollmentEnd: new Date("2026-08-05"),
                        gradeSubmissionDeadline: new Date(
                        "2026-11-10",
                        ),
                        status: "ACTIVE",
                        isCurrent: true,
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
                {
                updateOne: {
                    filter: { _id: ids.terms.previous },
                    update: {
                    $set: {
                        code: "AY2025-2026-T3",
                        name: "Term 3",
                        academicYear: "2025-2026",
                        termNumber: 3,
                        startDate: new Date("2026-01-05"),
                        endDate: new Date("2026-04-30"),
                        enrollmentStart: new Date("2025-12-01"),
                        enrollmentEnd: new Date("2026-01-15"),
                        status: "COMPLETED",
                        isCurrent: false,
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
            ],
            { session },
            );

            const courseDocuments = [
            {
                _id: ids.courses.distributedSystems,
                courseCode: "STDISCM",
                courseName: "Distributed Systems",
            },
            {
                _id: ids.courses.webDevelopment,
                courseCode: "WEBAPDE",
                courseName: "Web Application Development",
            },
            {
                _id: ids.courses.softwareEngineering,
                courseCode: "SOFTENG",
                courseName: "Software Engineering",
            },
            {
                _id: ids.courses.practicum,
                courseCode: "PRCTICM",
                courseName: "Practicum",
            },
            {
                _id: ids.courses.databaseManagement,
                courseCode: "DBMGT01",
                courseName: "Database Management",
            },
            {
                _id: ids.courses.computerNetworks,
                courseCode: "COMNETS",
                courseName: "Computer Networks",
            },
            ];

            for (const course of courseDocuments) {
            await db.collection("courses").updateOne(
                { _id: course._id },
                {
                $set: {
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    units: 3,
                    department: "Computer Science",
                    status: "ACTIVE",
                    updatedAt: now,
                },
                $setOnInsert: {
                    createdAt: now,
                },
                },
                {
                upsert: true,
                session,
                },
            );
            }

            const sectionDocuments = [
            {
                _id: ids.sections.distributedSystems,
                courseId: ids.courses.distributedSystems,
                academicTermId: ids.terms.current,
                sectionCode: "S12",
                schedule: [
                {
                    days: ["MONDAY", "WEDNESDAY"],
                    startTime: "08:00",
                    endTime: "09:30",
                    room: "G304",
                },
                ],
                capacity: 32,
                enrolledCount: 3,
            },
            {
                _id: ids.sections.webDevelopment,
                courseId: ids.courses.webDevelopment,
                academicTermId: ids.terms.current,
                sectionCode: "S11",
                schedule: [
                {
                    days: ["MONDAY", "WEDNESDAY"],
                    startTime: "10:00",
                    endTime: "11:30",
                    room: "G205",
                },
                ],
                capacity: 30,
                enrolledCount: 1,
            },
            {
                _id: ids.sections.softwareEngineering,
                courseId: ids.courses.softwareEngineering,
                academicTermId: ids.terms.current,
                sectionCode: "S13",
                schedule: [
                {
                    days: ["TUESDAY", "THURSDAY"],
                    startTime: "13:00",
                    endTime: "14:30",
                    room: "A110",
                },
                ],
                capacity: 34,
                enrolledCount: 1,
            },
            {
                _id: ids.sections.practicum,
                courseId: ids.courses.practicum,
                academicTermId: ids.terms.current,
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
                enrolledCount: 1,
            },
            {
                _id: ids.sections.databaseManagement,
                courseId: ids.courses.databaseManagement,
                academicTermId: ids.terms.previous,
                sectionCode: "S10",
                schedule: [],
                capacity: 31,
                enrolledCount: 1,
            },
            {
                _id: ids.sections.computerNetworks,
                courseId: ids.courses.computerNetworks,
                academicTermId: ids.terms.previous,
                sectionCode: "S09",
                schedule: [],
                capacity: 30,
                enrolledCount: 1,
            },
            ];

            for (const section of sectionDocuments) {
            await db.collection("sections").updateOne(
                { _id: section._id },
                {
                $set: {
                    ...section,
                    facultyId: ids.faculty.faculty1,
                    status: "OPEN",
                    updatedAt: now,
                },
                $setOnInsert: {
                    createdAt: now,
                },
                },
                {
                upsert: true,
                session,
                },
            );
            }

            const currentEnrollmentDate = new Date("2026-07-02");

            const enrollmentDocuments = [
            {
                _id: ids.enrollments.current1,
                studentId: ids.students.student1,
                sectionId: ids.sections.distributedSystems,
                academicTermId: ids.terms.current,
                status: "ENROLLED",
                enrolledAt: currentEnrollmentDate,
            },
            {
                _id: ids.enrollments.current2,
                studentId: ids.students.student1,
                sectionId: ids.sections.webDevelopment,
                academicTermId: ids.terms.current,
                status: "ENROLLED",
                enrolledAt: currentEnrollmentDate,
            },
            {
                _id: ids.enrollments.current3,
                studentId: ids.students.student1,
                sectionId: ids.sections.softwareEngineering,
                academicTermId: ids.terms.current,
                status: "ENROLLED",
                enrolledAt: currentEnrollmentDate,
            },
            {
                _id: ids.enrollments.current4,
                studentId: ids.students.student1,
                sectionId: ids.sections.practicum,
                academicTermId: ids.terms.current,
                status: "ENROLLED",
                enrolledAt: currentEnrollmentDate,
            },
            {
                _id: ids.enrollments.classmate1,
                studentId: ids.students.student2,
                sectionId: ids.sections.distributedSystems,
                academicTermId: ids.terms.current,
                status: "ENROLLED",
                enrolledAt: currentEnrollmentDate,
            },
            {
                _id: ids.enrollments.classmate2,
                studentId: ids.students.student3,
                sectionId: ids.sections.distributedSystems,
                academicTermId: ids.terms.current,
                status: "ENROLLED",
                enrolledAt: currentEnrollmentDate,
            },
            {
                _id: ids.enrollments.previous1,
                studentId: ids.students.student1,
                sectionId: ids.sections.databaseManagement,
                academicTermId: ids.terms.previous,
                status: "COMPLETED",
                enrolledAt: new Date("2026-01-05"),
            },
            {
                _id: ids.enrollments.previous2,
                studentId: ids.students.student1,
                sectionId: ids.sections.computerNetworks,
                academicTermId: ids.terms.previous,
                status: "COMPLETED",
                enrolledAt: new Date("2026-01-05"),
            },
            ];

            for (const enrollment of enrollmentDocuments) {
            await db.collection("enrollments").updateOne(
                { _id: enrollment._id },
                {
                $set: {
                    ...enrollment,
                    updatedAt: now,
                },
                $setOnInsert: {
                    createdAt: now,
                },
                },
                {
                upsert: true,
                session,
                },
            );
            }

            const gradeDocuments = [
            {
                _id: ids.grades.currentStudent1,
                studentId: ids.students.student1,
                sectionId: ids.sections.distributedSystems,
                academicTermId: ids.terms.current,
                facultyId: ids.faculty.faculty1,
                activitiesScore: 28,
                midtermScore: 27,
                computedScore: 55,
                result: "INCOMPLETE",
                status: "DRAFT",
                version: 1,
            },
            {
                _id: ids.grades.currentStudent2,
                studentId: ids.students.student2,
                sectionId: ids.sections.distributedSystems,
                academicTermId: ids.terms.current,
                facultyId: ids.faculty.faculty1,
                activitiesScore: 26,
                midtermScore: 25,
                finalScore: 36,
                computedScore: 87,
                finalGradeValue: 3.5,
                result: "PASSED",
                status: "DRAFT",
                version: 1,
            },
            {
                _id: ids.grades.currentStudent3,
                studentId: ids.students.student3,
                sectionId: ids.sections.distributedSystems,
                academicTermId: ids.terms.current,
                facultyId: ids.faculty.faculty1,
                activitiesScore: 29,
                midtermScore: 28,
                finalScore: 38,
                computedScore: 95,
                finalGradeValue: 4,
                result: "PASSED",
                status: "DRAFT",
                version: 1,
            },
            {
                _id: ids.grades.previous1,
                studentId: ids.students.student1,
                sectionId: ids.sections.databaseManagement,
                academicTermId: ids.terms.previous,
                facultyId: ids.faculty.faculty1,
                computedScore: 85,
                finalGradeValue: 3,
                result: "PASSED",
                status: "VERIFIED",
                version: 1,
                submittedAt: new Date("2026-04-20"),
                verifiedAt: new Date("2026-04-25"),
            },
            {
                _id: ids.grades.previous2,
                studentId: ids.students.student1,
                sectionId: ids.sections.computerNetworks,
                academicTermId: ids.terms.previous,
                facultyId: ids.faculty.faculty1,
                computedScore: 90,
                finalGradeValue: 3.5,
                result: "PASSED",
                status: "VERIFIED",
                version: 1,
                submittedAt: new Date("2026-04-20"),
                verifiedAt: new Date("2026-04-25"),
            },
            ];

            for (const grade of gradeDocuments) {
            await db.collection("grades").updateOne(
                { _id: grade._id },
                {
                $set: {
                    ...grade,
                    updatedAt: now,
                },
                $setOnInsert: {
                    createdAt: now,
                },
                },
                {
                upsert: true,
                session,
                },
            );
            }

            await db.collection("gradeSubmissions").updateOne(
            { _id: ids.gradeSubmissions.distributedSystems },
            {
                $set: {
                sectionId: ids.sections.distributedSystems,
                academicTermId: ids.terms.current,
                facultyId: ids.faculty.faculty1,
                gradeType: "FINAL",
                totalStudents: 3,
                completedCount: 2,
                status: "DRAFT",
                updatedAt: now,
                },
                $setOnInsert: {
                createdAt: now,
                },
            },
            {
                upsert: true,
                session,
            },
            );

            await db.collection("announcements").bulkWrite(
            [
                {
                updateOne: {
                    filter: {
                    _id: ids.announcements.enrollmentOpen,
                    },
                    update: {
                    $set: {
                        title: "Enrollment period is now open",
                        message:
                        "Add courses until August 5, 2026.",
                        audience: "STUDENT",
                        publishedAt: new Date("2026-07-28"),
                        createdBy: ids.users.faculty1,
                        status: "PUBLISHED",
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
                {
                updateOne: {
                    filter: {
                    _id: ids.announcements.gradesAvailable,
                    },
                    update: {
                    $set: {
                        title: "Previous grades are available",
                        message:
                        "View your verified grades in the Grades page.",
                        audience: "STUDENT",
                        publishedAt: new Date("2026-07-20"),
                        createdBy: ids.users.faculty1,
                        status: "PUBLISHED",
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                    },
                    upsert: true,
                },
                },
            ],
            { session },
            );
        });
        } finally {
        await session.endSession();
        }

        console.log("");
        console.log("Seed completed successfully.");
        console.log("");
        console.log("Student account:");
        console.log("  Email: student@university.edu");
        console.log("  Username: student.demo");
        console.log("  Password: Password123!");
        console.log("");
        console.log("Faculty account:");
        console.log("  Email: faculty@university.edu");
        console.log("  Username: prof.reyes");
        console.log("  Password: Password123!");
    } finally {
        await client.close();
    }
}

seedDatabase().catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
});