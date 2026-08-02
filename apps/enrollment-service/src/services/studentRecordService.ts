import {
    ObjectId,
    type Db,
} from "mongodb";

import type {
    AcademicPeriodOption,
    CourseEligibilityCode,
    StudentRecordItem,
    StudentRecordResponse,
    StudentRecordStatus,
} from "../types/studentRecord.types.js";
import type {
    StudentRecordQuery,
} from "../validators/studentRecordQuerySchema.js";

interface StudentDocument {
    _id: ObjectId;
    userId: ObjectId;

    curriculumCode: string;

    requiredUnits?: number;
    requiredNonAcademicUnits?: number;
    earnedUnits?: number;
    earnedNonAcademicUnits?: number;
    remainingUnits?: number;
    remainingNonAcademicUnits?: number;
    enrolledUnits?: number;
    enrolledNonAcademicUnits?: number;
    enlistedUnits?: number;
    enlistedNonAcademicUnits?: number;

    status: string;
}

interface CourseDocument {
    _id: ObjectId;

    courseCode: string;
    courseName: string;

    units?: number;
    academicUnits?: number;
    nonAcademicUnits?: number;

    curriculumCode: string;
    recommendedTrimester: number;

    prerequisiteCodes?: string[];

    status: string;
}

interface AcademicTermDocument {
    _id: ObjectId;

    code: string;
    name: string;

    academicYear: string;
    termNumber: number;

    curriculumTrimester?: number;

    startDate: Date;
    endDate: Date;

    enrollmentStart?: Date;
    enrollmentEnd?: Date;

    status:
        | "ACTIVE"
        | "UPCOMING"
        | "COMPLETED";

    isCurrent: boolean;
}

interface SectionDocument {
    _id: ObjectId;

    courseId: ObjectId;
    academicTermId: ObjectId;

    sectionCode: string;

    status:
        | "OPEN"
        | "CLOSED"
        | "CANCELLED";
}

interface EnrollmentDocument {
    _id: ObjectId;

    studentId: ObjectId;
    sectionId: ObjectId;
    academicTermId: ObjectId;

    status:
        | "ENROLLED"
        | "REGISTERED"
        | "COMPLETED"
        | "DROPPED"
        | "CANCELLED";

    enrolledAt?: Date;
    registeredAt?: Date;
    completedAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}


interface StudentEnrollmentHeaderDocument {
    _id: ObjectId;
    studentId: ObjectId;
    academicTermId: ObjectId;
    status:
        | "DRAFT"
        | "SUBMITTED"
        | "CANCELLED";
    totalAcademicUnits: number;
    totalNonAcademicUnits: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface StudentEnrollmentItemDocument {
    _id: ObjectId;
    enrollmentId: ObjectId;
    studentId: ObjectId;
    academicTermId: ObjectId;
    sectionId: ObjectId;
    courseId: ObjectId;
    academicUnits: number;
    nonAcademicUnits: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface GradeDocument {
    _id: ObjectId;

    studentId: ObjectId;
    sectionId: ObjectId;
    academicTermId: ObjectId;

    computedScore?: number;
    finalGradeValue?: number;

    result:
        | "PASSED"
        | "FAILED"
        | "CREDITED";

    status:
        | "DRAFT"
        | "SUBMITTED"
        | "VERIFIED";

    submittedAt?: Date;
    verifiedAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}

interface EnrollmentContext {
    enrollment: EnrollmentDocument;
    section: SectionDocument;
    academicTerm: AcademicTermDocument;
}

interface GradeContext {
    grade: GradeDocument;
    section: SectionDocument;
    academicTerm: AcademicTermDocument;
}

export class StudentRecordServiceError
    extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
    ) {
        super(message);

        this.name =
            "StudentRecordServiceError";
    }
}

function normalizeSearchValue(
    value: string,
): string {
    return value
        .trim()
        .toLowerCase();
}

function getCourseUnits(
    course: CourseDocument,
): number {
    return (
        course.academicUnits ??
        course.units ??
        0
    );
}

