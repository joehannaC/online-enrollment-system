import {
    ObjectId,
    type ClientSession,
    type Db,
    type Document,
} from "mongodb";

import {
    getDatabase,
    getMongoClient,
} from "../config/database.js";
import {
    publishGradeUpdated,
} from "../realtime/realtimePublisher.js";
import type {
    GradeComponents,
    GradeDraftInput,
    GradeDraftResult,
    GradeEntryPageResponse,
    GradeEntryStudent,
    GradeEntrySubject,
    SubmitGradesResult,
} from "../types/facultyGradeEntry.types.js";

export class FacultyGradeEntryError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name =
            "FacultyGradeEntryError";
    }
}

function toObjectId(
    value: string,
    fieldName: string,
): ObjectId {
    if (!ObjectId.isValid(value)) {
        throw new FacultyGradeEntryError(
            "INVALID_IDENTIFIER",
            `${fieldName} is invalid.`,
            400,
        );
    }

    return new ObjectId(value);
}

function buildFullName(
    person: Document,
): string {
    return [
        person.firstName,
        person.middleName,
        person.lastName,
    ]
        .filter(Boolean)
        .join(" ");
}

function normalizeComponents(
    grade: Document | undefined,
): GradeComponents {
    return {
        activitiesScore:
            typeof grade?.activitiesScore ===
                "number"
                ? grade.activitiesScore
                : undefined,

        majorOutput1Score:
            typeof grade?.majorOutput1Score ===
                "number"
                ? grade.majorOutput1Score
                : undefined,

        majorOutput2Score:
            typeof grade?.majorOutput2Score ===
                "number"
                ? grade.majorOutput2Score
                : undefined,

        midtermExamScore:
            typeof grade?.midtermExamScore ===
                "number"
                ? grade.midtermExamScore
                : undefined,

        finalExamScore:
            typeof grade?.finalExamScore ===
                "number"
                ? grade.finalExamScore
                : undefined,
    };
}

function isComplete(
    components: GradeComponents,
): boolean {
    return (
        components.activitiesScore !==
            undefined &&
        components.majorOutput1Score !==
            undefined &&
        components.majorOutput2Score !==
            undefined &&
        components.midtermExamScore !==
            undefined &&
        components.finalExamScore !==
            undefined
    );
}

function calculateRawFinalGrade(
    components: GradeComponents,
): number | undefined {
    if (!isComplete(components)) {
        return undefined;
    }

    const raw =
        Number(
            components.activitiesScore,
        ) *
            0.2 +
        Number(
            components.majorOutput1Score,
        ) *
            0.2 +
        Number(
            components.majorOutput2Score,
        ) *
            0.2 +
        Number(
            components.midtermExamScore,
        ) *
            0.2 +
        Number(
            components.finalExamScore,
        ) *
            0.2;

    return Math.round(raw * 100) /
        100;
}

function representFinalGrade(
    rawFinalGrade:
        | number
        | undefined,
): number | undefined {
    if (
        rawFinalGrade ===
        undefined
    ) {
        return undefined;
    }

    if (rawFinalGrade >= 90) {
        return 4.0;
    }

    if (rawFinalGrade >= 85) {
        return 3.5;
    }

    if (rawFinalGrade >= 80) {
        return 3.0;
    }

    if (rawFinalGrade >= 75) {
        return 2.5;
    }

    if (rawFinalGrade >= 70) {
        return 2.0;
    }

    if (rawFinalGrade >= 65) {
        return 1.5;
    }

    if (rawFinalGrade >= 60) {
        return 1.0;
    }

    return 0.0;
}

function formatSchedule(
    value: unknown,
): {
    scheduleLabel: string;
    room: string;
} {
    if (!Array.isArray(value) ||
        value.length === 0) {
        return {
            scheduleLabel: "TBA",
            room: "TBA",
        };
    }

    const scheduleLabel =
        value.map((item) => {
            const days =
                Array.isArray(item.days)
                    ? item.days
                        .map(String)
                        .join("/")
                    : "";

            const time =
                item.startTime &&
                item.endTime
                    ? `${String(
                        item.startTime,
                    )}–${String(
                        item.endTime,
                    )}`
                    : "";

            return [
                days,
                time,
            ]
                .filter(Boolean)
                .join(" • ");
        }).join(", ");

    const room =
        value.map(
            (item) =>
                String(
                    item.room ?? "TBA",
                ),
        ).join(", ");

    return {
        scheduleLabel:
            scheduleLabel || "TBA",
        room:
            room || "TBA",
    };
}

