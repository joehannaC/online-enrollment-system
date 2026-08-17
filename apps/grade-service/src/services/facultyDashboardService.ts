import {
    ObjectId,
    type Document,
} from "mongodb";

import {
    getDatabase,
} from "../config/database.js";
import type {
    AcademicTermSummary,
    FacultyDashboardResponse,
    FacultyProfileSummary,
    FacultySubject,
    FacultySubjectStudent,
    GradeStatus,
    ScheduleItem,
} from "../types/facultyDashboard.types.js";

export class FacultyDashboardError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name =
            "FacultyDashboardError";
    }
}

function getNumberOrNull(
    value: unknown,
): number | null {
    return typeof value === "number" &&
        Number.isFinite(value)
        ? value
        : null;
}

function toObjectId(
    value: string,
    fieldName: string,
): ObjectId {
    if (!ObjectId.isValid(value)) {
        throw new FacultyDashboardError(
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

function mapFaculty(
    faculty: Document,
): FacultyProfileSummary {
    return {
        id:
            faculty._id.toString(),
        employeeNumber:
            String(
                faculty.employeeNumber ??
                    "",
            ),
        title:
            faculty.title
                ? String(
                    faculty.title,
                )
                : undefined,

        firstName:
            String(
                faculty.firstName ??
                    "",
            ),
        middleName:
            faculty.middleName
                ? String(
                    faculty.middleName,
                )
                : undefined,
        lastName:
            String(
                faculty.lastName ??
                    "",
            ),

        fullName:
            faculty.fullName
                ? String(
                    faculty.fullName,
                )
                : buildFullName(
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
    };
}

function mapAcademicTerm(
    term: Document,
): AcademicTermSummary {
    return {
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
                term.status ??
                    "ACTIVE",
            ) as AcademicTermSummary["status"],
        isCurrent:
            Boolean(
                term.isCurrent,
            ),
    };
}

function normalizeSchedule(
    value: unknown,
): ScheduleItem[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map(
        (item) => ({
            days:
                Array.isArray(
                    item.days,
                )
                    ? item.days.map(
                        String,
                    )
                    : [],
            startTime:
                String(
                    item.startTime ??
                        "",
                ),
            endTime:
                String(
                    item.endTime ??
                        "",
                ),
            room:
                String(
                    item.room ??
                        "TBA",
                ),
        }),
    );
}

function normalizeSubmissionStatus(
    value: unknown,
): GradeStatus {
    switch (value) {
        case "SUBMITTED":
        case "VERIFIED":
        case "RETURNED":
        case "DRAFT":
            return value;

        default:
            return "DRAFT";
    }
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
            typeof value ===
                "number" &&
            Number.isFinite(
                value,
            ),
    );
}

function isSubmittedGrade(
    grade: Document | undefined,
): boolean {
    return (
        grade?.status ===
            "SUBMITTED" ||
        grade?.status ===
            "VERIFIED"
    );
}

function getStudentGradeStatus(
    grade: Document | undefined,
): FacultySubjectStudent["gradeStatus"] {
    if (
        isSubmittedGrade(
            grade,
        )
    ) {
        return "SUBMITTED";
    }

    return hasAnyGradeInput(
        grade,
    )
        ? "DRAFT"
        : "INCOMPLETE";
}

function getFinalGradeValue(
    grade: Document | undefined,
): number | null {
    return typeof grade
        ?.finalGradeValue ===
        "number" &&
        Number.isFinite(
            grade.finalGradeValue,
        )
        ? grade.finalGradeValue
        : null;
}

function getDaysRemaining(
    deadline: Date,
): number {
    const today =
        new Date();

    const startOfToday =
        Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
        );

    const startOfDeadline =
        Date.UTC(
            deadline.getFullYear(),
            deadline.getMonth(),
            deadline.getDate(),
        );

    return Math.ceil(
        (
            startOfDeadline -
            startOfToday
        ) /
            86_400_000,
    );
}

function getDeadlineStatus(
    daysRemaining: number,
):
    | "UPCOMING"
    | "DUE_SOON"
    | "OVERDUE" {
    if (daysRemaining < 0) {
        return "OVERDUE";
    }

    if (daysRemaining <= 7) {
        return "DUE_SOON";
    }

    return "UPCOMING";
}

export async function getFacultyDashboard(
    authenticatedUserId: string,
): Promise<FacultyDashboardResponse> {
    const database =
        getDatabase();

    const userId =
        toObjectId(
            authenticatedUserId,
            "Authenticated user ID",
        );

    const faculty =
        await database
            .collection(
                "faculty",
            )
            .findOne({
                userId,
                status:
                    "ACTIVE",
            });

    if (!faculty) {
        throw new FacultyDashboardError(
            "FACULTY_NOT_FOUND",
            "No active faculty profile was found for the authenticated account.",
            404,
        );
    }

    const currentTerm =
        (await database
            .collection(
                "academicTerms",
            )
            .findOne({
                isEnrollmentTerm:
                    true,
                status: {
                    $in: [
                        "UPCOMING",
                        "ACTIVE",
                    ],
                },
            })) ??
        (await database
            .collection(
                "academicTerms",
            )
            .findOne({
                isCurrent:
                    true,
                status:
                    "ACTIVE",
            }));

    if (!currentTerm) {
        throw new FacultyDashboardError(
            "CURRENT_TERM_NOT_FOUND",
            "No active academic term is currently configured.",
            503,
        );
    }

    const sections =
        await database
            .collection(
                "sections",
            )
            .find({
                facultyId:
                    faculty._id,
                academicTermId:
                    currentTerm._id,
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

    const submittedEnrollments =
        await database
            .collection(
                "studentEnrollments",
            )
            .find({
                academicTermId:
                    currentTerm._id,
                status:
                    "SUBMITTED",
            })
            .toArray();

    const enrollmentIds =
        submittedEnrollments.map(
            (enrollment) =>
                enrollment._id,
        );

    const [
        courses,
        enrollmentItems,
        grades,
        submissions,
    ] =
        await Promise.all([
            courseIds.length > 0
                ? database
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
                : [],

            sectionIds.length >
                    0 &&
            enrollmentIds.length >
                    0
                ? database
                    .collection(
                        "studentEnrollmentItems",
                    )
                    .find({
                        enrollmentId: {
                            $in:
                                enrollmentIds,
                        },
                        sectionId: {
                            $in:
                                sectionIds,
                        },
                    })
                    .toArray()
                : [],

            sectionIds.length > 0
                ? database
                    .collection(
                        "grades",
                    )
                    .find({
                        sectionId: {
                            $in:
                                sectionIds,
                        },
                        academicTermId:
                            currentTerm._id,
                        facultyId:
                            faculty._id,
                    })
                    .toArray()
                : [],

            sectionIds.length > 0
                ? database
                    .collection(
                        "gradeSubmissions",
                    )
                    .find({
                        sectionId: {
                            $in:
                                sectionIds,
                        },
                        academicTermId:
                            currentTerm._id,
                        facultyId:
                            faculty._id,
                        gradeType:
                            "FINAL",
                    })
                    .toArray()
                : [],
        ]);

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
        Array.from(
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

        items.push(
            item,
        );

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

    const submissionMap =
        new Map(
            submissions.map(
                (submission) => [
                    submission.sectionId.toString(),
                    submission,
                ],
            ),
        );

    const handledSubjects:
        FacultySubject[] =
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

                if (
                    !course ||
                    sectionItems.length ===
                        0
                ) {
                    return [];
                }

                const roster:
                    FacultySubjectStudent[] =
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

                                    rawFinalGrade:
                                        getNumberOrNull(
                                            grade?.rawFinalGrade,
                                        ),

                                    finalGradeValue:
                                        getNumberOrNull(
                                            grade?.finalGradeValue,
                                        ),

                                    gradeStatus:
                                        getStudentGradeStatus(
                                            grade,
                                        ),
                                },
                            ];
                        },
                    )
                    .sort(
                        (
                            first,
                            second,
                        ) =>
                            first.fullName.localeCompare(
                                second.fullName,
                            ),
                    );

                const submittedGrades =
                    roster.filter(
                        (student) =>
                            student.gradeStatus ===
                            "SUBMITTED",
                    ).length;

                const pendingGrades =
                    Math.max(
                        roster.length -
                            submittedGrades,
                        0,
                    );

                const submissionPercentage =
                    roster.length ===
                    0
                        ? 0
                        : Math.round(
                            (
                                submittedGrades /
                                roster.length
                              ) *
                                100,
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

                        schedule:
                            normalizeSchedule(
                                section.schedule,
                            ),

                        enrolledStudents:
                            roster.length,
                        submittedGrades,
                        gradedStudents:
                            submittedGrades,
                        pendingGrades,
                        submissionPercentage,

                        submissionStatus:
                            normalizeSubmissionStatus(
                                submissionMap.get(
                                    section._id.toString(),
                                )?.status,
                            ),

                        students:
                            roster,
                    },
                ];
            },
        );

    const handledSubjectCount =
        handledSubjects.length;

    const enrolledStudentCount =
        handledSubjects.reduce(
            (
                total,
                subject,
            ) =>
                total +
                subject.enrolledStudents,
            0,
        );

    const pendingGradeCount =
        handledSubjects.reduce(
            (
                total,
                subject,
            ) =>
                total +
                subject.pendingGrades,
            0,
        );

    const submittedGradeCount =
        handledSubjects.reduce(
            (
                total,
                subject,
            ) =>
                total +
                subject.submittedGrades,
            0,
        );

    const submissionPercentage =
        enrolledStudentCount ===
        0
            ? 0
            : Math.round(
                (
                    submittedGradeCount /
                    enrolledStudentCount
                  ) *
                    100,
            );

    const deadline =
        new Date(
            "2026-12-20T23:59:59+08:00",
        );

    const daysRemaining =
        getDaysRemaining(
            deadline,
        );

    return {
        faculty:
            mapFaculty(
                faculty,
            ),
        currentTerm:
            mapAcademicTerm(
                currentTerm,
            ),

        summary: {
            handledSubjectCount,
            enrolledStudentCount,
            pendingGradeCount,
            submissionPercentage,
        },

        handledSubjects,

        upcomingDeadlines: [
            {
                id:
                    `${currentTerm._id.toString()}-midterm-grades`,
                title:
                    "Midterm grades",
                deadline:
                    deadline.toISOString(),
                daysRemaining,
                status:
                    getDeadlineStatus(
                        daysRemaining,
                    ),
            },
            {
                id:
                    `${currentTerm._id.toString()}-final-grade-encoding`,
                title:
                    "Final grade encoding",
                deadline:
                    deadline.toISOString(),
                daysRemaining,
                status:
                    getDeadlineStatus(
                        daysRemaining,
                    ),
            },
            {
                id:
                    `${currentTerm._id.toString()}-record-verification`,
                title:
                    "Record verification",
                deadline:
                    deadline.toISOString(),
                daysRemaining,
                status:
                    getDeadlineStatus(
                        daysRemaining,
                    ),
            },
        ],
    };
}