function getCourseNonAcademicUnits(
    course: CourseDocument,
): number {
    return course.nonAcademicUnits ?? 0;
}

function formatGrade(
    grade?: GradeDocument,
): string | undefined {
    const finalGradeValue =
        grade?.finalGradeValue;

    if (
        typeof finalGradeValue !==
            "number" ||
        !Number.isFinite(
            finalGradeValue,
        )
    ) {
        return undefined;
    }

    return finalGradeValue.toFixed(
        1,
    );
}

function getEnrollmentPriority(
    status: EnrollmentDocument["status"],
): number {
    const priorities: Record<
        EnrollmentDocument["status"],
        number
    > = {
        ENROLLED: 5,
        REGISTERED: 4,
        COMPLETED: 3,
        DROPPED: 2,
        CANCELLED: 1,
    };

    return priorities[status];
}

function getLatestDate(
    document: {
        updatedAt?: Date;
        createdAt?: Date;
    },
): number {
    return (
        document.updatedAt?.getTime() ??
        document.createdAt?.getTime() ??
        0
    );
}

function getBestEnrollment(
    enrollmentContexts: EnrollmentContext[],
): EnrollmentContext | undefined {
    return [...enrollmentContexts].sort(
        (first, second) => {
            const priorityDifference =
                getEnrollmentPriority(
                    second.enrollment.status,
                ) -
                getEnrollmentPriority(
                    first.enrollment.status,
                );

            if (
                priorityDifference !== 0
            ) {
                return priorityDifference;
            }

            return (
                getLatestDate(
                    second.enrollment,
                ) -
                getLatestDate(
                    first.enrollment,
                )
            );
        },
    )[0];
}

function getBestGrade(
    gradeContexts: GradeContext[],
): GradeContext | undefined {
    const statusPriority: Record<
        GradeDocument["status"],
        number
    > = {
        VERIFIED: 3,
        SUBMITTED: 2,
        DRAFT: 1,
    };

    return [...gradeContexts].sort(
        (first, second) => {
            const priorityDifference =
                statusPriority[
                    second.grade.status
                ] -
                statusPriority[
                    first.grade.status
                ];

            if (
                priorityDifference !== 0
            ) {
                return priorityDifference;
            }

            return (
                getLatestDate(
                    second.grade,
                ) -
                getLatestDate(
                    first.grade,
                )
            );
        },
    )[0];
}

interface RecordEligibility {
    code: CourseEligibilityCode;
    title: string;
    message: string;
    missingPrerequisiteCodes: string[];
}

function getRecordEligibility({
    status,
    courseCode,
    missingPrerequisiteCodes,
}: {
    status: StudentRecordStatus;
    courseCode: string;
    missingPrerequisiteCodes: string[];
}): RecordEligibility {
    switch (status) {
        case "COMPLETED":
            return {
                code: "ALREADY_COMPLETED",
                title: "Completed",
                message:
                    `${courseCode} has already been completed.`,
                missingPrerequisiteCodes: [],
            };

        case "CREDITED":
            return {
                code: "ALREADY_COMPLETED",
                title: "Credited",
                message:
                    `${courseCode} was credited and counts toward earned units.`,
                missingPrerequisiteCodes: [],
            };

        case "CAN_BE_ENLISTED":
            return {
                code: "ELIGIBLE",
                title: "Eligible",
                message:
                    `${courseCode} can be enlisted because its prerequisites and curriculum requirements have been completed.`,
                missingPrerequisiteCodes: [],
            };

        case "CANNOT_YET_BE_ENLISTED":
            return {
                code: "MISSING_PREREQUISITES",
                title: "Cannot yet be enlisted",
                message:
                    missingPrerequisiteCodes.length > 0
                        ? `Complete ${missingPrerequisiteCodes.join(
                              ", ",
                          )} before enlisting ${courseCode}.`
                        : `${courseCode} cannot yet be enlisted because its curriculum requirements have not been satisfied.`,
                missingPrerequisiteCodes,
            };

        case "REGISTERED":
            return {
                code: "ALREADY_SELECTED",
                title: "Selected",
                message:
                    `${courseCode} is already registered for the current academic term.`,
                missingPrerequisiteCodes: [],
            };

        case "IN_PROGRESS":
            return {
                code: "ALREADY_SELECTED",
                title: "In progress",
                message:
                    `${courseCode} is currently being taken.`,
                missingPrerequisiteCodes: [],
            };
    }
}