async function getFacultyAndTerm(
    db: Db,
    authenticatedUserId: string,
    session?: ClientSession,
): Promise<{
    faculty: Document;
    term: Document;
}> {
    const userId =
        toObjectId(
            authenticatedUserId,
            "Authenticated user ID",
        );

    const faculty =
        await db
            .collection("faculty")
            .findOne(
                {
                    userId,
                    status: "ACTIVE",
                },
                {
                    session,
                },
            );

    if (!faculty) {
        throw new FacultyGradeEntryError(
            "FACULTY_NOT_FOUND",
            "No active faculty profile was found.",
            404,
        );
    }

    const term =
        (await db
            .collection(
                "academicTerms",
            )
            .findOne(
                {
                    isEnrollmentTerm:
                        true,
                    status: {
                        $in: [
                            "UPCOMING",
                            "ACTIVE",
                        ],
                    },
                },
                {
                    session,
                },
            )) ??
        (await db
            .collection(
                "academicTerms",
            )
            .findOne(
                {
                    isCurrent: true,
                    status: "ACTIVE",
                },
                {
                    session,
                },
            ));

    if (!term) {
        throw new FacultyGradeEntryError(
            "FACULTY_TERM_NOT_FOUND",
            "No active grading term was found.",
            503,
        );
    }

    return {
        faculty,
        term,
    };
}

async function getSubmittedEnrollmentData(
    db: Db,
    termId: ObjectId,
    sectionIds: ObjectId[],
    session?: ClientSession,
): Promise<{
    enrollmentItems: Document[];
    enrollmentMap: Map<
        string,
        Document
    >;
}> {
    const enrollments =
        await db
            .collection(
                "studentEnrollments",
            )
            .find(
                {
                    academicTermId:
                        termId,
                    status:
                        "SUBMITTED",
                },
                {
                    session,
                },
            )
            .toArray();

    const enrollmentIds =
        enrollments.map(
            (enrollment) =>
                enrollment._id,
        );

    const enrollmentItems =
        enrollmentIds.length > 0 &&
        sectionIds.length > 0
            ? await db
                .collection(
                    "studentEnrollmentItems",
                )
                .find(
                    {
                        enrollmentId: {
                            $in:
                                enrollmentIds,
                        },
                        sectionId: {
                            $in:
                                sectionIds,
                        },
                    },
                    {
                        session,
                    },
                )
                .toArray()
            : [];

    return {
        enrollmentItems,
        enrollmentMap:
            new Map(
                enrollments.map(
                    (enrollment) => [
                        enrollment._id.toString(),
                        enrollment,
                    ],
                ),
            ),
    };
}

