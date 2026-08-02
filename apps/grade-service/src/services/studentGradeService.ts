import {
    ObjectId,
    type Db,
} from "mongodb";

import type {
    StudentGradeAcademicPeriod,
    StudentGradeItem,
    StudentGradeResponse,
    StudentGradeStatus,
} from "../types/studentGrade.types.js";
import type {
    StudentGradeQuery,
} from "../validators/studentGradeQuerySchema.js";


interface StudentDocument {
    _id: ObjectId;
    userId: ObjectId;

    studentNumber: string;

    programName: string;
    curriculumCode: string;

    campus: string;
    college: string;

    status: string;
}

interface CourseDocument {
    _id: ObjectId;

    courseCode: string;
    courseName: string;

    units?: number;
    academicUnits?: number;

    status: string;
}

interface AcademicTermDocument {
    _id: ObjectId;

    academicYear: string;
    termNumber: number;

    startDate: Date;

    status:
        | "ACTIVE"
        | "UPCOMING"
        | "COMPLETED";
}

interface SectionDocument {
    _id: ObjectId;

    courseId: ObjectId;
    academicTermId: ObjectId;

    sectionCode: string;
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

    verifiedAt?: Date;
    submittedAt?: Date;

    createdAt?: Date;
    updatedAt?: Date;
}

interface EnrollmentHeaderDocument {
    _id: ObjectId;
    studentId: ObjectId;
    academicTermId: ObjectId;
    status:
        | "DRAFT"
        | "SUBMITTED"
        | "CANCELLED";
}

interface EnrollmentItemDocument {
    _id: ObjectId;
    enrollmentId: ObjectId;
    studentId: ObjectId;
    academicTermId: ObjectId;
    sectionId: ObjectId;
    courseId: ObjectId;
    academicUnits: number;
    nonAcademicUnits: number;
}

export class StudentGradeServiceError
    extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
    ) {
        super(message);

        this.name =
            "StudentGradeServiceError";
    }
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

function formatGrade(
    grade: GradeDocument,
): string {
    if (
        grade.result ===
        "CREDITED"
    ) {
        return "CR";
    }

    if (
        grade.finalGradeValue ===
        undefined
    ) {
        return "—";
    }

    return grade.finalGradeValue
        .toFixed(1);
}

