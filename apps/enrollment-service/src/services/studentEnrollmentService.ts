import {
    MongoServerError,
    ObjectId,
    type ClientSession,
    type Db,
} from "mongodb";

import {
    getDatabase,
    getMongoClient,
} from "../config/database.js";
import { FairSemaphore } from "../synchronization/fairSemaphore.js";
import {
    publishEnrollmentUpdated,
} from "../realtime/realtimePublisher.js";

const MAXIMUM_ACADEMIC_UNITS = 21;
const MAXIMUM_SECTION_CAPACITY = 45;

interface EnrollmentQuery {
    search: string;
    availability:
        | "ALL"
        | "OPEN"
        | "FULL";
    page: number;
    limit: number;
}

interface AddDraftItemInput {
    sectionId: string;
    expectedVersion: number;
}

interface SubmitEnrollmentInput {
    expectedVersion: number;
    idempotencyKey: string;
}

export interface RejectedEnrollmentSection {
    itemId: string;
    sectionId: string;
    sectionCode: string;
    courseId: string;
    courseCode: string;
    courseName: string;
    reason:
        | "SECTION_FULL"
        | "SCHEDULE_CONFLICT";
}

export interface SubmitEnrollmentResult {
    outcome:
        | "SUCCESS"
        | "PARTIAL_SUCCESS"
        | "ALL_SECTIONS_FULL";

    message: string;

    submittedCourseCount: number;
    rejectedCourseCount: number;

    rejectedSections:
        RejectedEnrollmentSection[];
}

interface StudentDocument {
    _id: ObjectId;
    userId: ObjectId;
    studentNumber: string;
    curriculumCode: string;
    status: string;
}

interface CourseDocument {
    _id: ObjectId;
    courseCode: string;
    courseName: string;
    academicUnits: number;
    nonAcademicUnits: number;
    curriculumCode: string;
    prerequisiteCodes?: string[];
    category?: string;
    status: string;
}

interface AcademicTermDocument {
    _id: ObjectId;
    code: string;
    name: string;
    academicYear: string;
    termNumber: number;
    startDate: Date;
    endDate: Date;
    enrollmentStart: Date;
    enrollmentEnd: Date;
    status:
        | "ACTIVE"
        | "UPCOMING"
        | "COMPLETED";
    isEnrollmentTerm?: boolean;
}

interface ScheduleEntry {
    days: string[];
    startTime: string;
    endTime: string;
    room?: string;
}

interface SectionDocument {
    _id: ObjectId;
    courseId: ObjectId;
    academicTermId: ObjectId;
    facultyId?: ObjectId;
    sectionCode: string;
    schedule: ScheduleEntry[];
    capacity: number;
    enrolledCount: number;
    status:
        | "OPEN"
        | "CLOSED"
        | "CANCELLED";
}

interface FacultyDocument {
    _id: ObjectId;
    title?: string;
    firstName: string;
    lastName: string;
}

interface GradeDocument {
    _id: ObjectId;
    studentId: ObjectId;
    sectionId: ObjectId;
    academicTermId: ObjectId;
    finalGradeValue?: number;
    result:
        | "PASSED"
        | "FAILED"
        | "CREDITED";
    status:
        | "DRAFT"
        | "SUBMITTED"
        | "VERIFIED";
}

interface EnrollmentHeaderDocument {
    _id: ObjectId;
    studentId: ObjectId;
    academicTermId: ObjectId;
    status:
        | "DRAFT"
        | "SUBMITTED"
        | "CANCELLED";
    totalAcademicUnits: number;
    totalNonAcademicUnits: number;
    version: number;
    submittedAt?: Date;
    lastIdempotencyKey?: string;
    createdAt: Date;
    updatedAt: Date;
}

type EnrollmentItemStatus =
    | "DRAFT"
    | "ENROLLED";

interface EnrollmentItemDocument {
    _id: ObjectId;
    enrollmentId: ObjectId;
    studentId: ObjectId;
    academicTermId: ObjectId;
    sectionId: ObjectId;
    courseId: ObjectId;
    academicUnits: number;
    nonAcademicUnits: number;
    status: EnrollmentItemStatus;
    enrolledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface GradeHistoryEntry {
    result:
        | "PASSED"
        | "FAILED"
        | "CREDITED";
    academicYear: string;
    termNumber: number;
}

type CourseEligibilityCode =
    | "ELIGIBLE"
    | "MISSING_PREREQUISITES"
    | "ALREADY_COMPLETED"
    | "ALREADY_CREDITED"
    | "ALREADY_SELECTED"
    | "ALREADY_ENROLLED"
    | "SECTION_FULL"
    | "MAXIMUM_LOAD_EXCEEDED"
    | "ENROLLMENT_NOT_OPEN"
    | "ENROLLMENT_CLOSED"
    | "ENROLLMENT_SUBMITTED"
    | "FAILED_COURSE_RETAKE_NOT_ALLOWED"
    | "SCHEDULE_CONFLICT";

interface CourseEligibility {
    canEnroll: boolean;
    code: CourseEligibilityCode;
    title: string;
    message: string;
    missingPrerequisiteCodes?: string[];
}

interface EnrollmentSectionOption {
    sectionId: string;
    courseId: string;
    courseCode: string;
    courseName: string;
    academicUnits: number;
    nonAcademicUnits: number;
    sectionCode: string;
    instructorName: string;
    scheduleLabel: string;
    capacity: number;
    enrolledCount: number;
    availableSlots: number;
    isFull: boolean;
    canEnroll: boolean;
    eligibilityCode: CourseEligibilityCode;
    eligibilityTitle: string;
    eligibilityMessage: string;
    missingPrerequisiteCodes?: string[];
}

interface EnrollmentSummaryItem {
    itemId: string;
    sectionId: string;
    courseId: string;
    courseCode: string;
    courseName: string;
    academicUnits: number;
    nonAcademicUnits: number;
    sectionCode: string;
    instructorName: string;
    scheduleLabel: string;
    status: EnrollmentItemStatus;
    canDrop: boolean;
    enrolledAt?: string;
}

export interface StudentEnrollmentResponse {
    term: {
        academicTermId: string;
        academicYear: string;
        termNumber: number;
        name: string;
        enrollmentStart: string;
        enrollmentEnd: string;
        termStart: string;
        maximumAcademicUnits: number;
        isEnrollmentOpen: boolean;
    };

    enrollment: {
        enrollmentId?: string;
        status?:
            | "DRAFT"
            | "SUBMITTED"
            | "CANCELLED";
        mode:
            | "EDITABLE_DRAFT"
            | "EDITABLE_SUBMITTED"
            | "READ_ONLY";
        version: number;
        submittedAt?: string;
        totalAcademicUnits: number;
        totalNonAcademicUnits: number;
        items: EnrollmentSummaryItem[];
    };

    availableSections:
        EnrollmentSectionOption[];

    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
}

export class StudentEnrollmentServiceError
    extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly status: number,
        public readonly details?: Record<
            string,
            unknown
        >,
    ) {
        super(message);
        this.name =
            "StudentEnrollmentServiceError";
    }
}

const configuredPermits =
    Number(
        process.env
            .ENROLLMENT_MAX_CONCURRENT_SUBMISSIONS ??
            24,
    );

const submissionSemaphore =
    new FairSemaphore(
        Number.isInteger(
            configuredPermits,
        ) &&
        configuredPermits > 0
            ? configuredPermits
            : 24,
    );

function isEnrollmentOpen(
    term: AcademicTermDocument,
    now = new Date(),
): boolean {
    return (
        now >= term.enrollmentStart &&
        now <= term.enrollmentEnd
    );
}

function getItemStatus(
    item: EnrollmentItemDocument,
): EnrollmentItemStatus {
    return item.status ?? "DRAFT";
}

