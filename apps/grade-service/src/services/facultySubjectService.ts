import {
    ObjectId,
    type Document,
} from "mongodb";

import {
    getDatabase,
} from "../config/database.js";
import type {
    FacultySubjectGradeStatus,
    FacultySubjectItem,
    FacultySubjectSchedule,
    FacultySubjectsResponse,
} from "../types/facultySubject.types.js";

export class FacultySubjectError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name =
            "FacultySubjectError";
    }
}

function toObjectId(
    value: string,
    fieldName: string,
): ObjectId {
    if (!ObjectId.isValid(value)) {
        throw new FacultySubjectError(
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
        person.title,
        person.firstName,
        person.middleName,
        person.lastName,
    ]
        .filter(Boolean)
        .join(" ");
}

function normalizeSchedule(
    value: unknown,
): FacultySubjectSchedule[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((item) => ({
        days: Array.isArray(item.days)
            ? item.days.map(String)
            : [],
        startTime:
            String(item.startTime ?? ""),
        endTime:
            String(item.endTime ?? ""),
        room:
            String(item.room ?? "TBA"),
    }));
}

function normalizeGradeStatus(
    grade: Document | undefined,
): FacultySubjectGradeStatus {
    if (!grade) {
        return "PENDING";
    }

    switch (grade.status) {
        case "DRAFT":
        case "SUBMITTED":
        case "VERIFIED":
        case "RETURNED":
            return grade.status;

        default:
            return "PENDING";
    }
}

function getFinalGradeValue(
    grade: Document | undefined,
): number | null {
    return typeof grade?.finalGradeValue ===
        "number" &&
        Number.isFinite(
            grade.finalGradeValue,
        )
        ? grade.finalGradeValue
        : null;
}

function hasCompletedGrade(
    grade: Document | undefined,
): boolean {
    return (
        getFinalGradeValue(grade) !==
            null &&
        grade?.status !== "DRAFT" &&
        grade?.status !== "RETURNED"
    );
}

async function getDashboardTerm(
    database: ReturnType<
        typeof getDatabase
    >,
): Promise<Document> {
    const enrollmentTerm =
        await database
            .collection(
                "academicTerms",
            )
            .findOne({
                isEnrollmentTerm: true,
                status: {
                    $in: [
                        "UPCOMING",
                        "ACTIVE",
                    ],
                },
            });

    if (enrollmentTerm) {
        return enrollmentTerm;
    }

    const currentTerm =
        await database
            .collection(
                "academicTerms",
            )
            .findOne({
                isCurrent: true,
                status: "ACTIVE",
            });

    if (!currentTerm) {
        throw new FacultySubjectError(
            "FACULTY_TERM_NOT_FOUND",
            "No faculty subject term is currently configured.",
            503,
        );
    }

    return currentTerm;
}

export async function getFacultySubjects(
    authenticatedUserId: string,
): Promise<FacultySubjectsResponse> {
    const database =
        getDatabase();

    const userId =
        toObjectId(
            authenticatedUserId,
            "Authenticated user ID",
        );

    const faculty =
        await database
            .collection("faculty")
            .findOne({
                userId,
                status: "ACTIVE",
            });

    if (!faculty) {
        throw new FacultySubjectError(
            "FACULTY_NOT_FOUND",
            "No active faculty profile was found for the authenticated account.",
            404,
        );
    }

    const term =
        await getDashboardTerm(
            database,
        );

    const sections =
        await database
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

    if (sections.length === 0) {
        return {
            faculty: {
                id:
                    faculty._id.toString(),
                employeeNumber:
                    String(
                        faculty.employeeNumber ??
                            "",
                    ),
                fullName:
                    buildFullName(
                        faculty,
                    ),
                department:
                    String(
                        faculty.department ??
                            "",
                    ),
                college:
                    String(
                        faculty.college ??
                            "",
                    ),
            },

            term: {
                id:
                    term._id.toString(),
                code:
                    String(
                        term.code ?? "",
                    ),
                name:
                    String(
                        term.name ?? "",
                    ),
                academicYear:
                    String(
                        term.academicYear ??
                            "",
                    ),
                termNumber:
                    Number(
                        term.termNumber ??
                            0,
                    ),
                status:
                    String(
                        term.status ?? "",
                    ),
                isCurrent:
                    Boolean(
                        term.isCurrent,
                    ),
            },

            summary: {
                handledSubjectCount:
                    0,
                enrolledStudentCount:
                    0,
            },

            subjects: [],
        };
    }

    const sectionIds =
        sections.map(
            (section) =>
                section._id,
        );

    const courseIds =
        Array.from(
            new Map(
                sections.map(
                    (section) => [
                        section.courseId.toString(),
                        section.courseId,
                    ],
                ),
            ).values(),
        );

    /*
     * Only submitted enrollment headers represent successful
     * enrollment. Draft selections must not appear in class lists.
     */
    const submittedEnrollments =
        await database
            .collection(
                "studentEnrollments",
            )
            .find({
                academicTermId:
                    term._id,
                status:
                    "SUBMITTED",
            })
            .toArray();

    const submittedEnrollmentIds =
        submittedEnrollments.map(
            (enrollment) =>
                enrollment._id,
        );

    const [
        courses,
        enrollmentItems,
        grades,
    ] =
        await Promise.all([
            database
                .collection(
                    "courses",
                )
                .find({
                    _id: {
                        $in:
                            courseIds,
                    },
                    status:
                        "ACTIVE",
                })
                .toArray(),

            submittedEnrollmentIds.length >
            0
                ? database
                      .collection(
                          "studentEnrollmentItems",
                      )
                      .find({
                          enrollmentId: {
                              $in:
                                  submittedEnrollmentIds,
                          },
                          sectionId: {
                              $in:
                                  sectionIds,
                          },
                      })
                      .toArray()
                : [],

            database
                .collection(
                    "grades",
                )
                .find({
                    sectionId: {
                        $in:
                            sectionIds,
                    },
                    academicTermId:
                        term._id,
                    facultyId:
                        faculty._id,
                })
                .toArray(),
        ]);

    const enrollmentById =
        new Map(
            submittedEnrollments.map(
                (enrollment) => [
                    enrollment._id.toString(),
                    enrollment,
                ],
            ),
        );

    const studentIds =
        Array.from(
            new Map(
                enrollmentItems.flatMap(
                    (item) => {
                        const enrollment =
                            enrollmentById.get(
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

    const students =
        studentIds.length > 0
            ? await database
                  .collection(
                      "students",
                  )
                  .find({
                      _id: {
                          $in:
                              studentIds,
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

    const studentMap =
        new Map(
            students.map(
                (student) => [
                    student._id.toString(),
                    student,
                ],
            ),
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

    const gradeMap =
        new Map(
            grades.map(
                (grade) => [
                    `${grade.sectionId.toString()}:${grade.studentId.toString()}`,
                    grade,
                ],
            ),
        );

    const subjects:
        FacultySubjectItem[] =
        sections.flatMap(
            (section) => {
                const course =
                    courseMap.get(
                        section.courseId.toString(),
                    );

                const sectionItems =
                    itemsBySection.get(
                        section._id.toString(),
                    ) ?? [];

                /*
                 * Hide offered sections that have no successfully
                 * enrolled students.
                 */
                if (
                    !course ||
                    sectionItems.length ===
                        0
                ) {
                    return [];
                }

                const roster =
                    sectionItems.flatMap(
                        (item) => {
                            const enrollment =
                                enrollmentById.get(
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

                            const grade =
                                gradeMap.get(
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
                                    finalGradeValue:
                                        getFinalGradeValue(
                                            grade,
                                        ),
                                    gradeStatus:
                                        normalizeGradeStatus(
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

                const gradedStudents =
                    roster.filter(
                        (student) => {
                            const grade =
                                gradeMap.get(
                                    `${section._id.toString()}:${student.studentId}`,
                                );

                            return hasCompletedGrade(
                                grade,
                            );
                        },
                    ).length;

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

                        schedule:
                            normalizeSchedule(
                                section.schedule,
                            ),

                        enrolledStudents:
                            roster.length,
                        gradedStudents,
                        pendingGrades:
                            Math.max(
                                roster.length -
                                    gradedStudents,
                                0,
                            ),

                        students:
                            roster,
                    },
                ];
            },
        );

    return {
        faculty: {
            id:
                faculty._id.toString(),
            employeeNumber:
                String(
                    faculty.employeeNumber ??
                        "",
                ),
            fullName:
                buildFullName(
                    faculty,
                ),
            department:
                String(
                    faculty.department ??
                        "",
                ),
            college:
                String(
                    faculty.college ??
                        "",
                ),
        },

        term: {
            id:
                term._id.toString(),
            code:
                String(
                    term.code ?? "",
                ),
            name:
                String(
                    term.name ?? "",
                ),
            academicYear:
                String(
                    term.academicYear ??
                        "",
                ),
            termNumber:
                Number(
                    term.termNumber ??
                        0,
                ),
            status:
                String(
                    term.status ?? "",
                ),
            isCurrent:
                Boolean(
                    term.isCurrent,
                ),
        },

        summary: {
            handledSubjectCount:
                subjects.length,
            enrolledStudentCount:
                subjects.reduce(
                    (
                        total,
                        subject,
                    ) =>
                        total +
                        subject.enrolledStudents,
                    0,
                ),
        },

        subjects,
    };
}