function buildAcademicPeriods(
    grades: StudentGradeItem[],
): StudentGradeAcademicPeriod[] {
    const periods =
        new Map<
            string,
            StudentGradeAcademicPeriod
        >();

    for (const grade of grades) {
        const key =
            `${grade.academicYear}|${grade.termNumber}`;

        if (periods.has(key)) {
            continue;
        }

        periods.set(key, {
            academicYear:
                grade.academicYear,

            termNumber:
                grade.termNumber,

            label:
                `${grade.academicYear} — Term ${grade.termNumber}`,
        });
    }

    return Array.from(
        periods.values(),
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

export async function getStudentGrades(
    db: Db,
    authenticatedUserId: string,
    query: StudentGradeQuery,
): Promise<StudentGradeResponse> {
    if (
        !ObjectId.isValid(
            authenticatedUserId,
        )
    ) {
        throw new StudentGradeServiceError(
            "INVALID_USER_ID",
            "The authenticated user ID is invalid.",
            401,
        );
    }

    const student =
        await db
            .collection<StudentDocument>(
                "students",
            )
            .findOne({
                userId:
                    new ObjectId(
                        authenticatedUserId,
                    ),

                status: "ACTIVE",
            });

    if (!student) {
        throw new StudentGradeServiceError(
            "STUDENT_NOT_FOUND",
            "The student record could not be found.",
            404,
        );
    }

    const gradeDocuments =
        await db
            .collection<GradeDocument>(
                "grades",
            )
            .find({
                studentId:
                    student._id,

                status: {
                    $in: [
                        "SUBMITTED",
                        "VERIFIED",
                    ],
                },
            })
            .toArray();

    const sectionIds =
        Array.from(
            new Map(
                gradeDocuments.map(
                    (grade) => [
                        grade.sectionId
                            .toHexString(),

                        grade.sectionId,
                    ],
                ),
            ).values(),
        );

    const sections =
        sectionIds.length > 0
            ? await db
                  .collection<SectionDocument>(
                      "sections",
                  )
                  .find({
                      _id: {
                          $in:
                              sectionIds,
                      },
                  })
                  .toArray()
            : [];

    const courseIds =
        Array.from(
            new Map(
                sections.map(
                    (section) => [
                        section.courseId
                            .toHexString(),

                        section.courseId,
                    ],
                ),
            ).values(),
        );

    const academicTermIds =
        Array.from(
            new Map(
                gradeDocuments.map(
                    (grade) => [
                        grade
                            .academicTermId
                            .toHexString(),

                        grade
                            .academicTermId,
                    ],
                ),
            ).values(),
        );

    const [
        courses,
        academicTerms,
    ] = await Promise.all([
        courseIds.length > 0
            ? db
                  .collection<CourseDocument>(
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

        academicTermIds.length > 0
            ? db
                  .collection<AcademicTermDocument>(
                      "academicTerms",
                  )
                  .find({
                      _id: {
                          $in:
                              academicTermIds,
                      },
                  })
                  .toArray()
            : [],
    ]);

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

    const academicTermsById =
        new Map(
            academicTerms.map(
                (term) => [
                    term._id
                        .toHexString(),

                    term,
                ],
            ),
        );

    const gradeItems:
        StudentGradeItem[] = [];

    for (
        const grade of
        gradeDocuments
    ) {
        const section =
            sectionsById.get(
                grade.sectionId
                    .toHexString(),
            );

        if (!section) {
            continue;
        }

        const courseId =
            section.courseId
                .toHexString();

        const course =
            coursesById.get(
                courseId,
            );

        const academicTerm =
            academicTermsById.get(
                grade.academicTermId
                    .toHexString(),
            );

        if (
            !course ||
            !academicTerm
        ) {
            continue;
        }

        const numericGrade =
            typeof grade.finalGradeValue ===
                    "number" &&
                Number.isFinite(
                    grade.finalGradeValue,
                )
                ? grade.finalGradeValue
                : undefined;

        const gradeStatus:
            StudentGradeStatus =
            grade.result ===
            "CREDITED"
                ? "CREDITED"
                : numericGrade !==
                        undefined &&
                    numericGrade >= 1.0
                  ? "PASSED"
                  : "FAILED";

        gradeItems.push({
            id:
                grade._id
                    .toHexString(),

            courseId,

            courseCode:
                course.courseCode,

            courseName:
                course.courseName,

            units:
                getCourseUnits(
                    course,
                ),

            academicYear:
                academicTerm
                    .academicYear,

            termNumber:
                academicTerm
                    .termNumber,

            grade:
                formatGrade(
                    grade,
                ),

            numericGrade:
                gradeStatus ===
                "CREDITED"
                    ? undefined
                    : numericGrade,

            status:
                gradeStatus,
        });
    }

    gradeItems.sort(
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
                    secondYear -
                    firstYear
                );
            }

            if (
                first.termNumber !==
                second.termNumber
            ) {
                return (
                    second.termNumber -
                    first.termNumber
                );
            }

            return first.courseCode
                .localeCompare(
                    second.courseCode,
                );
        },
    );

    const gpaEligibleGrades =
        gradeItems.filter(
            (grade) =>
                grade.status !==
                    "CREDITED" &&
                typeof grade.numericGrade ===
                    "number" &&
                Number.isFinite(
                    grade.numericGrade,
                ) &&
                grade.units > 0,
        );

    const gradedUnits =
        gpaEligibleGrades.reduce(
            (total, grade) =>
                total +
                grade.units,
            0,
        );

    const weightedGradeTotal =
        gpaEligibleGrades.reduce(
            (total, grade) =>
                total +
                grade.numericGrade! *
                    grade.units,
            0,
        );

    const currentGpa =
        gradedUnits > 0
            ? Number(
                  (
                      weightedGradeTotal /
                      gradedUnits
                  ).toFixed(2),
              )
            : null;

    const creditedUnits =
        gradeItems
            .filter(
                (grade) =>
                    grade.status ===
                    "CREDITED",
            )
            .reduce(
                (total, grade) =>
                    total +
                    grade.units,
                0,
            );

    const normalizedSearch =
        query.search
            .trim()
            .toLowerCase();

    const filteredGrades =
        gradeItems.filter(
            (grade) => {
                const matchesSearch =
                    !normalizedSearch ||
                    grade.courseCode
                        .toLowerCase()
                        .includes(
                            normalizedSearch,
                        ) ||
                    grade.courseName
                        .toLowerCase()
                        .includes(
                            normalizedSearch,
                        );

                const matchesAcademicYear =
                    !query.academicYear ||
                    grade.academicYear ===
                        query.academicYear;

                const matchesTerm =
                    !query.termNumber ||
                    grade.termNumber ===
                        query.termNumber;

                const matchesStatus =
                    !query.status ||
                    grade.status ===
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
        filteredGrades.length;

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

    const startIndex =
        (page - 1) *
        query.limit;

    const paginatedGrades =
        filteredGrades.slice(
            startIndex,
            startIndex +
                query.limit,
        );

    const statuses:
        StudentGradeStatus[] = [
        "PASSED",
        "FAILED",
        "CREDITED",
    ];

    return {
        summary: {
            programName:
                student.programName,

            curriculumCode:
                student.curriculumCode,

            studentNumber:
                student.studentNumber,

            campus:
                student.campus,

            college:
                student.college,

            currentGpa,
            gradedUnits,
            creditedUnits,
        },

        grades:
            paginatedGrades,

        filters: {
            academicPeriods:
                buildAcademicPeriods(
                    gradeItems,
                ),

            statuses,
        },

        pagination: {
            page,
            limit:
                query.limit,
            totalItems,
            totalPages,
        },
    };
}