function getCourseEligibility({
    enrollmentHasStarted,
    enrollmentHasEnded,
    enrollmentSubmitted,
    alreadyCompleted,
    alreadyCredited,
    alreadySelected,
    alreadyEnrolled,
    isFull,
    wouldExceedMaximumLoad,
    missingPrerequisiteCodes,
    failedRetakeAllowed,
    hasScheduleConflict,
}: {
    enrollmentHasStarted: boolean;
    enrollmentHasEnded: boolean;
    enrollmentSubmitted: boolean;
    alreadyCompleted: boolean;
    alreadyCredited: boolean;
    alreadySelected: boolean;
    alreadyEnrolled: boolean;
    isFull: boolean;
    wouldExceedMaximumLoad: boolean;
    missingPrerequisiteCodes: string[];
    failedRetakeAllowed: boolean;
    hasScheduleConflict: boolean;
}): CourseEligibility {
    if (enrollmentSubmitted) {
        return {
            canEnroll: false,
            code: "ENROLLMENT_SUBMITTED",
            title: "Enrollment submitted",
            message:
                "Your enrollment has already been submitted and can no longer be changed.",
        };
    }

    if (!enrollmentHasStarted) {
        return {
            canEnroll: false,
            code: "ENROLLMENT_NOT_OPEN",
            title: "Enrollment not yet open",
            message:
                "Enrollment opens on the official enrollment start date.",
        };
    }

    if (enrollmentHasEnded) {
        return {
            canEnroll: false,
            code: "ENROLLMENT_CLOSED",
            title: "Enrollment period ended",
            message:
                "The official enrollment period has already ended.",
        };
    }

    if (alreadyCredited) {
        return {
            canEnroll: false,
            code: "ALREADY_CREDITED",
            title: "Already credited",
            message:
                "You have already received credit for this course.",
        };
    }

    if (alreadyCompleted) {
        return {
            canEnroll: false,
            code: "ALREADY_COMPLETED",
            title: "Already completed",
            message:
                "You have already passed this course.",
        };
    }

    if (alreadyEnrolled) {
        return {
            canEnroll: false,
            code: "ALREADY_ENROLLED",
            title: "Already enrolled",
            message:
                "This course was already successfully enrolled.",
        };
    }

    if (alreadySelected) {
        return {
            canEnroll: false,
            code: "ALREADY_SELECTED",
            title: "Already selected",
            message:
                "This course is already included in your enrollment draft.",
        };
    }

    if (!failedRetakeAllowed) {
        return {
            canEnroll: false,
            code: "FAILED_COURSE_RETAKE_NOT_ALLOWED",
            title: "Retake not yet allowed",
            message:
                "A failed course may only be retaken in the same term number of a later academic year.",
        };
    }

    if (missingPrerequisiteCodes.length > 0) {
        return {
            canEnroll: false,
            code: "MISSING_PREREQUISITES",
            title: "Cannot yet be enlisted",
            message:
                `Complete the following prerequisite${
                    missingPrerequisiteCodes.length > 1
                        ? "s"
                        : ""
                } first: ${missingPrerequisiteCodes.join(", ")}.`,
            missingPrerequisiteCodes,
        };
    }

    if (isFull) {
        return {
            canEnroll: false,
            code: "SECTION_FULL",
            title: "Section full",
            message:
                `This section has reached its maximum capacity of ${MAXIMUM_SECTION_CAPACITY} students.`,
        };
    }

    if (wouldExceedMaximumLoad) {
        return {
            canEnroll: false,
            code: "MAXIMUM_LOAD_EXCEEDED",
            title: "Maximum load exceeded",
            message:
                `Adding this course would exceed the maximum academic load of ${MAXIMUM_ACADEMIC_UNITS} units.`,
        };
    }

    if (hasScheduleConflict) {
        return {
            canEnroll: false,
            code: "SCHEDULE_CONFLICT",
            title: "Schedule conflict",
            message:
                "This section overlaps with the schedule of a course already selected.",
        };
    }

    return {
        canEnroll: true,
        code: "ELIGIBLE",
        title: "Eligible",
        message:
            "You meet the requirements and may enroll in this section.",
    };
}

function getAcademicYearStart(
    academicYear: string,
): number {
    return Number(
        academicYear.match(
            /\d{4}/,
        )?.[0] ?? 0,
    );
}

function canRetakeFailedCourse(
    failedAcademicYear: string,
    failedTermNumber: number,
    offeredAcademicYear: string,
    offeredTermNumber: number,
): boolean {
    return (
        getAcademicYearStart(
            offeredAcademicYear,
        ) >
            getAcademicYearStart(
                failedAcademicYear,
            ) &&
        failedTermNumber ===
            offeredTermNumber
    );
}

function minutesFromTime(
    value: string,
): number {
    const [hours, minutes] =
        value
            .split(":")
            .map(Number);

    return hours * 60 + minutes;
}

function schedulesConflict(
    first: ScheduleEntry[],
    second: ScheduleEntry[],
): boolean {
    for (const firstEntry of first) {
        for (
            const secondEntry of
            second
        ) {
            const sharesDay =
                firstEntry.days.some(
                    (day) =>
                        secondEntry.days.includes(
                            day,
                        ),
                );

            if (!sharesDay) {
                continue;
            }

            const firstStart =
                minutesFromTime(
                    firstEntry.startTime,
                );

            const firstEnd =
                minutesFromTime(
                    firstEntry.endTime,
                );

            const secondStart =
                minutesFromTime(
                    secondEntry.startTime,
                );

            const secondEnd =
                minutesFromTime(
                    secondEntry.endTime,
                );

            if (
                firstStart < secondEnd &&
                secondStart < firstEnd
            ) {
                return true;
            }
        }
    }

    return false;
}

function formatSchedule(
    schedule: ScheduleEntry[],
): string {
    if (schedule.length === 0) {
        return "TBA";
    }

    return schedule
        .map((entry) => {
            const days =
                entry.days
                    .map((day) =>
                        day.slice(0, 3),
                    )
                    .join("/");

            const room =
                entry.room
                    ? ` • ${entry.room}`
                    : "";

            return `${days} ${entry.startTime}-${entry.endTime}${room}`;
        })
        .join(", ");
}

function formatInstructor(
    faculty?: FacultyDocument,
): string {
    if (!faculty) {
        return "TBA";
    }

    return [
        faculty.title,
        faculty.firstName,
        faculty.lastName,
    ]
        .filter(Boolean)
        .join(" ");
}