export async function getGradeEntryPage(
    authenticatedUserId: string,
    requestedSectionId?: string,
): Promise<GradeEntryPageResponse> {
    const db =
        getDatabase();

    const {
        faculty,
        term,
    } =
        await getFacultyAndTerm(
            db,
            authenticatedUserId,
        );

    const sections =
        await db
            .collection("sections")
            .find({
                facultyId:
                    faculty._id,
                academicTermId:
                    term._id,
                status: {
                    $in: [
                        "OPEN",
                        "CLOSED",
                    ],
                },
            })
            .sort({
                courseId: 1,
                sectionCode: 1,
            })
            .toArray();

    const sectionIds =
        sections.map(
            (section) =>
                section._id,
        );

    const {
        enrollmentItems,
        enrollmentMap,
    } =
        await getSubmittedEnrollmentData(
            db,
            term._id,
            sectionIds,
        );

    const itemsBySection =
        new Map<
            string,
            Document[]
        >();

    for (
        const item of
        enrollmentItems
    ) {
        const sectionId =
            item.sectionId.toString();

        const items =
            itemsBySection.get(
                sectionId,
            ) ?? [];

        items.push(item);
        itemsBySection.set(
            sectionId,
            items,
        );
    }

    const visibleSections =
        sections.filter(
            (section) =>
                (
                    itemsBySection.get(
                        section._id.toString(),
                    ) ?? []
                ).length > 0,
        );

    const courseIds =
        Array.from(
            new Map(
                visibleSections.map(
                    (section) => [
                        section.courseId.toString(),
                        section.courseId,
                    ],
                ),
            ).values(),
        );

    const courses =
        courseIds.length > 0
            ? await db
                .collection(
                    "courses",
                )
                .find({
                    _id: {
                        $in:
                            courseIds,
                    },
                })
                .toArray()
            : [];

    const courseMap =
        new Map(
            courses.map(
                (course) => [
                    course._id.toString(),
                    course,
                ],
            ),
        );

    const submissions =
        visibleSections.length > 0
            ? await db
                .collection(
                    "gradeSubmissions",
                )
                .find({
                    sectionId: {
                        $in:
                            visibleSections.map(
                                (section) =>
                                    section._id,
                            ),
                    },
                    academicTermId:
                        term._id,
                    facultyId:
                        faculty._id,
                    gradeType:
                        "FINAL",
                })
                .toArray()
            : [];

    const submissionMap =
        new Map(
            submissions.map(
                (submission) => [
                    submission.sectionId.toString(),
                    submission,
                ],
            ),
        );

    const allGrades =
        visibleSections.length > 0
            ? await db
                .collection("grades")
                .find({
                    sectionId: {
                        $in:
                            visibleSections.map(
                                (section) =>
                                    section._id,
                            ),
                    },
                    academicTermId:
                        term._id,
                    facultyId:
                        faculty._id,
                })
                .toArray()
            : [];

    const gradesBySection =
        new Map<
            string,
            Document[]
        >();

    for (
        const grade of
        allGrades
    ) {
        const sectionId =
            grade.sectionId.toString();

        const sectionGrades =
            gradesBySection.get(
                sectionId,
            ) ?? [];

        sectionGrades.push(
            grade,
        );

        gradesBySection.set(
            sectionId,
            sectionGrades,
        );
    }

    const subjects:
        GradeEntrySubject[] =
        visibleSections.flatMap(
            (section) => {
                const course =
                    courseMap.get(
                        section.courseId.toString(),
                    );

                if (!course) {
                    return [];
                }

                const sectionItems =
                    itemsBySection.get(
                        section._id.toString(),
                    ) ?? [];

                const sectionGrades =
                    gradesBySection.get(
                        section._id.toString(),
                    ) ?? [];

                const gradedStudents =
                    sectionGrades.filter(
                        (grade) =>
                            isComplete(
                                normalizeComponents(
                                    grade,
                                ),
                            ),
                    ).length;

                const schedule =
                    formatSchedule(
                        section.schedule,
                    );

                return [
                    {
                        sectionId:
                            section._id.toString(),
                        sectionCode:
                            String(
                                section.sectionCode ??
                                    "",
                            ),
                        courseId:
                            course._id.toString(),
                        courseCode:
                            String(
                                course.courseCode ??
                                    "",
                            ),
                        courseName:
                            String(
                                course.courseName ??
                                    "",
                            ),
                        scheduleLabel:
                            schedule.scheduleLabel,
                        room:
                            schedule.room,
                        totalStudents:
                            sectionItems.length,
                        gradedStudents,
                        submissionStatus:
                            submissionMap.get(
                                section._id.toString(),
                            )?.status ===
                            "SUBMITTED"
                                ? "SUBMITTED"
                                : "DRAFT",
                    },
                ];
            },
        );

    const selectedSection =
        requestedSectionId
            ? subjects.find(
                (subject) =>
                    subject.sectionId ===
                    requestedSectionId,
            ) ?? null
            : subjects[0] ?? null;

    if (
        requestedSectionId &&
        !selectedSection
    ) {
        throw new FacultyGradeEntryError(
            "SECTION_NOT_FOUND",
            "The selected section was not found or has no enrolled students.",
            404,
        );
    }

    if (!selectedSection) {
        return {
            selectedSection:
                null,
            subjects,
            students: [],
        };
    }

    const selectedSectionObjectId =
        new ObjectId(
            selectedSection.sectionId,
        );

    const selectedItems =
        itemsBySection.get(
            selectedSection.sectionId,
        ) ?? [];

    const selectedStudentIds =
        selectedItems.flatMap(
            (item) => {
                const enrollment =
                    enrollmentMap.get(
                        item.enrollmentId.toString(),
                    );

                return enrollment
                    ? [
                        enrollment.studentId,
                    ]
                    : [];
            },
        );

    const students =
        selectedStudentIds.length > 0
            ? await db
                .collection(
                    "students",
                )
                .find({
                    _id: {
                        $in:
                            selectedStudentIds,
                    },
                })
                .toArray()
            : [];

    const grades =
        await db
            .collection("grades")
            .find({
                sectionId:
                    selectedSectionObjectId,
                studentId: {
                    $in:
                        selectedStudentIds,
                },
                academicTermId:
                    term._id,
                facultyId:
                    faculty._id,
            })
            .toArray();

    const gradeMap =
        new Map(
            grades.map(
                (grade) => [
                    grade.studentId.toString(),
                    grade,
                ],
            ),
        );

    const entryStudents:
        GradeEntryStudent[] =
        students.map((student) => {
            const grade =
                gradeMap.get(
                    student._id.toString(),
                );

            const components =
                normalizeComponents(
                    grade,
                );

            const rawFinalGrade =
                calculateRawFinalGrade(
                    components,
                );

            return {
                gradeId:
                    grade?._id?.toString(),
                studentId:
                    student._id.toString(),
                studentNumber:
                    String(
                        student.studentNumber ??
                            "",
                    ),
                fullName:
                    buildFullName(
                        student,
                    ),
                components,
                rawFinalGrade,
                finalGradeValue:
                    representFinalGrade(
                        rawFinalGrade,
                    ),
                status:
                    grade?.status ===
                    "SUBMITTED"
                        ? "SUBMITTED"
                        : "DRAFT",
                version:
                    Number(
                        grade?.version ??
                            0,
                    ),
            };
        })
        .sort(
            (first, second) =>
                first.fullName.localeCompare(
                    second.fullName,
                ),
        );

    const latestSavedAt =
        grades
            .map(
                (grade) =>
                    grade.updatedAt,
            )
            .filter(Boolean)
            .sort(
                (
                    first,
                    second,
                ) =>
                    new Date(
                        second,
                    ).getTime() -
                    new Date(
                        first,
                    ).getTime(),
            )[0];

    return {
        selectedSection,
        subjects,
        students:
            entryStudents,
        lastSavedAt:
            latestSavedAt
                ? new Date(
                    latestSavedAt,
                ).toISOString()
                : undefined,
    };
}