function deriveStatus({
    gradeContext,
    enrollmentContext,
    selectionStatus,
    missingPrerequisiteCodes,
    recommendedTrimester,
    enlistmentSequence,
}: {
    gradeContext?: GradeContext;
    enrollmentContext?: EnrollmentContext;
    selectionStatus?:
        | "DRAFT"
        | "SUBMITTED";
    missingPrerequisiteCodes: string[];
    recommendedTrimester: number;
    enlistmentSequence: number;
}): StudentRecordStatus {
    if (
        gradeContext?.grade.result ===
        "CREDITED"
    ) {
        return "CREDITED";
    }

    if (
        gradeContext?.grade.result ===
        "PASSED"
    ) {
        return "COMPLETED";
    }

    if (
        enrollmentContext
            ?.enrollment.status ===
        "COMPLETED"
    ) {
        return "COMPLETED";
    }

    if (
        enrollmentContext
            ?.enrollment.status ===
        "ENROLLED"
    ) {
        return "IN_PROGRESS";
    }

    if (
        enrollmentContext
            ?.enrollment.status ===
        "REGISTERED"
    ) {
        return "REGISTERED";
    }

    if (selectionStatus === "SUBMITTED") {
        return "IN_PROGRESS";
    }

    if (selectionStatus === "DRAFT") {
        return "REGISTERED";
    }

    const prerequisitesSatisfied =
        missingPrerequisiteCodes.length ===
        0;

    const recommendedTermReached =
        recommendedTrimester <=
        enlistmentSequence;

    if (
        prerequisitesSatisfied &&
        recommendedTermReached
    ) {
        return "CAN_BE_ENLISTED";
    }

    return "CANNOT_YET_BE_ENLISTED";
}

function getRecordAcademicPeriod({
    gradeContext,
    enrollmentContext,
    selectionTerm,
    plannedTerm,
}: {
    gradeContext?: GradeContext;
    enrollmentContext?: EnrollmentContext;
    selectionTerm?: AcademicTermDocument;
    plannedTerm?: AcademicTermDocument;
}): {
    academicYear: string;
    academicTerm: number;
} {
    if (gradeContext) {
        return {
            academicYear:
                gradeContext
                    .academicTerm
                    .academicYear,

            academicTerm:
                gradeContext
                    .academicTerm
                    .termNumber,
        };
    }

    if (enrollmentContext) {
        return {
            academicYear:
                enrollmentContext
                    .academicTerm
                    .academicYear,

            academicTerm:
                enrollmentContext
                    .academicTerm
                    .termNumber,
        };
    }

    if (selectionTerm) {
        return {
            academicYear:
                selectionTerm.academicYear,

            academicTerm:
                selectionTerm.termNumber,
        };
    }

    if (plannedTerm) {
        return {
            academicYear:
                plannedTerm.academicYear,

            academicTerm:
                plannedTerm.termNumber,
        };
    }

    return {
        academicYear: "Not Scheduled",
        academicTerm: 0,
    };
}

function buildAcademicPeriodOptions(
    academicTerms: AcademicTermDocument[],
): AcademicPeriodOption[] {
    const uniquePeriods =
        new Map<
            string,
            AcademicPeriodOption
        >();

    for (
        const term of
        academicTerms
    ) {
        const key =
            `${term.academicYear}|${term.termNumber}`;

        if (
            uniquePeriods.has(key)
        ) {
            continue;
        }

        uniquePeriods.set(
            key,
            {
                academicYear:
                    term.academicYear,

                termNumber:
                    term.termNumber,

                label:
                    `${term.academicYear} — Term ${term.termNumber}`,
            },
        );
    }

    return Array.from(
        uniquePeriods.values(),
    ).sort(
        (first, second) => {
            const firstYear =
                Number(
                    first.academicYear
                        .match(/\d{4}/)?.[0] ??
                    0,
                );

            const secondYear =
                Number(
                    second.academicYear
                        .match(/\d{4}/)?.[0] ??
                    0,
                );

            if (
                firstYear !==
                secondYear
            ) {
                return (
                    firstYear -
                    secondYear
                );
            }

            return (
                first.termNumber -
                second.termNumber
            );
        },
    );
}