async function getStudent(
    db: Db,
    authenticatedUserId: string,
    session?: ClientSession,
): Promise<StudentDocument> {
    if (
        !ObjectId.isValid(
            authenticatedUserId,
        )
    ) {
        throw new StudentEnrollmentServiceError(
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
            .findOne(
                {
                    userId:
                        new ObjectId(
                            authenticatedUserId,
                        ),
                    status: "ACTIVE",
                },
                {
                    session,
                },
            );

    if (!student) {
        throw new StudentEnrollmentServiceError(
            "STUDENT_NOT_FOUND",
            "The student record could not be found.",
            404,
        );
    }

    return student;
}

async function getEnrollmentTerm(
    db: Db,
    session?: ClientSession,
): Promise<AcademicTermDocument> {
    const term =
        await db
            .collection<AcademicTermDocument>(
                "academicTerms",
            )
            .findOne(
                {
                    isEnrollmentTerm:
                        true,
                },
                {
                    session,
                },
            );

    if (!term) {
        throw new StudentEnrollmentServiceError(
            "ENROLLMENT_TERM_NOT_CONFIGURED",
            "The enrollment term is not configured.",
            500,
        );
    }

    return term;
}

async function getOrCreateEnrollment(
    db: Db,
    student: StudentDocument,
    term: AcademicTermDocument,
    session: ClientSession,
): Promise<EnrollmentHeaderDocument> {
    const existing =
        await db
            .collection<EnrollmentHeaderDocument>(
                "studentEnrollments",
            )
            .findOne(
                {
                    studentId:
                        student._id,
                    academicTermId:
                        term._id,
                },
                {
                    session,
                },
            );

    if (existing) {
        return existing;
    }

    const now = new Date();

    const enrollment:
        EnrollmentHeaderDocument = {
        _id: new ObjectId(),
        studentId:
            student._id,
        academicTermId:
            term._id,
        status: "DRAFT",
        totalAcademicUnits: 0,
        totalNonAcademicUnits: 0,
        version: 0,
        createdAt: now,
        updatedAt: now,
    };

    try {
        await db
            .collection<EnrollmentHeaderDocument>(
                "studentEnrollments",
            )
            .insertOne(
                enrollment,
                {
                    session,
                },
            );

        return enrollment;
    } catch (error) {
        if (
            error instanceof
                MongoServerError &&
            error.code === 11000
        ) {
            const concurrent =
                await db
                    .collection<EnrollmentHeaderDocument>(
                        "studentEnrollments",
                    )
                    .findOne(
                        {
                            studentId:
                                student._id,
                            academicTermId:
                                term._id,
                        },
                        {
                            session,
                        },
                    );

            if (concurrent) {
                return concurrent;
            }
        }

        throw error;
    }
}

async function getGradeHistory(
    db: Db,
    studentId: ObjectId,
    session?: ClientSession,
): Promise<
    Map<
        string,
        GradeHistoryEntry[]
    >
> {
    const [
        grades,
        completedEnrollments,
    ] = await Promise.all([
        db
            .collection<GradeDocument>(
                "grades",
            )
            .find(
                {
                    studentId,
                    status: "VERIFIED",
                },
                {
                    session,
                },
            )
            .toArray(),

        db
            .collection<{
                _id: ObjectId;
                studentId: ObjectId;
                sectionId: ObjectId;
                academicTermId: ObjectId;
                status: string;
            }>(
                "enrollments",
            )
            .find(
                {
                    studentId,
                    status: "COMPLETED",
                },
                {
                    session,
                },
            )
            .toArray(),
    ]);

    const sectionIdsByValue =
        new Map<string, ObjectId>();

    for (const grade of grades) {
        sectionIdsByValue.set(
            grade.sectionId.toHexString(),
            grade.sectionId,
        );
    }

    for (
        const enrollment of
        completedEnrollments
    ) {
        sectionIdsByValue.set(
            enrollment.sectionId.toHexString(),
            enrollment.sectionId,
        );
    }

    const sectionIds =
        Array.from(
            sectionIdsByValue.values(),
        );

    if (sectionIds.length === 0) {
        return new Map();
    }

    const sections =
        await db
            .collection<SectionDocument>(
                "sections",
            )
            .find(
                {
                    _id: {
                        $in: sectionIds,
                    },
                },
                {
                    session,
                },
            )
            .toArray();

    const termIdsByValue =
        new Map<string, ObjectId>();

    for (const grade of grades) {
        termIdsByValue.set(
            grade.academicTermId.toHexString(),
            grade.academicTermId,
        );
    }

    for (
        const enrollment of
        completedEnrollments
    ) {
        termIdsByValue.set(
            enrollment.academicTermId.toHexString(),
            enrollment.academicTermId,
        );
    }

    const terms =
        await db
            .collection<AcademicTermDocument>(
                "academicTerms",
            )
            .find(
                {
                    _id: {
                        $in: Array.from(
                            termIdsByValue.values(),
                        ),
                    },
                },
                {
                    session,
                },
            )
            .toArray();

    const courseIdsByValue =
        new Map<string, ObjectId>();

    for (const section of sections) {
        courseIdsByValue.set(
            section.courseId.toHexString(),
            section.courseId,
        );
    }

    const courses =
        await db
            .collection<CourseDocument>(
                "courses",
            )
            .find(
                {
                    _id: {
                        $in: Array.from(
                            courseIdsByValue.values(),
                        ),
                    },
                },
                {
                    session,
                },
            )
            .toArray();

    const sectionsById =
        new Map(
            sections.map(
                (section) => [
                    section._id.toHexString(),
                    section,
                ],
            ),
        );

    const termsById =
        new Map(
            terms.map(
                (term) => [
                    term._id.toHexString(),
                    term,
                ],
            ),
        );

    const coursesById =
        new Map(
            courses.map(
                (course) => [
                    course._id.toHexString(),
                    course,
                ],
            ),
        );

    const history =
        new Map<
            string,
            GradeHistoryEntry[]
        >();

    for (const grade of grades) {
        const section =
            sectionsById.get(
                grade.sectionId.toHexString(),
            );

        const term =
            termsById.get(
                grade.academicTermId.toHexString(),
            );

        if (!section || !term) {
            continue;
        }

        const courseId =
            section.courseId.toHexString();

        const entries =
            history.get(courseId) ??
            [];

        entries.push({
            result:
                grade.result,
            academicYear:
                term.academicYear,
            termNumber:
                term.termNumber,
        });

        history.set(
            courseId,
            entries,
        );
    }

    /*
     * Non-academic courses do not normally receive grade
     * documents. Their completion must therefore be derived
     * from the completed enrollment record.
     *
     * Academic courses are intentionally excluded here so a
     * failed academic grade is not incorrectly converted into
     * a passed course merely because its enrollment record is
     * marked COMPLETED.
     */
    for (
        const enrollment of
        completedEnrollments
    ) {
        const section =
            sectionsById.get(
                enrollment.sectionId.toHexString(),
            );

        const term =
            termsById.get(
                enrollment.academicTermId.toHexString(),
            );

        if (!section || !term) {
            continue;
        }

        const courseId =
            section.courseId.toHexString();

        const course =
            coursesById.get(
                courseId,
            );

        if (
            !course ||
            course.academicUnits > 0 ||
            course.nonAcademicUnits <= 0
        ) {
            continue;
        }

        const entries =
            history.get(courseId) ??
            [];

        const alreadyRecorded =
            entries.some(
                (entry) =>
                    entry.result ===
                        "PASSED" ||
                    entry.result ===
                        "CREDITED",
            );

        if (alreadyRecorded) {
            continue;
        }

        entries.push({
            result: "PASSED",
            academicYear:
                term.academicYear,
            termNumber:
                term.termNumber,
        });

        history.set(
            courseId,
            entries,
        );
    }

    return history;
}

async function validateCourseEligibility(
    db: Db,
    student: StudentDocument,
    term: AcademicTermDocument,
    course: CourseDocument,
    gradeHistory: Map<
        string,
        GradeHistoryEntry[]
    >,
    session?: ClientSession,
): Promise<void> {
    const history =
        gradeHistory.get(
            course._id
                .toHexString(),
        ) ?? [];

    if (
        history.some(
            (entry) =>
                entry.result ===
                    "PASSED" ||
                entry.result ===
                    "CREDITED",
        )
    ) {
        throw new StudentEnrollmentServiceError(
            "COURSE_ALREADY_COMPLETED",
            `${course.courseCode} has already been passed or credited.`,
            409,
        );
    }

    const failedAttempts =
        history.filter(
            (entry) =>
                entry.result ===
                "FAILED",
        );

    if (
        failedAttempts.length > 0 &&
        !failedAttempts.some(
            (attempt) =>
                canRetakeFailedCourse(
                    attempt.academicYear,
                    attempt.termNumber,
                    term.academicYear,
                    term.termNumber,
                ),
        )
    ) {
        throw new StudentEnrollmentServiceError(
            "FAILED_COURSE_RETAKE_NOT_ALLOWED",
            `${course.courseCode} may only be retaken in the same term number of a later academic year.`,
            409,
        );
    }

    const prerequisiteCodes =
        course.prerequisiteCodes ??
        [];

    if (
        prerequisiteCodes.length ===
        0
    ) {
        return;
    }

    const prerequisiteCourses =
        await db
            .collection<CourseDocument>(
                "courses",
            )
            .find(
                {
                    curriculumCode:
                        student.curriculumCode,
                    courseCode: {
                        $in:
                            prerequisiteCodes,
                    },
                    status: "ACTIVE",
                },
                {
                    session,
                },
            )
            .toArray();

    const satisfiedCodes =
        new Set<string>();

    for (
        const prerequisiteCourse of
        prerequisiteCourses
    ) {
        const prerequisiteHistory =
            gradeHistory.get(
                prerequisiteCourse._id
                    .toHexString(),
            ) ?? [];

        if (
            prerequisiteHistory.some(
                (entry) =>
                    entry.result ===
                        "PASSED" ||
                    entry.result ===
                        "CREDITED",
            )
        ) {
            satisfiedCodes.add(
                prerequisiteCourse.courseCode,
            );
        }
    }

    const missing =
        prerequisiteCodes.filter(
            (code) =>
                !satisfiedCodes.has(
                    code,
                ),
        );

    if (missing.length > 0) {
        throw new StudentEnrollmentServiceError(
            "PREREQUISITE_NOT_SATISFIED",
            `${course.courseCode} requires ${missing.join(", ")}.`,
            409,
            {
                missingPrerequisites:
                    missing,
            },
        );
    }
}

async function recalculateTotals(
    db: Db,
    enrollmentId: ObjectId,
    session: ClientSession,
): Promise<{
    totalAcademicUnits: number;
    totalNonAcademicUnits: number;
}> {
    const items =
        await db
            .collection<EnrollmentItemDocument>(
                "studentEnrollmentItems",
            )
            .find(
                {
                    enrollmentId,
                },
                {
                    session,
                },
            )
            .toArray();

    return {
        totalAcademicUnits:
            items.reduce(
                (total, item) =>
                    total +
                    item.academicUnits,
                0,
            ),

        totalNonAcademicUnits:
            items.reduce(
                (total, item) =>
                    total +
                    item.nonAcademicUnits,
                0,
            ),
    };
}

async function getEnrollmentItems(
    db: Db,
    enrollmentId: ObjectId,
    session?: ClientSession,
): Promise<EnrollmentItemDocument[]> {
    return db
        .collection<EnrollmentItemDocument>(
            "studentEnrollmentItems",
        )
        .find(
            {
                enrollmentId,
            },
            {
                session,
            },
        )
        .toArray();
}

export async function getStudentEnrollment(
    authenticatedUserId: string,
    query: EnrollmentQuery,
): Promise<StudentEnrollmentResponse> {
    const db = getDatabase();

    const [student, term] =
        await Promise.all([
            getStudent(
                db,
                authenticatedUserId,
            ),
            getEnrollmentTerm(db),
        ]);

    const enrollment =
        await db
            .collection<EnrollmentHeaderDocument>(
                "studentEnrollments",
            )
            .findOne({
                studentId:
                    student._id,
                academicTermId:
                    term._id,
            });

    const items = enrollment
        ? await getEnrollmentItems(
              db,
              enrollment._id,
          )
        : [];

    const submittedGradeDocuments =
        items.length > 0
            ? await db
                  .collection<GradeDocument>(
                      "grades",
                  )
                  .find({
                      studentId:
                          student._id,

                      academicTermId:
                          term._id,

                      sectionId: {
                          $in:
                              items.map(
                                  (item) =>
                                      item.sectionId,
                              ),
                      },

                      status: {
                          $in: [
                              "SUBMITTED",
                              "VERIFIED",
                          ],
                      },

                      finalGradeValue: {
                          $type:
                              "number",
                      },
                  })
                  .toArray()
            : [];

    const submittedSectionIds =
        new Set(
            submittedGradeDocuments.map(
                (grade) =>
                    grade.sectionId.toHexString(),
            ),
        );

    const termGradesFinalized =
        enrollment?.status ===
            "SUBMITTED" &&
        items.length > 0 &&
        items.every(
            (item) =>
                submittedSectionIds.has(
                    item.sectionId.toHexString(),
                ),
        );

    const sections =
        termGradesFinalized
            ? []
            : await db
                  .collection<SectionDocument>(
                      "sections",
                  )
                  .find({
                      academicTermId:
                          term._id,
                      status: "OPEN",
                  })
                  .sort({
                      sectionCode: 1,
                  })
                  .toArray();

    const courseIds =
        sections.map(
            (section) =>
                section.courseId,
        );

    const facultyIds =
        sections
            .map(
                (section) =>
                    section.facultyId,
            )
            .filter(
                (
                    id,
                ): id is ObjectId =>
                    id instanceof
                    ObjectId,
            );

    const [courses, faculty] =
        await Promise.all([
            db
                .collection<CourseDocument>(
                    "courses",
                )
                .find({
                    _id: {
                        $in:
                            courseIds,
                    },
                    curriculumCode:
                        student.curriculumCode,
                    status: "ACTIVE",
                })
                .toArray(),

            facultyIds.length > 0
                ? db
                      .collection<FacultyDocument>(
                          "faculty",
                      )
                      .find({
                          _id: {
                              $in:
                                  facultyIds,
                          },
                      })
                      .toArray()
                : [],
        ]);

    const coursesById =
        new Map(
            courses.map((course) => [
                course._id
                    .toHexString(),
                course,
            ]),
        );

    const facultyById =
        new Map(
            faculty.map((member) => [
                member._id
                    .toHexString(),
                member,
            ]),
        );

    const selectedSectionIds =
        new Set(
            items.map((item) =>
                item.sectionId
                    .toHexString(),
            ),
        );

    const draftItems =
        items.filter(
            (item) =>
                getItemStatus(item) ===
                "DRAFT",
        );

    const enrolledItems =
        items.filter(
            (item) =>
                getItemStatus(item) ===
                "ENROLLED",
        );

    const draftCourseIds =
        new Set(
            draftItems.map((item) =>
                item.courseId.toHexString(),
            ),
        );

    const enrolledCourseIds =
        new Set(
            enrolledItems.map((item) =>
                item.courseId.toHexString(),
            ),
        );

    const gradeHistory =
        await getGradeHistory(
            db,
            student._id,
        );

    const curriculumCourses =
        await db
            .collection<CourseDocument>(
                "courses",
            )
            .find({
                curriculumCode:
                    student.curriculumCode,
                status: "ACTIVE",
            })
            .toArray();

    const curriculumCourseByCode =
        new Map(
            curriculumCourses.map(
                (course) => [
                    course.courseCode,
                    course,
                ],
            ),
        );

    const selectedSections =
        items.length > 0
            ? await db
                  .collection<SectionDocument>(
                      "sections",
                  )
                  .find({
                      _id: {
                          $in:
                              items.map(
                                  (item) =>
                                      item.sectionId,
                              ),
                      },
                  })
                  .toArray()
            : [];

    const open =
        isEnrollmentOpen(term);

    const normalizedSearch =
        query.search
            .trim()
            .toLowerCase();

    const options:
        EnrollmentSectionOption[] = [];

    const offeredCourseIds =
        new Set(
            sections.map(
                (section) =>
                    section.courseId.toHexString(),
            ),
        );

    for (const section of sections) {
        const course =
            coursesById.get(
                section.courseId
                    .toHexString(),
            );

        if (!course) {
            continue;
        }

        const effectiveCapacity =
            Math.min(
                section.capacity,
                MAXIMUM_SECTION_CAPACITY,
            );

        const enrolledCount =
            Math.min(
                Math.max(
                    section.enrolledCount,
                    0,
                ),
                effectiveCapacity,
            );

        const availableSlots =
            Math.max(
                0,
                effectiveCapacity -
                    enrolledCount,
            );

        const currentDate =
            new Date();

        const enrollmentHasStarted =
            currentDate >=
            term.enrollmentStart;

        const enrollmentHasEnded =
            currentDate >
            term.enrollmentEnd;

        const enrollmentSubmitted =
            enrollment?.status ===
            "SUBMITTED";

        const isFull =
            enrolledCount >=
            effectiveCapacity;

        const courseId =
            course._id.toHexString();

        const alreadySelected =
            draftCourseIds.has(
                courseId,
            );

        const alreadyEnrolled =
            enrolledCourseIds.has(
                courseId,
            );

        const courseHistory =
            gradeHistory.get(
                courseId,
            ) ?? [];

        const alreadyCompleted =
            courseHistory.some(
                (entry) =>
                    entry.result ===
                    "PASSED",
            );

        const alreadyCredited =
            courseHistory.some(
                (entry) =>
                    entry.result ===
                    "CREDITED",
            );

        const failedAttempts =
            courseHistory.filter(
                (entry) =>
                    entry.result ===
                    "FAILED",
            );

        if (
            alreadyCompleted ||
            alreadyCredited
        ) {
            continue;
        }

        const failedRetakeAllowed =
            failedAttempts.length === 0 ||
            failedAttempts.some(
                (attempt) =>
                    canRetakeFailedCourse(
                        attempt.academicYear,
                        attempt.termNumber,
                        term.academicYear,
                        term.termNumber,
                    ),
            );

        const missingPrerequisiteCodes =
            (
                course.prerequisiteCodes ??
                []
            ).filter(
                (
                    prerequisiteCode,
                ) => {
                    const prerequisiteCourse =
                        curriculumCourseByCode.get(
                            prerequisiteCode,
                        );

                    if (
                        !prerequisiteCourse
                    ) {
                        return true;
                    }

                    const prerequisiteHistory =
                        gradeHistory.get(
                            prerequisiteCourse._id.toHexString(),
                        ) ?? [];

                    return !prerequisiteHistory.some(
                        (entry) =>
                            entry.result ===
                                "PASSED" ||
                            entry.result ===
                                "CREDITED",
                    );
                },
            );

        if (
            missingPrerequisiteCodes.length >
            0
        ) {
            continue;
        }

        const enrollmentAcademicUnits =
            enrollment
                ?.totalAcademicUnits ??
            items.reduce(
                (total, item) =>
                    total +
                    item.academicUnits,
                0,
            );

        const wouldExceedMaximumLoad =
            enrollmentAcademicUnits +
                course.academicUnits >
            MAXIMUM_ACADEMIC_UNITS;

        /*
         * Practicum uses an arranged deployment schedule,
         * so it must not be disabled by the ordinary
         * classroom schedule-overlap rule.
         */
        const hasScheduleConflict =
            course.category ===
            "PRACTICUM"
                ? false
                : selectedSections.some(
                      (
                          selectedSection,
                      ) =>
                          schedulesConflict(
                              selectedSection.schedule,
                              section.schedule,
                          ),
                  );

        const eligibility =
            getCourseEligibility({
                enrollmentHasStarted,
                enrollmentHasEnded,
                enrollmentSubmitted,
                alreadyCompleted,
                alreadyCredited,
                alreadySelected,
                alreadyEnrolled,
                isFull,
                wouldExceedMaximumLoad,
                missingPrerequisiteCodes,
                failedRetakeAllowed,
                hasScheduleConflict,
            });

        const option:
            EnrollmentSectionOption = {
            sectionId:
                section._id
                    .toHexString(),

            courseId,

            courseCode:
                course.courseCode,

            courseName:
                course.courseName,

            academicUnits:
                course.academicUnits,

            nonAcademicUnits:
                course.nonAcademicUnits,

            sectionCode:
                section.sectionCode,

            instructorName:
                section.facultyId
                    ? formatInstructor(
                          facultyById.get(
                              section.facultyId.toHexString(),
                          ),
                      )
                    : "TBA",

            scheduleLabel:
                formatSchedule(
                    section.schedule,
                ),

            capacity:
                effectiveCapacity,

            enrolledCount,

            availableSlots,

            isFull,

            canEnroll:
                eligibility.canEnroll,

            eligibilityCode:
                eligibility.code,

            eligibilityTitle:
                eligibility.title,

            eligibilityMessage:
                eligibility.message,

            missingPrerequisiteCodes:
                eligibility
                    .missingPrerequisiteCodes,
        };

        const matchesSearch =
            !normalizedSearch ||
            option.courseCode
                .toLowerCase()
                .includes(
                    normalizedSearch,
                ) ||
            option.courseName
                .toLowerCase()
                .includes(
                    normalizedSearch,
                );

        const matchesAvailability =
            query.availability ===
                "ALL" ||
            (query.availability ===
                "OPEN" &&
                !option.isFull) ||
            (query.availability ===
                "FULL" &&
                option.isFull);

        if (
            matchesSearch &&
            matchesAvailability
        ) {
            options.push(option);
        }
    }

    const totalItems =
        options.length;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                totalItems /
                    query.limit,
            ),
        );

    const page = Math.min(
        query.page,
        totalPages,
    );

    const start =
        (page - 1) * query.limit;

    const paginatedOptions =
        options.slice(
            start,
            start + query.limit,
        );

    const itemSectionIds =
        items.map(
            (item) =>
                item.sectionId,
        );

    const itemCourseIds =
        items.map(
            (item) =>
                item.courseId,
        );

    const [itemSections, itemCourses] =
        await Promise.all([
            itemSectionIds.length > 0
                ? db
                      .collection<SectionDocument>(
                          "sections",
                      )
                      .find({
                          _id: {
                              $in:
                                  itemSectionIds,
                          },
                      })
                      .toArray()
                : [],

            itemCourseIds.length > 0
                ? db
                      .collection<CourseDocument>(
                          "courses",
                      )
                      .find({
                          _id: {
                              $in:
                                  itemCourseIds,
                          },
                      })
                      .toArray()
                : [],
        ]);

    const itemSectionsById =
        new Map(
            itemSections.map(
                (section) => [
                    section._id
                        .toHexString(),
                    section,
                ],
            ),
        );

    const itemCoursesById =
        new Map(
            itemCourses.map(
                (course) => [
                    course._id
                        .toHexString(),
                    course,
                ],
            ),
        );

    const summaryItems:
        EnrollmentSummaryItem[] = [];

    for (const item of items) {
        const section =
            itemSectionsById.get(
                item.sectionId
                    .toHexString(),
            );

        const course =
            itemCoursesById.get(
                item.courseId
                    .toHexString(),
            );

        if (!section || !course) {
            continue;
        }

        summaryItems.push({
            itemId:
                item._id
                    .toHexString(),
            sectionId:
                section._id
                    .toHexString(),
            courseId:
                course._id
                    .toHexString(),
            courseCode:
                course.courseCode,
            courseName:
                course.courseName,
            academicUnits:
                item.academicUnits,
            nonAcademicUnits:
                item.nonAcademicUnits,
            sectionCode:
                section.sectionCode,
            instructorName:
                section.facultyId
                    ? formatInstructor(
                          facultyById.get(
                              section.facultyId.toHexString(),
                          ),
                      )
                    : "TBA",
            scheduleLabel:
                formatSchedule(
                    section.schedule,
                ),
            status:
                getItemStatus(item),
            canDrop:
                getItemStatus(item) ===
                    "DRAFT" &&
                open &&
                !termGradesFinalized,
            enrolledAt:
                item.enrolledAt
                    ?.toISOString(),
        });
    }

    const mode =
        termGradesFinalized ||
        !open
            ? "READ_ONLY"
            : enrollment?.status ===
              "SUBMITTED"
            ? "EDITABLE_SUBMITTED"
            : "EDITABLE_DRAFT";

    return {
        term: {
            academicTermId:
                term._id
                    .toHexString(),
            academicYear:
                term.academicYear,
            termNumber:
                term.termNumber,
            name:
                term.name,
            enrollmentStart:
                term.enrollmentStart
                    .toISOString(),
            enrollmentEnd:
                term.enrollmentEnd
                    .toISOString(),
            termStart:
                term.startDate
                    .toISOString(),
            maximumAcademicUnits:
                MAXIMUM_ACADEMIC_UNITS,
            isEnrollmentOpen:
                open &&
                !termGradesFinalized,
        },

        enrollment: {
            enrollmentId:
                enrollment?._id
                    .toHexString(),
            status:
                enrollment?.status,
            mode,
            version:
                enrollment?.version ??
                0,
            submittedAt:
                enrollment?.submittedAt
                    ?.toISOString(),
            totalAcademicUnits:
                termGradesFinalized
                    ? 0
                    : enrollment?.totalAcademicUnits ??
                      0,
            totalNonAcademicUnits:
                termGradesFinalized
                    ? 0
                    : enrollment?.totalNonAcademicUnits ??
                      0,
            items:
                termGradesFinalized
                    ? []
                    : summaryItems,
        },

        availableSections:
            paginatedOptions,

        pagination: {
            page,
            limit:
                query.limit,
            totalItems,
            totalPages,
        },
    };
}