export async function saveGradeDraft(
    authenticatedUserId: string,
    input: GradeDraftInput,
): Promise<GradeDraftResult> {
    const db =
        getDatabase();

    const {
        faculty,
        term,
    } =
        await getFacultyAndTerm(
            db,
            authenticatedUserId,
        );

    const sectionId =
        toObjectId(
            input.sectionId,
            "Section ID",
        );

    const section =
        await db
            .collection("sections")
            .findOne({
                _id:
                    sectionId,
                facultyId:
                    faculty._id,
                academicTermId:
                    term._id,
            });

    if (!section) {
        throw new FacultyGradeEntryError(
            "SECTION_NOT_FOUND",
            "The selected section could not be found.",
            404,
        );
    }

    const submission =
        await db
            .collection(
                "gradeSubmissions",
            )
            .findOne({
                sectionId,
                academicTermId:
                    term._id,
                facultyId:
                    faculty._id,
                gradeType:
                    "FINAL",
            });

    if (
        submission?.status ===
        "SUBMITTED"
    ) {
        throw new FacultyGradeEntryError(
            "GRADES_ALREADY_SUBMITTED",
            "These grades have already been submitted and can no longer be changed.",
            409,
        );
    }

    const now =
        new Date();

    let completedCount =
        0;

    for (
        const item of
        input.grades
    ) {
        const studentId =
            toObjectId(
                item.studentId,
                "Student ID",
            );

        const components =
            item.components;

        const rawFinalGrade =
            calculateRawFinalGrade(
                components,
            );

        const finalGradeValue =
            representFinalGrade(
                rawFinalGrade,
            );

        if (
            rawFinalGrade !==
            undefined
        ) {
            completedCount += 1;
        }

        const updateResult =
            await db
                .collection("grades")
                .updateOne(
                    {
                        sectionId,
                        studentId,
                        academicTermId:
                            term._id,
                        facultyId:
                            faculty._id,
                        version:
                            item.expectedVersion,
                        status: {
                            $ne:
                                "SUBMITTED",
                        },
                    },
                    {
                        $set: {
                            courseId:
                                section.courseId,
                            activitiesScore:
                                components.activitiesScore,
                            majorOutput1Score:
                                components.majorOutput1Score,
                            majorOutput2Score:
                                components.majorOutput2Score,
                            midtermExamScore:
                                components.midtermExamScore,
                            finalExamScore:
                                components.finalExamScore,
                            rawFinalGrade,
                            finalGradeValue,
                            result:
                                rawFinalGrade ===
                                undefined
                                    ? "INCOMPLETE"
                                    : finalGradeValue ===
                                        0
                                    ? "FAILED"
                                    : "PASSED",
                            status:
                                "DRAFT",
                            updatedAt:
                                now,
                        },
                        $setOnInsert: {
                            createdAt:
                                now,
                        },
                        $inc: {
                            version:
                                1,
                        },
                    },
                    {
                        upsert:
                            item.expectedVersion ===
                            0,
                    },
                );

        if (
            updateResult.matchedCount ===
                0 &&
            updateResult.upsertedCount ===
                0
        ) {
            throw new FacultyGradeEntryError(
                "GRADE_VERSION_CONFLICT",
                "A grade was changed in another tab. Reload the section and try again.",
                409,
            );
        }
    }

    await db
        .collection(
            "gradeSubmissions",
        )
        .updateOne(
            {
                sectionId,
                academicTermId:
                    term._id,
                facultyId:
                    faculty._id,
                gradeType:
                    "FINAL",
            },
            {
                $set: {
                    status:
                        "DRAFT",
                    completedCount,
                    totalStudents:
                        input.grades.length,
                    updatedAt:
                        now,
                },
                $setOnInsert: {
                    createdAt:
                        now,
                },
            },
            {
                upsert: true,
            },
        );

    return {
        sectionId:
            sectionId.toString(),
        savedCount:
            input.grades.length,
        completedCount,
        totalStudents:
            input.grades.length,
        status:
            "DRAFT",
        savedAt:
            now.toISOString(),
    };
}


