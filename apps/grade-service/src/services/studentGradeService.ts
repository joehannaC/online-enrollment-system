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

    /*
     * Cumulative academic record before
     * the latest academic term.
     */
    previousGpa?: number;
    previousGradedUnits?: number;
    previousGradePoints?: number;

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

    isCurrent?: boolean;
    isEnrollmentTerm?: boolean;
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

interface GradePointCalculation {
    gradedUnits: number;
    gradePoints: number;
    gpa: number | null;
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
        typeof grade.finalGradeValue !==
            "number" ||
        !Number.isFinite(
            grade.finalGradeValue,
        )
    ) {
        return "—";
    }

    return grade.finalGradeValue
        .toFixed(1);
}

function getAcademicYearStart(
    academicYear: string,
): number {
    const matchedYear =
        academicYear.match(
            /\d{4}/,
        )?.[0];

    return Number(
        matchedYear ?? 0,
    );
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
                getAcademicYearStart(
                    first.academicYear,
                );

            const secondYear =
                getAcademicYearStart(
                    second.academicYear,
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

function normalizeNonNegativeNumber(
    value: unknown,
): number {
    if (
        typeof value !==
            "number" ||
        !Number.isFinite(
            value,
        ) ||
        value < 0
    ) {
        return 0;
    }

    return value;
}

function isNumericGpaGrade(
    grade: StudentGradeItem,
): boolean {
    return (
        grade.status !==
            "CREDITED" &&
        typeof grade.numericGrade ===
            "number" &&
        Number.isFinite(
            grade.numericGrade,
        ) &&
        grade.units > 0
    );
}

function contributesGpaUnits(
    grade: StudentGradeItem,
): boolean {
    /*
     * Every course with a numeric final grade contributes
     * its academic units to the GPA denominator, including
     * failed courses with a numeric grade of 0.0.
     *
     * CREDITED courses are excluded because they do not have
     * a numeric GPA grade.
     */
    return isNumericGpaGrade(
        grade,
    );
}

function calculateGradePoints(
    grades: StudentGradeItem[],
): GradePointCalculation {
    const numericGrades =
        grades.filter(
            isNumericGpaGrade,
        );

    const gradePoints =
        numericGrades.reduce(
            (total, grade) =>
                total +
                grade.numericGrade! *
                    grade.units,
            0,
        );

    const gradedUnits =
        numericGrades
            .filter(
                contributesGpaUnits,
            )
            .reduce(
                (total, grade) =>
                    total +
                    grade.units,
                0,
            );

    const gpa =
        gradedUnits > 0
            ? Number(
                  (
                      gradePoints /
                      gradedUnits
                  ).toFixed(2),
              )
            : null;

    return {
        gradedUnits,
        gradePoints,
        gpa,
    };
}

function getGradesForAcademicTerm(
    grades: StudentGradeItem[],
    academicTerm:
        AcademicTermDocument | undefined,
): StudentGradeItem[] {
    if (!academicTerm) {
        return [];
    }

    return grades.filter(
        (grade) =>
            grade.academicYear ===
                academicTerm.academicYear &&
            grade.termNumber ===
                academicTerm.termNumber,
    );
}

function getLatestIncrementalAcademicTerm(
    academicTerms: AcademicTermDocument[],
    gradeItems: StudentGradeItem[],
): AcademicTermDocument | undefined {
    /*
     * previousGpa / previousGradedUnits /
     * previousGradePoints already represent
     * completed historical terms.
     *
     * Therefore only a non-COMPLETED term may
     * contribute new grade points to the stored
     * cumulative baseline.
     *
     * Prefer the explicitly current term. If no
     * finalized grades exist there yet, allow a
     * newer ACTIVE/UPCOMING term that actually
     * has finalized grades. This keeps GPA
     * calculation working when term flags are in
     * transition while preventing historical
     * completed terms from being counted twice.
     */
    const nonCompletedTerms =
        academicTerms
            .filter(
                (term) =>
                    term.status !==
                    "COMPLETED",
            )
            .filter(
                (term) =>
                    getGradesForAcademicTerm(
                        gradeItems,
                        term,
                    ).length > 0,
            )
            .sort(
                (first, second) =>
                    second.startDate.getTime() -
                    first.startDate.getTime(),
            );

    const currentTermWithGrades =
        nonCompletedTerms.find(
            (term) =>
                term.isCurrent === true,
        );

    return (
        currentTermWithGrades ??
        nonCompletedTerms[0]
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

                status:
                    "ACTIVE",
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
                        grade.academicTermId
                            .toHexString(),

                        grade.academicTermId,
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
                    numericGrade >=
                        1.0
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

    /*
     * Sort newest academic period first.
     */
    gradeItems.sort(
        (first, second) => {
            const firstYear =
                getAcademicYearStart(
                    first.academicYear,
                );

            const secondYear =
                getAcademicYearStart(
                    second.academicYear,
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

    /*
     * Previous cumulative academic record.
     */
    const previousGpaValue =
        normalizeNonNegativeNumber(
            student.previousGpa,
        );

    const previousGpa =
        student.previousGpa !==
            undefined &&
        Number.isFinite(
            student.previousGpa,
        ) &&
        student.previousGpa >= 0
            ? previousGpaValue
            : null;

    const previousGradedUnits =
        normalizeNonNegativeNumber(
            student.previousGradedUnits,
        );

    const hasPreviousGradePoints =
        typeof student.previousGradePoints ===
            "number" &&
        Number.isFinite(
            student.previousGradePoints,
        ) &&
        student.previousGradePoints >= 0;

    /*
     * Exact grade points are preferred.
     *
     * A rounded GPA multiplied by units can
     * introduce cumulative rounding errors.
     */
    const previousGradePoints =
        hasPreviousGradePoints
            ? student.previousGradePoints!
            : previousGpaValue *
              previousGradedUnits;

    /*
     * previousGpa / previousGradedUnits /
     * previousGradePoints already represent the
     * student's completed historical record.
     *
     * Only finalized grades from a non-COMPLETED
     * academic term are allowed to extend that
     * baseline. This prevents an old historical
     * term from being added twice while still
     * allowing the current GPA to update as soon
     * as new SUBMITTED/VERIFIED grades exist.
     */
    const incrementalAcademicTerm =
        getLatestIncrementalAcademicTerm(
            academicTerms,
            gradeItems,
        );

    const latestTermGrades =
        getGradesForAcademicTerm(
            gradeItems,
            incrementalAcademicTerm,
        );

    const latestTermCalculation =
        calculateGradePoints(
            latestTermGrades,
        );

    const totalGradedUnits =
        previousGradedUnits +
        latestTermCalculation
            .gradedUnits;

    const totalGradePoints =
        previousGradePoints +
        latestTermCalculation
            .gradePoints;

    const currentGpa =
        totalGradedUnits > 0
            ? Number(
                  (
                      totalGradePoints /
                      totalGradedUnits
                  ).toFixed(2),
              )
            : null;

    /*
     * Current GPA and cumulative GPA refer
     * to the same updated cumulative value.
     */
    const cumulativeGpa =
        currentGpa;

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

    /*
     * Temporary diagnostic output.
     * Remove after confirming the GPA.
     */
    console.log(
        "[grade-service] GPA calculation",
        {
            studentNumber:
                student.studentNumber,

            previousGpa,
            previousGradedUnits,
            previousGradePoints,

            incrementalAcademicTerm:
                incrementalAcademicTerm
                    ? {
                          academicYear:
                              incrementalAcademicTerm
                                  .academicYear,
                          termNumber:
                              incrementalAcademicTerm
                                  .termNumber,
                          status:
                              incrementalAcademicTerm
                                  .status,
                          isCurrent:
                              incrementalAcademicTerm
                                  .isCurrent ??
                              false,
                      }
                    : null,

            latestTermGradePoints:
                latestTermCalculation
                    .gradePoints,

            latestTermGradedUnits:
                latestTermCalculation
                    .gradedUnits,

            latestTermGpa:
                latestTermCalculation
                    .gpa,

            totalGradePoints,
            totalGradedUnits,

            currentGpa,
        },
    );

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

            previousGpa,
            previousGradedUnits,
            previousGradePoints,

            latestTermGpa:
                latestTermCalculation
                    .gpa,

            latestTermGradedUnits:
                latestTermCalculation
                    .gradedUnits,

            latestTermGradePoints:
                latestTermCalculation
                    .gradePoints,

            currentGpa,
            cumulativeGpa,

            gradedUnits:
                totalGradedUnits,

            totalGradePoints,

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