export async function addDraftItem(
    authenticatedUserId: string,
    input: AddDraftItemInput,
): Promise<void> {
    if (
        !ObjectId.isValid(
            input.sectionId,
        )
    ) {
        throw new StudentEnrollmentServiceError(
            "INVALID_SECTION_ID",
            "The selected section ID is invalid.",
            400,
        );
    }

    const db = getDatabase();
    const client =
        getMongoClient();
    const session =
        client.startSession();

    try {
        await session.withTransaction(
            async () => {
                const student =
                    await getStudent(
                        db,
                        authenticatedUserId,
                        session,
                    );

                const term =
                    await getEnrollmentTerm(
                        db,
                        session,
                    );

                if (
                    !isEnrollmentOpen(
                        term,
                    )
                ) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_PERIOD_CLOSED",
                        "The enrollment period has ended.",
                        409,
                    );
                }

                const enrollment =
                    await getOrCreateEnrollment(
                        db,
                        student,
                        term,
                        session,
                    );

                if (
                    enrollment.status ===
                    "SUBMITTED"
                ) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_ALREADY_SUBMITTED",
                        "The enrollment has already been submitted and can no longer be changed.",
                        409,
                    );
                }

                if (
                    enrollment.version !==
                    input.expectedVersion
                ) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_VERSION_CONFLICT",
                        "The enrollment was changed in another tab. Reload and try again.",
                        409,
                    );
                }

                const section =
                    await db
                        .collection<SectionDocument>(
                            "sections",
                        )
                        .findOne(
                            {
                                _id:
                                    new ObjectId(
                                        input.sectionId,
                                    ),
                                academicTermId:
                                    term._id,
                                status: "OPEN",
                            },
                            {
                                session,
                            },
                        );

                if (!section) {
                    throw new StudentEnrollmentServiceError(
                        "SECTION_NOT_AVAILABLE",
                        "The selected section is not available.",
                        409,
                    );
                }

                if (
                    section.enrolledCount >=
                    Math.min(
                        section.capacity,
                        MAXIMUM_SECTION_CAPACITY,
                    )
                ) {
                    throw new StudentEnrollmentServiceError(
                        "SECTION_FULL",
                        "The selected section is already full.",
                        409,
                    );
                }

                const course =
                    await db
                        .collection<CourseDocument>(
                            "courses",
                        )
                        .findOne(
                            {
                                _id:
                                    section.courseId,
                                curriculumCode:
                                    student.curriculumCode,
                                status: "ACTIVE",
                            },
                            {
                                session,
                            },
                        );

                if (!course) {
                    throw new StudentEnrollmentServiceError(
                        "COURSE_NOT_IN_CURRICULUM",
                        "The selected course is not part of the student's curriculum.",
                        409,
                    );
                }

                const items =
                    await getEnrollmentItems(
                        db,
                        enrollment._id,
                        session,
                    );

                const existingCourseItem =
                    items.find((item) =>
                        item.courseId.equals(
                            course._id,
                        ),
                    );

                if (existingCourseItem) {
                    if (
                        getItemStatus(
                            existingCourseItem,
                        ) === "ENROLLED"
                    ) {
                        throw new StudentEnrollmentServiceError(
                            "COURSE_ALREADY_ENROLLED",
                            "The course has already been successfully enrolled.",
                            409,
                        );
                    }

                    throw new StudentEnrollmentServiceError(
                        "DUPLICATE_COURSE",
                        "The course is already included in the enrollment draft.",
                        409,
                    );
                }

                const totalAcademicUnits =
                    items.reduce(
                        (total, item) =>
                            total +
                            item.academicUnits,
                        0,
                    ) +
                    course.academicUnits;

                if (
                    totalAcademicUnits >
                    MAXIMUM_ACADEMIC_UNITS
                ) {
                    throw new StudentEnrollmentServiceError(
                        "MAXIMUM_UNITS_EXCEEDED",
                        `The maximum academic load is ${MAXIMUM_ACADEMIC_UNITS} units.`,
                        409,
                    );
                }

                const existingSections =
                    items.length > 0
                        ? await db
                              .collection<SectionDocument>(
                                  "sections",
                              )
                              .find(
                                  {
                                      _id: {
                                          $in:
                                              items.map(
                                                  (item) =>
                                                      item.sectionId,
                                              ),
                                      },
                                  },
                                  {
                                      session,
                                  },
                              )
                              .toArray()
                        : [];

                if (
                    course.category !==
                        "PRACTICUM" &&
                    existingSections.some(
                        (
                            existingSection,
                        ) =>
                            schedulesConflict(
                                existingSection.schedule,
                                section.schedule,
                            ),
                    )
                ) {
                    throw new StudentEnrollmentServiceError(
                        "SCHEDULE_CONFLICT",
                        "The selected section conflicts with another selected course.",
                        409,
                    );
                }

                const gradeHistory =
                    await getGradeHistory(
                        db,
                        student._id,
                        session,
                    );

                await validateCourseEligibility(
                    db,
                    student,
                    term,
                    course,
                    gradeHistory,
                    session,
                );

                const now =
                    new Date();

                try {
                    await db
                        .collection<EnrollmentItemDocument>(
                            "studentEnrollmentItems",
                        )
                        .insertOne(
                            {
                                _id:
                                    new ObjectId(),
                                enrollmentId:
                                    enrollment._id,
                                studentId:
                                    student._id,
                                academicTermId:
                                    term._id,
                                sectionId:
                                    section._id,
                                courseId:
                                    course._id,
                                academicUnits:
                                    course.academicUnits,
                                nonAcademicUnits:
                                    course.nonAcademicUnits,
                                status:
                                    "DRAFT",
                                createdAt:
                                    now,
                                updatedAt:
                                    now,
                            },
                            {
                                session,
                            },
                        );
                } catch (error) {
                    if (
                        error instanceof
                            MongoServerError &&
                        error.code === 11000
                    ) {
                        throw new StudentEnrollmentServiceError(
                            "DUPLICATE_COURSE",
                            "The course is already included in the enrollment draft.",
                            409,
                        );
                    }

                    throw error;
                }

                const totals =
                    await recalculateTotals(
                        db,
                        enrollment._id,
                        session,
                    );

                const updated =
                    await db
                        .collection<EnrollmentHeaderDocument>(
                            "studentEnrollments",
                        )
                        .updateOne(
                            {
                                _id:
                                    enrollment._id,
                                version:
                                    input.expectedVersion,
                                status: "DRAFT",
                            },
                            {
                                $set: {
                                    totalAcademicUnits:
                                        totals.totalAcademicUnits,
                                    totalNonAcademicUnits:
                                        totals.totalNonAcademicUnits,
                                    updatedAt:
                                        now,
                                },
                                $inc: {
                                    version: 1,
                                },
                            },
                            {
                                session,
                            },
                        );

                if (
                    updated.modifiedCount !==
                    1
                ) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_VERSION_CONFLICT",
                        "The enrollment was changed in another tab. Reload and try again.",
                        409,
                    );
                }
            },
            {
                readConcern: {
                    level: "snapshot",
                },
                writeConcern: {
                    w: "majority",
                },
            },
        );
    } finally {
        await session.endSession();
    }
}