async function synchronizeStudentAcademicState(
    db: Db,
    session: ClientSession,
    studentId: ObjectId,
    academicTermId: ObjectId,
    now: Date,
): Promise<void> {
    const submittedHeaders =
        await db
            .collection("studentEnrollments")
            .find(
                {
                    studentId,
                    academicTermId,
                    status: "SUBMITTED",
                },
                { session },
            )
            .toArray();

    const headerIds = submittedHeaders.map(
        (header) => header._id,
    );

    const termItems =
        headerIds.length > 0
            ? await db
                .collection("studentEnrollmentItems")
                .find(
                    {
                        enrollmentId: { $in: headerIds },
                        studentId,
                        academicTermId,
                    },
                    { session },
                )
                .toArray()
            : [];

    const termSectionIds = termItems.map(
        (item) => item.sectionId,
    );

    const submittedTermGrades =
        termSectionIds.length > 0
            ? await db
                .collection("grades")
                .find(
                    {
                        studentId,
                        academicTermId,
                        sectionId: { $in: termSectionIds },
                        status: { $in: ["SUBMITTED", "VERIFIED"] },
                    },
                    { session },
                )
                .toArray()
            : [];

    const termGradeBySection = new Map(
        submittedTermGrades.map((grade) => [
            grade.sectionId.toString(),
            grade,
        ]),
    );

    for (const item of termItems) {
        const grade = termGradeBySection.get(
            item.sectionId.toString(),
        );

        if (!grade) {
            continue;
        }

        const finalGradeValue =
            typeof grade.finalGradeValue === "number"
                ? grade.finalGradeValue
                : 0;

        const result =
            finalGradeValue >= 1.0
                ? "PASSED"
                : "FAILED";

        await db
            .collection("studentEnrollmentItems")
            .updateOne(
                { _id: item._id },
                {
                    $set: {
                        academicStatus: "COMPLETED",
                        result,
                        finalGradeValue,
                        completedAt: grade.submittedAt ?? now,
                        updatedAt: now,
                    },
                },
                { session },
            );
    }

    const allTermGradesSubmitted =
        termItems.length > 0 &&
        termItems.every((item) =>
            termGradeBySection.has(
                item.sectionId.toString(),
            ),
        );

    if (allTermGradesSubmitted && headerIds.length > 0) {
        await db
            .collection("studentEnrollments")
            .updateMany(
                { _id: { $in: headerIds } },
                {
                    $set: {
                        isTermFinalized: true,
                        termFinalizedAt: now,
                        totalAcademicUnits: 0,
                        totalNonAcademicUnits: 0,
                        updatedAt: now,
                    },
                },
                { session },
            );
    }

    const allSubmittedGrades =
        await db
            .collection("grades")
            .find(
                {
                    studentId,
                    status: { $in: ["SUBMITTED", "VERIFIED"] },
                },
                { session },
            )
            .toArray();

    const allSectionIds = Array.from(
        new Map(
            allSubmittedGrades.map((grade) => [
                grade.sectionId.toString(),
                grade.sectionId,
            ]),
        ).values(),
    );

    const allSections =
        allSectionIds.length > 0
            ? await db
                .collection("sections")
                .find(
                    { _id: { $in: allSectionIds } },
                    { session },
                )
                .toArray()
            : [];

    const sectionMap = new Map(
        allSections.map((section) => [
            section._id.toString(),
            section,
        ]),
    );

    const allCourseIds = Array.from(
        new Map(
            allSections.map((section) => [
                section.courseId.toString(),
                section.courseId,
            ]),
        ).values(),
    );

    const allCourses =
        allCourseIds.length > 0
            ? await db
                .collection("courses")
                .find(
                    { _id: { $in: allCourseIds } },
                    { session },
                )
                .toArray()
            : [];

    const courseMap = new Map(
        allCourses.map((course) => [
            course._id.toString(),
            course,
        ]),
    );

    const latestGradeByCourse = new Map<string, Document>();

    for (const grade of allSubmittedGrades) {
        const section = sectionMap.get(
            grade.sectionId.toString(),
        );
        if (!section) continue;

        const key = section.courseId.toString();
        const existing = latestGradeByCourse.get(key);
        const currentTime = new Date(
            grade.submittedAt ?? grade.updatedAt ?? grade.createdAt ?? 0,
        ).getTime();
        const existingTime = existing
            ? new Date(
                existing.submittedAt ??
                    existing.updatedAt ??
                    existing.createdAt ??
                    0,
            ).getTime()
            : -1;

        if (!existing || currentTime >= existingTime) {
            latestGradeByCourse.set(key, grade);
        }
    }

    let earnedUnits = 0;
    let earnedNonAcademicUnits = 0;

    for (const [courseId, grade] of latestGradeByCourse) {
        const course = courseMap.get(courseId);
        if (!course) continue;

        const passed =
            grade.result === "CREDITED" ||
            (typeof grade.finalGradeValue === "number" &&
                grade.finalGradeValue >= 1.0);

        if (!passed) continue;

        earnedUnits += Number(
            course.academicUnits ?? course.units ?? 0,
        );
        earnedNonAcademicUnits += Number(
            course.nonAcademicUnits ?? 0,
        );
    }

    const pendingTermItems = termItems.filter(
        (item) =>
            !termGradeBySection.has(
                item.sectionId.toString(),
            ),
    );

    const enrolledUnits = pendingTermItems.reduce(
        (total, item) =>
            total + Number(item.academicUnits ?? 0),
        0,
    );

    const enrolledNonAcademicUnits = pendingTermItems.reduce(
        (total, item) =>
            total + Number(item.nonAcademicUnits ?? 0),
        0,
    );

    const student = await db
        .collection("students")
        .findOne({ _id: studentId }, { session });

    if (student) {
        const requiredUnits = Number(student.requiredUnits ?? 0);
        const requiredNonAcademicUnits = Number(
            student.requiredNonAcademicUnits ?? 0,
        );

        await db
            .collection("students")
            .updateOne(
                { _id: studentId },
                {
                    $set: {
                        earnedUnits,
                        earnedNonAcademicUnits,
                        remainingUnits: Math.max(
                            requiredUnits - earnedUnits,
                            0,
                        ),
                        remainingNonAcademicUnits: Math.max(
                            requiredNonAcademicUnits -
                                earnedNonAcademicUnits,
                            0,
                        ),
                        enrolledUnits,
                        enrolledNonAcademicUnits,
                        enlistedUnits: 0,
                        enlistedNonAcademicUnits: 0,
                        updatedAt: now,
                    },
                },
                { session },
            );
    }
}

