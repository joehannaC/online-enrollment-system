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

/*
 * Grade representation:
 * 90-100 = 4.0
 * 85-89.99 = 3.5
 * 80-84.99 = 3.0
 * 75-79.99 = 2.5
 * 70-74.99 = 2.0
 * 65-69.99 = 1.5
 * 60-64.99 = 1.0
 * below 60 = 0.0
 */
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

    try {
        const result =
            await session.withTransaction(
                async (): Promise<SubmitGradesResult> => {
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

        return result;
    } finally {
        await session.endSession();
    }
}