export async function removeDraftItem(
    authenticatedUserId: string,
    itemId: string,
    expectedVersion: number,
): Promise<void> {
    if (!ObjectId.isValid(itemId)) {
        throw new StudentEnrollmentServiceError(
            "INVALID_ITEM_ID",
            "The enrollment item ID is invalid.",
            400,
        );
    }

    const db = getDatabase();
    const client = getMongoClient();
    const session = client.startSession();

    try {
        await session.withTransaction(
            async () => {
                const student = await getStudent(
                    db,
                    authenticatedUserId,
                    session,
                );
                const term = await getEnrollmentTerm(
                    db,
                    session,
                );

                if (!isEnrollmentOpen(term)) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_PERIOD_CLOSED",
                        "The enrollment period has ended.",
                        409,
                    );
                }

                const enrollment = await db
                    .collection<EnrollmentHeaderDocument>(
                        "studentEnrollments",
                    )
                    .findOne(
                        {
                            studentId: student._id,
                            academicTermId: term._id,
                        },
                        { session },
                    );

                if (!enrollment) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_NOT_FOUND",
                        "The enrollment draft could not be found.",
                        404,
                    );
                }

                if (enrollment.status === "SUBMITTED") {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_ALREADY_SUBMITTED",
                        "The enrollment has already been finalized.",
                        409,
                    );
                }

                if (enrollment.version !== expectedVersion) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_VERSION_CONFLICT",
                        "The enrollment was changed in another tab. Reload and try again.",
                        409,
                    );
                }

                const enrollmentItem = await db
                    .collection<EnrollmentItemDocument>(
                        "studentEnrollmentItems",
                    )
                    .findOne(
                        {
                            _id: new ObjectId(itemId),
                            enrollmentId: enrollment._id,
                            studentId: student._id,
                        },
                        { session },
                    );

                if (!enrollmentItem) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_ITEM_NOT_FOUND",
                        "The selected course could not be found.",
                        404,
                    );
                }

                if (
                    getItemStatus(enrollmentItem) ===
                    "ENROLLED"
                ) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLED_COURSE_LOCKED",
                        "A successfully enrolled course can no longer be dropped.",
                        409,
                    );
                }

                const deleted = await db
                    .collection<EnrollmentItemDocument>(
                        "studentEnrollmentItems",
                    )
                    .deleteOne(
                        {
                            _id: enrollmentItem._id,
                            enrollmentId: enrollment._id,
                            studentId: student._id,
                            status: "DRAFT",
                        },
                        { session },
                    );

                if (deleted.deletedCount !== 1) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_ITEM_NOT_FOUND",
                        "The selected draft course could not be removed.",
                        404,
                    );
                }

                const totals = await recalculateTotals(
                    db,
                    enrollment._id,
                    session,
                );

                const updated = await db
                    .collection<EnrollmentHeaderDocument>(
                        "studentEnrollments",
                    )
                    .updateOne(
                        {
                            _id: enrollment._id,
                            version: expectedVersion,
                            status: "DRAFT",
                        },
                        {
                            $set: {
                                totalAcademicUnits:
                                    totals.totalAcademicUnits,
                                totalNonAcademicUnits:
                                    totals.totalNonAcademicUnits,
                                updatedAt: new Date(),
                            },
                            $inc: { version: 1 },
                        },
                        { session },
                    );

                if (updated.modifiedCount !== 1) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_VERSION_CONFLICT",
                        "The enrollment was changed in another tab. Reload and try again.",
                        409,
                    );
                }
            },
            {
                readConcern: { level: "snapshot" },
                writeConcern: { w: "majority" },
            },
        );
    } finally {
        await session.endSession();
    }
}