async function createStudentGradeAnnouncements(
    db: Db,
    session: ClientSession,
    studentIds: ObjectId[],
    section: Document,
    academicTerm: Document,
    now: Date,
): Promise<void> {
    const course = await db
        .collection("courses")
        .findOne(
            {
                _id: section.courseId,
            },
            {
                session,
            },
        );

    if (
        !course ||
        studentIds.length === 0
    ) {
        return;
    }

    const uniqueStudentIds =
        Array.from(
            new Map(
                studentIds.map(
                    (studentId) => [
                        studentId.toHexString(),
                        studentId,
                    ],
                ),
            ).values(),
        );

    for (
        const studentId of
        uniqueStudentIds
    ) {
        const eventKey =
            `GRADE_SUBMITTED:${section._id.toString()}:${studentId.toHexString()}`;

        await db
            .collection("announcements")
            .updateOne(
                {
                    studentId,
                    eventKey,
                },
                {
                    $setOnInsert: {
                        audience:
                            "STUDENT",
                        studentId,
                        eventKey,
                        relatedSectionId:
                            section._id,
                        relatedCourseId:
                            course._id,
                        relatedAcademicTermId:
                            academicTerm._id,
                        title:
                            `Grade submitted for ${String(
                                course.courseCode ??
                                    "course",
                            )}`,
                        message:
                            `Your final grade for ${String(
                                course.courseName ??
                                    course.courseCode ??
                                    "the course",
                            )} is now available on the Grades page.`,
                        status:
                            "PUBLISHED",
                        publishedAt:
                            now,
                        createdAt:
                            now,
                        updatedAt:
                            now,
                    },
                },
                {
                    upsert: true,
                    session,
                },
            );
    }
}

