import {
    ObjectId,
    type Document,
} from "mongodb";

import {
    getDatabase,
} from "../config/database.js";
import type {
    FacultyRecordItem,
    FacultyRecordStatus,
    FacultyRecordStudent,
    FacultyRecordsResponse,
} from "../types/facultyRecord.types.js";

export class FacultyRecordError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "FacultyRecordError";
    }
}

function toObjectId(
    value: string,
    fieldName: string,
): ObjectId {
    if (!ObjectId.isValid(value)) {
        throw new FacultyRecordError(
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

function getNumberOrNull(
    value: unknown,
): number | null {
    return typeof value === "number" &&
        Number.isFinite(value)
        ? value
        : null;
}

function hasAnyGradeInput(
    grade: Document | undefined,
): boolean {
    if (!grade) {
        return false;
    }

    return [
        grade.activitiesScore,
        grade.majorOutput1Score,
        grade.majorOutput2Score,
        grade.midtermExamScore,
        grade.finalExamScore,
    ].some(
        (value) =>
            typeof value === "number" &&
            Number.isFinite(value),
    );
}

function isSubmittedGrade(
    grade: Document | undefined,
): boolean {
    return (
        grade?.status === "SUBMITTED" ||
        grade?.status === "VERIFIED"
    );
}

function getStudentStatus(
    grade: Document | undefined,
): FacultyRecordStatus {
    if (isSubmittedGrade(grade)) {
        return "SUBMITTED";
    }

    return hasAnyGradeInput(grade)
        ? "DRAFT"
        : "INCOMPLETE";
}

function getRecordStatus(
    submission: Document | undefined,
    students: FacultyRecordStudent[],
): FacultyRecordStatus {
    if (
        submission?.status === "SUBMITTED" ||
        submission?.status === "VERIFIED"
    ) {
        return "SUBMITTED";
    }

    if (
        submission?.status === "DRAFT" ||
        students.some(
            (student) =>
                student.gradeStatus === "DRAFT" ||
                student.gradeStatus === "SUBMITTED",
        )
    ) {
        return "DRAFT";
    }

    return "INCOMPLETE";
}

async function getActiveFacultyTerm(
    database: ReturnType<typeof getDatabase>,
): Promise<Document> {
    const term =
        (await database
            .collection("academicTerms")
            .findOne({
                isEnrollmentTerm: true,
                status: {
                    $in: [
                        "UPCOMING",
                        "ACTIVE",
                    ],
                },
            })) ??
        (await database
            .collection("academicTerms")
            .findOne({
                isCurrent: true,
                status: "ACTIVE",
            }));

    if (!term) {
        throw new FacultyRecordError(
            "FACULTY_TERM_NOT_FOUND",
            "No active faculty grading term was found.",
            503,
        );
    }

    return term;
}

export async function getFacultyRecords(
    authenticatedUserId: string,
): Promise<FacultyRecordsResponse> {
    const database = getDatabase();

    const userId = toObjectId(
        authenticatedUserId,
        "Authenticated user ID",
    );

    const faculty = await database
        .collection("faculty")
        .findOne({
            userId,
            status: "ACTIVE",
        });

    if (!faculty) {
        throw new FacultyRecordError(
            "FACULTY_NOT_FOUND",
            "No active faculty profile was found.",
            404,
        );
    }

    const term =
        await getActiveFacultyTerm(
            database,
        );

    const sections = await database
        .collection("sections")
        .find({
            facultyId: faculty._id,
            academicTermId: term._id,
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

    const sectionIds = sections.map(
        (section) => section._id,
    );

    const submittedEnrollments =
        await database
            .collection(
                "studentEnrollments",
            )
            .find({
                academicTermId: term._id,
                status: "SUBMITTED",
            })
            .toArray();

    const enrollmentIds =
        submittedEnrollments.map(
            (enrollment) =>
                enrollment._id,
        );

    const enrollmentItems =
        sectionIds.length > 0 &&
        enrollmentIds.length > 0
            ? await database
                  .collection(
                      "studentEnrollmentItems",
                  )
                  .find({
                      enrollmentId: {
                          $in: enrollmentIds,
                      },
                      sectionId: {
                          $in: sectionIds,
                      },
                  })
                  .toArray()
            : [];

    const enrollmentMap = new Map(
        submittedEnrollments.map(
            (enrollment) => [
                enrollment._id.toString(),
                enrollment,
            ],
        ),
    );

    const itemsBySection = new Map<
        string,
        Document[]
    >();

    for (const item of enrollmentItems) {
        const sectionId =
            item.sectionId.toString();

        const items =
            itemsBySection.get(sectionId) ??
            [];

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

    const courseIds = Array.from(
        new Map(
            visibleSections.map(
                (section) => [
                    section.courseId.toString(),
                    section.courseId,
                ],
            ),
        ).values(),
    );

    const studentIds = Array.from(
        new Map(
            enrollmentItems.flatMap(
                (item) => {
                    const enrollment =
                        enrollmentMap.get(
                            item.enrollmentId.toString(),
                        );

                    return enrollment
                        ? [
                              [
                                  enrollment.studentId.toString(),
                                  enrollment.studentId,
                              ] as const,
                          ]
                        : [];
                },
            ),
        ).values(),
    );

    const [
        courses,
        students,
        grades,
        submissions,
    ] = await Promise.all([
        courseIds.length > 0
            ? database
                  .collection("courses")
                  .find({
                      _id: {
                          $in: courseIds,
                      },
                  })
                  .toArray()
            : [],

        studentIds.length > 0
            ? database
                  .collection("students")
                  .find({
                      _id: {
                          $in: studentIds,
                      },
                  })
                  .toArray()
            : [],

        visibleSections.length > 0
            ? database
                  .collection("grades")
                  .find({
                      sectionId: {
                          $in: visibleSections.map(
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
            : [],

        visibleSections.length > 0
            ? database
                  .collection(
                      "gradeSubmissions",
                  )
                  .find({
                      sectionId: {
                          $in: visibleSections.map(
                              (section) =>
                                  section._id,
                          ),
                      },
                      academicTermId:
                          term._id,
                      facultyId:
                          faculty._id,
                      gradeType: "FINAL",
                  })
                  .toArray()
            : [],
    ]);

    const courseMap = new Map(
        courses.map((course) => [
            course._id.toString(),
            course,
        ]),
    );

    const studentMap = new Map(
        students.map((student) => [
            student._id.toString(),
            student,
        ]),
    );

    const gradeMap = new Map(
        grades.map((grade) => [
            `${grade.sectionId.toString()}:${grade.studentId.toString()}`,
            grade,
        ]),
    );

    const submissionMap = new Map(
        submissions.map(
            (submission) => [
                submission.sectionId.toString(),
                submission,
            ],
        ),
    );

    const records: FacultyRecordItem[] =
        visibleSections.flatMap(
            (section) => {
                const course = courseMap.get(
                    section.courseId.toString(),
                );

                if (!course) {
                    return [];
                }

                const sectionItems =
                    itemsBySection.get(
                        section._id.toString(),
                    ) ?? [];

                const roster: FacultyRecordStudent[] =
                    sectionItems.flatMap(
                        (item) => {
                            const enrollment =
                                enrollmentMap.get(
                                    item.enrollmentId.toString(),
                                );

                            if (!enrollment) {
                                return [];
                            }

                            const student =
                                studentMap.get(
                                    enrollment.studentId.toString(),
                                );

                            if (!student) {
                                return [];
                            }

                            const grade = gradeMap.get(
                                `${section._id.toString()}:${student._id.toString()}`,
                            );

                            return [
                                {
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

                                    activity:
                                        getNumberOrNull(
                                            grade?.activitiesScore,
                                        ),
                                    majorOutput1:
                                        getNumberOrNull(
                                            grade?.majorOutput1Score,
                                        ),
                                    majorOutput2:
                                        getNumberOrNull(
                                            grade?.majorOutput2Score,
                                        ),
                                    midtermExam:
                                        getNumberOrNull(
                                            grade?.midtermExamScore,
                                        ),
                                    finalExam:
                                        getNumberOrNull(
                                            grade?.finalExamScore,
                                        ),
                                    finalGradeValue:
                                        getNumberOrNull(
                                            grade?.finalGradeValue,
                                        ),
                                    gradeStatus:
                                        getStudentStatus(
                                            grade,
                                        ),
                                },
                            ];
                        },
                    )
                    .sort(
                        (first, second) =>
                            first.fullName.localeCompare(
                                second.fullName,
                            ),
                    );

                const submission =
                    submissionMap.get(
                        section._id.toString(),
                    );

                const status =
                    getRecordStatus(
                        submission,
                        roster,
                    );

                const submittedStudents =
                    roster.filter(
                        (student) =>
                            student.gradeStatus ===
                            "SUBMITTED",
                    ).length;

                const gradeDates = grades
                    .filter(
                        (grade) =>
                            grade.sectionId.toString() ===
                            section._id.toString(),
                    )
                    .map(
                        (grade) =>
                            grade.updatedAt,
                    )
                    .filter(Boolean)
                    .sort(
                        (first, second) =>
                            new Date(
                                second,
                            ).getTime() -
                            new Date(
                                first,
                            ).getTime(),
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

                        enrolledStudents:
                            roster.length,
                        submittedStudents,
                        status,
                        submittedAt:
                            submission?.submittedAt
                                ? new Date(
                                      submission.submittedAt,
                                  ).toISOString()
                                : undefined,
                        lastSavedAt:
                            gradeDates[0]
                                ? new Date(
                                      gradeDates[0],
                                  ).toISOString()
                                : undefined,
                        students: roster,
                    },
                ];
            },
        );

    return {
        term: {
            id: term._id.toString(),
            code: String(
                term.code ?? "",
            ),
            name: String(
                term.name ?? "",
            ),
            academicYear: String(
                term.academicYear ?? "",
            ),
            termNumber: Number(
                term.termNumber ?? 0,
            ),
        },

        summary: {
            submittedClasses:
                records.filter(
                    (record) =>
                        record.status ===
                        "SUBMITTED",
                ).length,
            studentRecords:
                records.reduce(
                    (total, record) =>
                        total +
                        record.enrolledStudents,
                    0,
                ),
            drafts:
                records.filter(
                    (record) =>
                        record.status ===
                        "DRAFT",
                ).length,
            incomplete:
                records.filter(
                    (record) =>
                        record.status ===
                        "INCOMPLETE",
                ).length,
        },

        records,
    };
}