function calculateEnlistmentSequence(
    currentTerm: AcademicTermDocument,
    academicTerms: AcademicTermDocument[],
): number {
    if (
        currentTerm.curriculumTrimester
    ) {
        return (
            currentTerm
                .curriculumTrimester +
            1
        );
    }

    const historicalSequences =
        academicTerms
            .filter(
                (term) =>
                    typeof term
                        .curriculumTrimester ===
                        "number" &&
                    term.startDate <=
                        currentTerm.startDate,
            )
            .map(
                (term) =>
                    term.curriculumTrimester ??
                    0,
            );

    const latestHistoricalSequence =
        historicalSequences.length > 0
            ? Math.max(
                  ...historicalSequences,
              )
            : 0;

    return (
        latestHistoricalSequence +
        1
    );
}

export async function getStudentRecords(
    db: Db,
    authenticatedUserId: string,
    query: StudentRecordQuery,
): Promise<StudentRecordResponse> {
    if (
        !ObjectId.isValid(
            authenticatedUserId,
        )
    ) {
        throw new StudentRecordServiceError(
            "INVALID_USER_ID",
            "The authenticated user ID is invalid.",
            401,
        );
    }

    const userObjectId =
        new ObjectId(
            authenticatedUserId,
        );

    const student =
        await db
            .collection<StudentDocument>(
                "students",
            )
            .findOne({
                userId: userObjectId,
                status: "ACTIVE",
            });

    if (!student) {
        throw new StudentRecordServiceError(
            "STUDENT_NOT_FOUND",
            "The student record could not be found.",
            404,
        );
    }

    const [
        courses,
        academicTerms,
        currentTerm,
    ] = await Promise.all([
        db
            .collection<CourseDocument>(
                "courses",
            )
            .find({
                curriculumCode:
                    student.curriculumCode,

                status: "ACTIVE",
            })
            .sort({
                recommendedTrimester: 1,
                courseCode: 1,
            })
            .toArray(),

        db
            .collection<AcademicTermDocument>(
                "academicTerms",
            )
            .find({})
            .sort({
                startDate: 1,
                termNumber: 1,
            })
            .toArray(),

        db
            .collection<AcademicTermDocument>(
                "academicTerms",
            )
            .findOne({
                isCurrent: true,
                status: "ACTIVE",
            }),
    ]);

    if (!currentTerm) {
        throw new StudentRecordServiceError(
            "CURRENT_ACADEMIC_TERM_NOT_FOUND",
            "The current academic term is not configured.",
            500,
        );
    }

    const enrollmentHeader =
        await db
            .collection<StudentEnrollmentHeaderDocument>(
                "studentEnrollments",
            )
            .findOne(
                {
                    studentId: student._id,
                    status: {
                        $in: [
                            "DRAFT",
                            "SUBMITTED",
                        ],
                    },
                },
                {
                    sort: {
                        updatedAt: -1,
                        createdAt: -1,
                    },
                },
            );

    const enrollmentItems = enrollmentHeader
        ? await db
              .collection<StudentEnrollmentItemDocument>(
                  "studentEnrollmentItems",
              )
              .find({
                  enrollmentId:
                      enrollmentHeader._id,
                  studentId: student._id,
              })
              .toArray()
        : [];

    const enrollmentSelectionTerm =
        enrollmentHeader
            ? academicTerms.find(
                  (term) =>
                      term._id.equals(
                          enrollmentHeader.academicTermId,
                      ),
              )
            : undefined;

    const enrollmentItemByCourseId =
        new Map(
            enrollmentItems.map((item) => [
                item.courseId.toHexString(),
                item,
            ]),
        );

    if (courses.length === 0) {
        throw new StudentRecordServiceError(
            "CURRICULUM_NOT_FOUND",
            "No courses were found for the student's curriculum.",
            404,
        );
    }

    const courseIds =
        courses.map(
            (course) =>
                course._id,
        );

    const sections =
        await db
            .collection<SectionDocument>(
                "sections",
            )
            .find({
                courseId: {
                    $in: courseIds,
                },
            })
            .toArray();

    const sectionIds =
        sections.map(
            (section) =>
                section._id,
        );

    const [
        enrollments,
        grades,
    ] = await Promise.all([
        db
            .collection<EnrollmentDocument>(
                "enrollments",
            )
            .find({
                studentId:
                    student._id,

                sectionId: {
                    $in: sectionIds,
                },
            })
            .toArray(),

        db
            .collection<GradeDocument>(
                "grades",
            )
            .find({
                studentId:
                    student._id,

                sectionId: {
                    $in: sectionIds,
                },
            })
            .toArray(),
    ]);

    const coursesById =
        new Map(
            courses.map(
                (course) => [
                    course._id
                        .toHexString(),
                    course,
                ],
            ),
        );

    const coursesByCode =
        new Map(
            courses.map(
                (course) => [
                    course.courseCode,
                    course,
                ],
            ),
        );

    const termsById =
        new Map(
            academicTerms.map(
                (term) => [
                    term._id
                        .toHexString(),
                    term,
                ],
            ),
        );

    const plannedTermsByTrimester =
        new Map<
            number,
            AcademicTermDocument
        >();

    for (
        const term of
        academicTerms
    ) {
        if (
            typeof term
                .curriculumTrimester !==
            "number"
        ) {
            continue;
        }

        plannedTermsByTrimester.set(
            term.curriculumTrimester,
            term,
        );
    }

    const sectionsById =
        new Map(
            sections.map(
                (section) => [
                    section._id
                        .toHexString(),
                    section,
                ],
            ),
        );

    const enrollmentContextsByCourseId =
        new Map<
            string,
            EnrollmentContext[]
        >();

    for (
        const enrollment of
        enrollments
    ) {
        const section =
            sectionsById.get(
                enrollment.sectionId
                    .toHexString(),
            );

        if (!section) {
            continue;
        }

        const academicTerm =
            termsById.get(
                enrollment
                    .academicTermId
                    .toHexString(),
            );

        if (!academicTerm) {
            continue;
        }

        const courseId =
            section.courseId
                .toHexString();

        const existing =
            enrollmentContextsByCourseId
                .get(courseId) ??
            [];

        existing.push({
            enrollment,
            section,
            academicTerm,
        });

        enrollmentContextsByCourseId
            .set(
                courseId,
                existing,
            );
    }

    const gradeContextsByCourseId =
        new Map<
            string,
            GradeContext[]
        >();

    for (
        const grade of
        grades
    ) {
        const section =
            sectionsById.get(
                grade.sectionId
                    .toHexString(),
            );

        if (!section) {
            continue;
        }

        const academicTerm =
            termsById.get(
                grade.academicTermId
                    .toHexString(),
            );

        if (!academicTerm) {
            continue;
        }

        const courseId =
            section.courseId
                .toHexString();

        const existing =
            gradeContextsByCourseId
                .get(courseId) ??
            [];

        existing.push({
            grade,
            section,
            academicTerm,
        });

        gradeContextsByCourseId.set(
            courseId,
            existing,
        );
    }

    const satisfiedCourseCodes =
        new Set<string>();

    for (
        const [
            courseId,
            contexts,
        ] of
        gradeContextsByCourseId
    ) {
        const course =
            coursesById.get(
                courseId,
            );

        if (!course) {
            continue;
        }

        const hasSatisfiedGrade =
            contexts.some(
                (context) =>
                    context
                        .grade.result ===
                        "PASSED" ||
                    context
                        .grade.result ===
                        "CREDITED",
            );

        if (hasSatisfiedGrade) {
            satisfiedCourseCodes.add(
                course.courseCode,
            );
        }
    }

    for (
        const [
            courseId,
            contexts,
        ] of
        enrollmentContextsByCourseId
    ) {
        const course =
            coursesById.get(
                courseId,
            );

        if (!course) {
            continue;
        }

        const completed =
            contexts.some(
                (context) =>
                    context
                        .enrollment
                        .status ===
                    "COMPLETED",
            );

        if (completed) {
            satisfiedCourseCodes.add(
                course.courseCode,
            );
        }
    }

    const enlistmentSequence =
        calculateEnlistmentSequence(
            currentTerm,
            academicTerms,
        );

    const recordItems:
        StudentRecordItem[] = [];

    for (
        const course of
        courses
    ) {
        const courseId =
            course._id
                .toHexString();

        const enrollmentContext =
            getBestEnrollment(
                enrollmentContextsByCourseId
                    .get(courseId) ??
                    [],
            );

        const gradeContext =
            getBestGrade(
                gradeContextsByCourseId
                    .get(courseId) ??
                    [],
            );

        const enrollmentItem =
            enrollmentItemByCourseId.get(
                courseId,
            );

        const selectionStatus =
            enrollmentItem &&
            enrollmentHeader
                ? enrollmentHeader.status ===
                  "SUBMITTED"
                    ? "SUBMITTED"
                    : "DRAFT"
                : undefined;

        const prerequisiteCodes =
            course.prerequisiteCodes ??
            [];

        const missingPrerequisiteCodes =
            prerequisiteCodes.filter(
                (code) =>
                    !satisfiedCourseCodes
                        .has(code),
            );

        const plannedTerm =
            plannedTermsByTrimester.get(
                course
                    .recommendedTrimester,
            );

        const period =
            getRecordAcademicPeriod({
                gradeContext,
                enrollmentContext,
                selectionTerm:
                    enrollmentItem
                        ? enrollmentSelectionTerm
                        : undefined,
                plannedTerm,
            });

        const status =
            deriveStatus({
                gradeContext,
                enrollmentContext,
                selectionStatus,
                missingPrerequisiteCodes,

                recommendedTrimester:
                    course
                        .recommendedTrimester,

                enlistmentSequence,
            });

        const eligibility =
            getRecordEligibility({
                status,
                courseCode:
                    course.courseCode,
                missingPrerequisiteCodes:
                    missingPrerequisiteCodes.filter(
                        (code) =>
                            coursesByCode.has(
                                code,
                            ),
                    ),
            });

        recordItems.push({
            id: courseId,
            courseId,

            courseCode:
                course.courseCode,

            courseName:
                course.courseName,

            units:
                enrollmentItem
                    ?.academicUnits ??
                getCourseUnits(course),

            nonAcademicUnits:
                enrollmentItem
                    ?.nonAcademicUnits ??
                getCourseNonAcademicUnits(
                    course,
                ),

            curriculumTerm:
                course
                    .recommendedTrimester,

            academicYear:
                period.academicYear,

            academicTerm:
                period.academicTerm,

            status,

            eligibilityCode:
                eligibility.code,

            eligibilityTitle:
                eligibility.title,

            eligibilityMessage:
                eligibility.message,

            grade:
                formatGrade(
                    gradeContext?.grade,
                ),

            prerequisiteCodes:
                prerequisiteCodes.filter(
                    (code) =>
                        coursesByCode.has(
                            code,
                        ),
                ),

            missingPrerequisiteCodes:
                eligibility
                    .missingPrerequisiteCodes,
        });
    }

    recordItems.sort(
        (first, second) => {
            if (
                first.curriculumTerm !==
                second.curriculumTerm
            ) {
                return (
                    first.curriculumTerm -
                    second.curriculumTerm
                );
            }

            return first.courseCode
                .localeCompare(
                    second.courseCode,
                );
        },
    );

    const requiredUnits =
        recordItems.reduce(
            (total, record) =>
                total + record.units,
            0,
        );

    const requiredNonAcademicUnits =
        student.requiredNonAcademicUnits ??
        recordItems.reduce(
            (total, record) =>
                total +
                record.nonAcademicUnits,
            0,
        );

    const earnedRecords =
        recordItems.filter(
            (record) =>
                record.status ===
                    "COMPLETED" ||
                record.status ===
                    "CREDITED",
        );

    const earnedUnits =
        earnedRecords.reduce(
            (total, record) =>
                total + record.units,
            0,
        );

    const earnedNonAcademicUnits =
        earnedRecords.reduce(
            (total, record) =>
                total +
                record.nonAcademicUnits,
            0,
        );

    const enrolledRecords =
    recordItems.filter(
        (record) =>
            record.status ===
            "IN_PROGRESS",
    );

    const enrolledUnits =
        enrolledRecords.reduce(
            (total, record) =>
                total +
                Number(
                    record.units ??
                        0,
                ),
            0,
        );

    const enrolledNonAcademicUnits =
        enrolledRecords.reduce(
            (total, record) =>
                total +
                Number(
                    record.nonAcademicUnits ??
                        0,
                ),
            0,
        );

    /*
     * Enlisted units represent the student's current
     * unsubmitted enrollment draft.
     *
     * Calculate the values directly from the draft items.
     * Deriving the values from recordItems can miss a draft
     * when a historical enrollment or grade takes precedence
     * while the record status is being resolved.
     */
    const activeDraftItems =
        enrollmentHeader?.status ===
        "DRAFT"
            ? enrollmentItems
            : [];

    const enlistedUnits =
        activeDraftItems.reduce(
            (total, item) =>
                total +
                Number(
                    item.academicUnits ??
                        0,
                ),
            0,
        );

    const enlistedNonAcademicUnits =
        activeDraftItems.reduce(
            (total, item) =>
                total +
                Number(
                    item.nonAcademicUnits ??
                        0,
                ),
            0,
        );

    const search =
        normalizeSearchValue(
            query.search,
        );

    const filteredRecords =
        recordItems.filter(
            (record) => {
                const matchesSearch =
                    !search ||
                    record.courseCode
                        .toLowerCase()
                        .includes(search) ||
                    record.courseName
                        .toLowerCase()
                        .includes(search);

                const matchesAcademicYear =
                    !query.academicYear ||
                    record.academicYear ===
                        query.academicYear;

                const matchesTerm =
                    !query.termNumber ||
                    record.academicTerm ===
                        query.termNumber;

                const matchesStatus =
                    !query.status ||
                    record.status ===
                        query.status;

                return (
                    matchesSearch &&
                    matchesAcademicYear &&
                    matchesTerm &&
                    matchesStatus
                );
            },
        );

    const totalItems =
        filteredRecords.length;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                totalItems /
                    query.limit,
            ),
        );

    const page =
        Math.min(
            query.page,
            totalPages,
        );

    const offset =
        (page - 1) *
        query.limit;

    const paginatedRecords =
        filteredRecords.slice(
            offset,
            offset + query.limit,
        );

    const statuses:
        StudentRecordStatus[] = [
        "IN_PROGRESS",
        "COMPLETED",
        "CANNOT_YET_BE_ENLISTED",
        "REGISTERED",
        "CAN_BE_ENLISTED",
        "CREDITED",
    ];

    const academicPeriods =
        buildAcademicPeriodOptions(
            academicTerms,
        );

    return {
        summary: {
            requiredUnits,
            requiredNonAcademicUnits,

            earnedUnits,
            earnedNonAcademicUnits,

            remainingUnits:
                Math.max(
                    0,
                    requiredUnits -
                        earnedUnits,
                ),

            remainingNonAcademicUnits:
                Math.max(
                    0,
                    requiredNonAcademicUnits -
                        earnedNonAcademicUnits,
                ),

            enrolledUnits,
            enrolledNonAcademicUnits,

            enlistedUnits,
            enlistedNonAcademicUnits,
        },

        records:
            paginatedRecords,

        filters: {
            academicPeriods,
            statuses,
        },

        pagination: {
            page,
            limit: query.limit,
            totalItems,
            totalPages,
        },
    };
}