async function createCurriculumUpdateAnnouncement(
    db: Db,
    session: ClientSession,
    studentId: ObjectId,
    section: Document,
    academicTerm: Document,
    now: Date,
): Promise<void> {
    const eventKey =
        `CURRICULUM_UPDATED:${section._id.toString()}:${studentId.toHexString()}`;

    await db
        .collection("announcements")
        .updateOne(
            {
                studentId,
                eventKey,
            },
            {
                $setOnInsert: {
                    audience:
                        "STUDENT",
                    studentId,
                    eventKey,
                    relatedSectionId:
                        section._id,
                    relatedAcademicTermId:
                        academicTerm._id,
                    title:
                        "Curriculum audit and grades updated",
                    message:
                        "Your curriculum audit, academic records, earned units, remaining units, enrolled units, and grades have been updated based on the submitted final grade.",
                    status:
                        "PUBLISHED",
                    publishedAt:
                        now,
                    createdAt:
                        now,
                    updatedAt:
                        now,
                },
            },
            {
                upsert: true,
                session,
            },
        );
}

export async function submitGrades(
    authenticatedUserId: string,
    sectionIdValue: string,
): Promise<SubmitGradesResult> {
    const db =
        getDatabase();

    const client =
        getMongoClient();

    const session =
        client.startSession();

    let realtimeStudentIds: string[] = [];
    let realtimeFacultyId = "";
    let realtimeSectionId = "";

    try {
        const result =
            await session.withTransaction(
                async (): Promise<SubmitGradesResult> => {
                    realtimeStudentIds = [];
                    realtimeFacultyId = "";
                    realtimeSectionId = "";

                    const {
                        faculty,
                        term,
                    } =
                        await getFacultyAndTerm(
                            db,
                            authenticatedUserId,
                            session,
                        );

                    const sectionId =
                        toObjectId(
                            sectionIdValue,
                            "Section ID",
                        );

                    const section =
                        await db
                            .collection(
                                "sections",
                            )
                            .findOne(
                                {
                                    _id:
                                        sectionId,
                                    facultyId:
                                        faculty._id,
                                    academicTermId:
                                        term._id,
                                },
                                {
                                    session,
                                },
                            );

                    if (!section) {
                        throw new FacultyGradeEntryError(
                            "SECTION_NOT_FOUND",
                            "The selected section could not be found.",
                            404,
                        );
                    }

                    const existingSubmission =
                        await db
                            .collection(
                                "gradeSubmissions",
                            )
                            .findOne(
                                {
                                    sectionId,
                                    academicTermId:
                                        term._id,
                                    facultyId:
                                        faculty._id,
                                    gradeType:
                                        "FINAL",
                                },
                                {
                                    session,
                                },
                            );

                    if (
                        existingSubmission?.status ===
                        "SUBMITTED"
                    ) {
                        throw new FacultyGradeEntryError(
                            "GRADES_ALREADY_SUBMITTED",
                            "These grades have already been submitted.",
                            409,
                        );
                    }

                    const submittedEnrollments =
                        await db
                            .collection(
                                "studentEnrollments",
                            )
                            .find(
                                {
                                    academicTermId:
                                        term._id,
                                    status:
                                        "SUBMITTED",
                                },
                                {
                                    session,
                                },
                            )
                            .toArray();

                    const enrollmentIds =
                        submittedEnrollments.map(
                            (enrollment) =>
                                enrollment._id,
                        );

                    const enrollmentItems =
                        enrollmentIds.length > 0
                            ? await db
                                .collection(
                                    "studentEnrollmentItems",
                                )
                                .find(
                                    {
                                        enrollmentId: {
                                            $in:
                                                enrollmentIds,
                                        },
                                        sectionId,
                                    },
                                    {
                                        session,
                                    },
                                )
                                .toArray()
                            : [];

                    const enrollmentMap =
                        new Map(
                            submittedEnrollments.map(
                                (enrollment) => [
                                    enrollment._id.toString(),
                                    enrollment,
                                ],
                            ),
                        );

                    const studentIds =
                        enrollmentItems.flatMap(
                            (item) => {
                                const enrollment =
                                    enrollmentMap.get(
                                        item.enrollmentId.toString(),
                                    );

                                return enrollment
                                    ? [
                                        enrollment.studentId,
                                    ]
                                    : [];
                            },
                        );

                    if (
                        studentIds.length ===
                        0
                    ) {
                        throw new FacultyGradeEntryError(
                            "NO_ENROLLED_STUDENTS",
                            "This section has no successfully enrolled students.",
                            409,
                        );
                    }

                    const grades =
                        await db
                            .collection(
                                "grades",
                            )
                            .find(
                                {
                                    sectionId,
                                    studentId: {
                                        $in:
                                            studentIds,
                                    },
                                    academicTermId:
                                        term._id,
                                    facultyId:
                                        faculty._id,
                                },
                                {
                                    session,
                                },
                            )
                            .toArray();

                    const completeGrades =
                        grades.filter(
                            (grade) =>
                                isComplete(
                                    normalizeComponents(
                                        grade,
                                    ),
                                ),
                        );

                    if (
                        completeGrades.length !==
                        studentIds.length
                    ) {
                        throw new FacultyGradeEntryError(
                            "INCOMPLETE_GRADES",
                            "Complete all five grade components for every student before submitting.",
                            409,
                        );
                    }

                    const now =
                        new Date();

                    for (const grade of completeGrades) {
                        const finalGradeValue =
                            typeof grade.finalGradeValue === "number"
                                ? grade.finalGradeValue
                                : 0;

                        await db
                            .collection("grades")
                            .updateOne(
                                { _id: grade._id },
                                {
                                    $set: {
                                        result:
                                            finalGradeValue >= 1.0
                                                ? "PASSED"
                                                : "FAILED",
                                    },
                                },
                                { session },
                            );
                    }

                    await db
                        .collection(
                            "grades",
                        )
                        .updateMany(
                            {
                                sectionId,
                                studentId: {
                                    $in:
                                        studentIds,
                                },
                                academicTermId:
                                    term._id,
                                facultyId:
                                    faculty._id,
                            },
                            {
                                $set: {
                                    status:
                                        "SUBMITTED",
                                    submittedAt:
                                        now,
                                    updatedAt:
                                        now,
                                },
                            },
                            {
                                session,
                            },
                        );

                    await db
                        .collection(
                            "gradeSubmissions",
                        )
                        .updateOne(
                            {
                                sectionId,
                                academicTermId:
                                    term._id,
                                facultyId:
                                    faculty._id,
                                gradeType:
                                    "FINAL",
                            },
                            {
                                $set: {
                                    status:
                                        "SUBMITTED",
                                    completedCount:
                                        studentIds.length,
                                    totalStudents:
                                        studentIds.length,
                                    submittedAt:
                                        now,
                                    updatedAt:
                                        now,
                                },
                                $setOnInsert: {
                                    createdAt:
                                        now,
                                },
                            },
                            {
                                upsert:
                                    true,
                                session,
                            },
                        );

                    await createStudentGradeAnnouncements(
                        db,
                        session,
                        studentIds,
                        section,
                        term,
                        now,
                    );

                    const uniqueStudentIds =
                        Array.from(
                            new Map(
                                studentIds.map(
                                    (studentId) => [
                                        studentId.toHexString(),
                                        studentId,
                                    ],
                                ),
                            ).values(),
                        );

                    for (
                        const studentId of
                        uniqueStudentIds
                    ) {
                        await synchronizeStudentAcademicState(
                            db,
                            session,
                            studentId,
                            term._id,
                            now,
                        );

                        await createCurriculumUpdateAnnouncement(
                            db,
                            session,
                            studentId,
                            section,
                            term,
                            now,
                        );
                    }

                    realtimeStudentIds =
                        uniqueStudentIds.map(
                            (studentId) =>
                                studentId.toHexString(),
                        );
                    realtimeFacultyId =
                        faculty._id.toHexString();
                    realtimeSectionId =
                        sectionId.toHexString();

                    return {
                        sectionId:
                            sectionId.toString(),
                        completedCount:
                            studentIds.length,
                        totalStudents:
                            studentIds.length,
                        status:
                            "SUBMITTED",
                        submittedAt:
                            now.toISOString(),
                    };
                },
            );

        if (!result) {
            throw new FacultyGradeEntryError(
                "GRADE_SUBMISSION_FAILED",
                "Grade submission did not return a result.",
                500,
            );
        }

        if (
            realtimeStudentIds.length > 0 &&
            realtimeFacultyId &&
            realtimeSectionId
        ) {
            await publishGradeUpdated({
                studentIds:
                    realtimeStudentIds,
                facultyId:
                    realtimeFacultyId,
                sectionId:
                    realtimeSectionId,
            });
        }

        return result;
    } finally {
        await session.endSession();
    }
}