async function createEnrollmentAnnouncement(
    db: Db,
    session: ClientSession,
    studentId: ObjectId,
    enrollmentId: ObjectId,
    term: AcademicTermDocument,
    publishedAt: Date,
): Promise<void> {
    const eventKey =
        `ENROLLMENT_SUBMITTED:${enrollmentId.toHexString()}`;

    await db
        .collection("announcements")
        .updateOne(
            {
                studentId,
                eventKey,
            },
            {
                $setOnInsert: {
                    audience: "STUDENT",
                    studentId,
                    eventKey,
                    relatedEnrollmentId:
                        enrollmentId,
                    relatedAcademicTermId:
                        term._id,
                    title:
                        "Enrollment submitted",
                    message:
                        `Your enrollment for Term ${term.termNumber}, A.Y. ${term.academicYear} was submitted successfully.`,
                    status:
                        "PUBLISHED",
                    publishedAt,
                    createdAt:
                        publishedAt,
                    updatedAt:
                        publishedAt,
                },
            },
            {
                upsert: true,
                session,
            },
        );
}

export async function submitEnrollment(
    authenticatedUserId: string,
    input: SubmitEnrollmentInput,
): Promise<SubmitEnrollmentResult> {
    let releasePermit:
        | (() => void)
        | undefined;

    try {
        releasePermit =
            await submissionSemaphore.acquire();
    } catch {
        throw new StudentEnrollmentServiceError(
            "ENROLLMENT_SERVICE_BUSY",
            "The enrollment service is handling a high volume of requests. Please try again.",
            503,
        );
    }

    const db = getDatabase();
    const client = getMongoClient();
    const session = client.startSession();

    let realtimeStudentId = "";
    let realtimeFacultyIds: string[] = [];
    let realtimeSectionIds: string[] = [];

    try {
        const result = await session.withTransaction(
            async (): Promise<SubmitEnrollmentResult> => {
                realtimeStudentId = "";
                realtimeFacultyIds = [];
                realtimeSectionIds = [];

                const student = await getStudent(
                    db,
                    authenticatedUserId,
                    session,
                );
                const term = await getEnrollmentTerm(
                    db,
                    session,
                );

                if (!isEnrollmentOpen(term)) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_PERIOD_CLOSED",
                        "The enrollment period has ended.",
                        409,
                    );
                }

                const enrollment = await db
                    .collection<EnrollmentHeaderDocument>(
                        "studentEnrollments",
                    )
                    .findOne(
                        {
                            studentId: student._id,
                            academicTermId: term._id,
                        },
                        { session },
                    );

                if (!enrollment) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_NOT_FOUND",
                        "The enrollment draft could not be found.",
                        404,
                    );
                }

                if (enrollment.status === "SUBMITTED") {
                    if (
                        enrollment.lastIdempotencyKey ===
                        input.idempotencyKey
                    ) {
                        return {
                            outcome: "SUCCESS",
                            message:
                                "Enrollment was already submitted successfully.",
                            submittedCourseCount: 0,
                            rejectedCourseCount: 0,
                            rejectedSections: [],
                        };
                    }

                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_ALREADY_SUBMITTED",
                        "The enrollment has already been finalized.",
                        409,
                    );
                }

                if (
                    enrollment.version !==
                    input.expectedVersion
                ) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_VERSION_CONFLICT",
                        "The enrollment was changed in another tab. Reload and try again.",
                        409,
                    );
                }

                const allItems = await getEnrollmentItems(
                    db,
                    enrollment._id,
                    session,
                );
                const enrolledItems = allItems.filter(
                    (item) =>
                        getItemStatus(item) ===
                        "ENROLLED",
                );
                const draftItems = allItems.filter(
                    (item) =>
                        getItemStatus(item) ===
                        "DRAFT",
                );

                if (draftItems.length === 0) {
                    throw new StudentEnrollmentServiceError(
                        "EMPTY_ENROLLMENT_DRAFT",
                        "Select at least one new course before submitting.",
                        409,
                    );
                }

                const draftSections = await db
                    .collection<SectionDocument>("sections")
                    .find(
                        {
                            _id: {
                                $in: draftItems.map(
                                    (item) => item.sectionId,
                                ),
                            },
                            academicTermId: term._id,
                            status: "OPEN",
                        },
                        { session },
                    )
                    .toArray();

                if (
                    draftSections.length !==
                    draftItems.length
                ) {
                    throw new StudentEnrollmentServiceError(
                        "INVALID_SECTION_SELECTION",
                        "One or more selected sections are unavailable.",
                        409,
                    );
                }

                const allCourses = await db
                    .collection<CourseDocument>("courses")
                    .find(
                        {
                            _id: {
                                $in: allItems.map(
                                    (item) => item.courseId,
                                ),
                            },
                            curriculumCode:
                                student.curriculumCode,
                            status: "ACTIVE",
                        },
                        { session },
                    )
                    .toArray();

                if (allCourses.length !== allItems.length) {
                    throw new StudentEnrollmentServiceError(
                        "COURSE_NOT_IN_CURRICULUM",
                        "One or more selected courses are not part of the student's curriculum.",
                        409,
                    );
                }

                const courseById = new Map(
                    allCourses.map((course) => [
                        course._id.toHexString(),
                        course,
                    ]),
                );
                const itemBySectionId = new Map(
                    draftItems.map((item) => [
                        item.sectionId.toHexString(),
                        item,
                    ]),
                );

                const gradeHistory = await getGradeHistory(
                    db,
                    student._id,
                    session,
                );

                for (const item of draftItems) {
                    const course = courseById.get(
                        item.courseId.toHexString(),
                    );
                    if (!course) {
                        throw new StudentEnrollmentServiceError(
                            "COURSE_NOT_IN_CURRICULUM",
                            "A selected course could not be found.",
                            409,
                        );
                    }
                    await validateCourseEligibility(
                        db,
                        student,
                        term,
                        course,
                        gradeHistory,
                        session,
                    );
                }

                const previouslyEnrolledSections =
                    enrolledItems.length > 0
                        ? await db
                              .collection<SectionDocument>(
                                  "sections",
                              )
                              .find(
                                  {
                                      _id: {
                                          $in: enrolledItems.map(
                                              (item) =>
                                                  item.sectionId,
                                          ),
                                      },
                                  },
                                  { session },
                              )
                              .toArray()
                        : [];

                const sortedSections = [
                    ...draftSections,
                ].sort((first, second) => {
                    const firstItem =
                        itemBySectionId.get(
                            first._id.toHexString(),
                        );
                    const secondItem =
                        itemBySectionId.get(
                            second._id.toHexString(),
                        );
                    const difference =
                        (firstItem?.createdAt.getTime() ?? 0) -
                        (secondItem?.createdAt.getTime() ?? 0);
                    return difference !== 0
                        ? difference
                        : first._id
                              .toHexString()
                              .localeCompare(
                                  second._id.toHexString(),
                              );
                });

                const acceptedSectionIds: ObjectId[] = [];
                const acceptedSections: SectionDocument[] = [
                    ...previouslyEnrolledSections,
                ];
                const rejectedSections:
                    RejectedEnrollmentSection[] = [];

                for (const section of sortedSections) {
                    const item = itemBySectionId.get(
                        section._id.toHexString(),
                    );
                    const course = courseById.get(
                        section.courseId.toHexString(),
                    );

                    if (!item || !course) {
                        throw new StudentEnrollmentServiceError(
                            "INVALID_SECTION_SELECTION",
                            "A selected section could not be matched to its course.",
                            409,
                        );
                    }

                    const conflictingSection =
                        course.category === "PRACTICUM"
                            ? undefined
                            : acceptedSections.find(
                                  (acceptedSection) => {
                                      const acceptedCourse =
                                          courseById.get(
                                              acceptedSection.courseId.toHexString(),
                                          );
                                      return (
                                          acceptedCourse?.category !==
                                              "PRACTICUM" &&
                                          schedulesConflict(
                                              acceptedSection.schedule,
                                              section.schedule,
                                          )
                                      );
                                  },
                              );

                    if (conflictingSection) {
                        rejectedSections.push({
                            itemId: item._id.toHexString(),
                            sectionId:
                                section._id.toHexString(),
                            sectionCode:
                                section.sectionCode,
                            courseId:
                                course._id.toHexString(),
                            courseCode:
                                course.courseCode,
                            courseName:
                                course.courseName,
                            reason: "SCHEDULE_CONFLICT",
                        });
                        continue;
                    }

                    const reserved = await db
                        .collection<SectionDocument>(
                            "sections",
                        )
                        .updateOne(
                            {
                                _id: section._id,
                                academicTermId: term._id,
                                status: "OPEN",
                                enrolledCount: {
                                    $lt:
                                        MAXIMUM_SECTION_CAPACITY,
                                },
                                $expr: {
                                    $lt: [
                                        "$enrolledCount",
                                        {
                                            $min: [
                                                "$capacity",
                                                MAXIMUM_SECTION_CAPACITY,
                                            ],
                                        },
                                    ],
                                },
                            },
                            {
                                $inc: { enrolledCount: 1 },
                            },
                            { session },
                        );

                    if (reserved.modifiedCount === 1) {
                        acceptedSectionIds.push(
                            section._id,
                        );
                        acceptedSections.push(section);
                        continue;
                    }

                    rejectedSections.push({
                        itemId: item._id.toHexString(),
                        sectionId:
                            section._id.toHexString(),
                        sectionCode: section.sectionCode,
                        courseId:
                            course._id.toHexString(),
                        courseCode: course.courseCode,
                        courseName: course.courseName,
                        reason: "SECTION_FULL",
                    });
                }

                const now = new Date();

                if (rejectedSections.length > 0) {
                    await db
                        .collection<EnrollmentItemDocument>(
                            "studentEnrollmentItems",
                        )
                        .deleteMany(
                            {
                                enrollmentId:
                                    enrollment._id,
                                status: "DRAFT",
                                sectionId: {
                                    $in: rejectedSections.map(
                                        (rejected) =>
                                            new ObjectId(
                                                rejected.sectionId,
                                            ),
                                    ),
                                },
                            },
                            { session },
                        );
                }

                if (acceptedSectionIds.length > 0) {
                    const acceptedUpdate = await db
                        .collection<EnrollmentItemDocument>(
                            "studentEnrollmentItems",
                        )
                        .updateMany(
                            {
                                enrollmentId:
                                    enrollment._id,
                                status: "DRAFT",
                                sectionId: {
                                    $in: acceptedSectionIds,
                                },
                            },
                            {
                                $set: {
                                    status: "ENROLLED",
                                    enrolledAt: now,
                                    updatedAt: now,
                                },
                            },
                            { session },
                        );

                    if (
                        acceptedUpdate.modifiedCount !==
                        acceptedSectionIds.length
                    ) {
                        throw new StudentEnrollmentServiceError(
                            "ENROLLMENT_ITEM_UPDATE_CONFLICT",
                            "One or more accepted courses could not be locked.",
                            409,
                        );
                    }
                }

                const totals = await recalculateTotals(
                    db,
                    enrollment._id,
                    session,
                );

                if (
                    totals.totalAcademicUnits >
                    MAXIMUM_ACADEMIC_UNITS
                ) {
                    throw new StudentEnrollmentServiceError(
                        "MAXIMUM_UNITS_EXCEEDED",
                        `The maximum academic load is ${MAXIMUM_ACADEMIC_UNITS} units.`,
                        409,
                    );
                }

                const isPartialSuccess =
                    acceptedSectionIds.length > 0 &&
                    rejectedSections.length > 0;
                const isCompleteSuccess =
                    acceptedSectionIds.length > 0 &&
                    rejectedSections.length === 0;
                const nextStatus:
                    EnrollmentHeaderDocument["status"] =
                    isCompleteSuccess
                        ? "SUBMITTED"
                        : "DRAFT";

                const updateDocument: Record<
                    string,
                    unknown
                > = {
                    status: nextStatus,
                    totalAcademicUnits:
                        totals.totalAcademicUnits,
                    totalNonAcademicUnits:
                        totals.totalNonAcademicUnits,
                    updatedAt: now,
                    lastIdempotencyKey:
                        input.idempotencyKey,
                };

                if (isCompleteSuccess) {
                    updateDocument.submittedAt = now;
                }

                const updated = await db
                    .collection<EnrollmentHeaderDocument>(
                        "studentEnrollments",
                    )
                    .updateOne(
                        {
                            _id: enrollment._id,
                            version:
                                input.expectedVersion,
                            status: "DRAFT",
                        },
                        {
                            $set: updateDocument,
                            $inc: { version: 1 },
                        },
                        { session },
                    );

                if (updated.modifiedCount !== 1) {
                    throw new StudentEnrollmentServiceError(
                        "ENROLLMENT_VERSION_CONFLICT",
                        "The enrollment was changed in another tab. Reload and try again.",
                        409,
                    );
                }

                await db
                    .collection<StudentDocument>("students")
                    .updateOne(
                        { _id: student._id },
                        {
                            $set: {
                                enrolledUnits:
                                    totals.totalAcademicUnits,
                                enrolledNonAcademicUnits:
                                    totals.totalNonAcademicUnits,
                                updatedAt: now,
                            },
                        },
                        { session },
                    );

                if (isCompleteSuccess) {
                    await createEnrollmentAnnouncement(
                        db,
                        session,
                        student._id,
                        enrollment._id,
                        term,
                        now,
                    );
                }

                if (acceptedSectionIds.length > 0) {
                    const acceptedSectionIdSet =
                        new Set(
                            acceptedSectionIds.map(
                                (sectionId) =>
                                    sectionId.toHexString(),
                            ),
                        );

                    realtimeStudentId =
                        student._id.toHexString();
                    realtimeSectionIds =
                        acceptedSectionIds.map(
                            (sectionId) =>
                                sectionId.toHexString(),
                        );
                    realtimeFacultyIds =
                        Array.from(
                            new Set(
                                draftSections
                                    .filter(
                                        (section) =>
                                            acceptedSectionIdSet.has(
                                                section._id.toHexString(),
                                            ),
                                    )
                                    .flatMap(
                                        (section) =>
                                            section.facultyId
                                                ? [
                                                      section.facultyId.toHexString(),
                                                  ]
                                                : [],
                                    ),
                            ),
                        );
                }

                if (acceptedSectionIds.length === 0) {
                    return {
                        outcome: "ALL_SECTIONS_FULL",
                        message:
                            "None of the selected courses could be enrolled. Select other available sections and try again.",
                        submittedCourseCount: 0,
                        rejectedCourseCount:
                            rejectedSections.length,
                        rejectedSections,
                    };
                }

                if (isPartialSuccess) {
                    const rejectedDescriptions =
                        rejectedSections
                            .map((section) => {
                                const reason =
                                    section.reason ===
                                    "SECTION_FULL"
                                        ? "section full"
                                        : "schedule conflict";
                                return `${section.courseCode} (${section.sectionCode}) — ${reason}`;
                            })
                            .join(", ");

                    return {
                        outcome: "PARTIAL_SUCCESS",
                        message:
                            `${acceptedSectionIds.length} course${acceptedSectionIds.length === 1 ? " was" : "s were"} enrolled successfully. The following course${rejectedSections.length === 1 ? " was" : "s were"} removed: ${rejectedDescriptions}. You may add replacement courses and submit again.`,
                        submittedCourseCount:
                            acceptedSectionIds.length,
                        rejectedCourseCount:
                            rejectedSections.length,
                        rejectedSections,
                    };
                }

                return {
                    outcome: "SUCCESS",
                    message:
                        "Enrollment submitted successfully.",
                    submittedCourseCount:
                        acceptedSectionIds.length,
                    rejectedCourseCount: 0,
                    rejectedSections: [],
                };
            },
            {
                readConcern: { level: "snapshot" },
                writeConcern: { w: "majority" },
            },
        );

        if (!result) {
            throw new StudentEnrollmentServiceError(
                "ENROLLMENT_SUBMISSION_FAILED",
                "The enrollment submission did not return a result.",
                500,
            );
        }

        if (
            realtimeStudentId &&
            realtimeSectionIds.length > 0
        ) {
            await publishEnrollmentUpdated({
                studentId:
                    realtimeStudentId,
                facultyIds:
                    realtimeFacultyIds,
                sectionIds:
                    realtimeSectionIds,
            });
        }

        return result;
    } catch (error) {
        if (
            error instanceof MongoServerError &&
            error.hasErrorLabel(
                "TransientTransactionError",
            )
        ) {
            throw new StudentEnrollmentServiceError(
                "ENROLLMENT_TRANSACTION_RETRY",
                "A temporary enrollment conflict occurred. Please try again.",
                409,
            );
        }

        throw error;
    } finally {
        await session.endSession();
        releasePermit?.();
    }
}