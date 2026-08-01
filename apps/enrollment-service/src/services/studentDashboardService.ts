import {
    ObjectId,
    type Document,
} from "mongodb";

import {
    getDatabase,
} from "../config/database.js";

import type {
    AcademicTermSummary,
    AnnouncementItem,
    RegisteredCourse,
    ScheduleItem,
    StudentDashboardResponse,
    StudentProfileSummary,
    StudentScheduleEntry,
} from "../types/studentDashboard.types.js";

export class StudentDashboardError extends Error {
    constructor(
        public readonly code:
            string,

        message:
            string,

        public readonly statusCode:
            number,
    ) {
        super(message);

        this.name =
            "StudentDashboardError";
    }
}

function toObjectId(
    value: string,
    fieldName: string,
): ObjectId {
    if (
        !ObjectId.isValid(
            value,
        )
    ) {
        throw new StudentDashboardError(
            "INVALID_IDENTIFIER",
            `${fieldName} is invalid.`,
            400,
        );
    }

    return new ObjectId(
        value,
    );
}

function buildFullName(
    student: Document,
): string {
    return [
        student.firstName,
        student.middleName,
        student.lastName,
    ]
        .filter(Boolean)
        .join(" ");
}

function mapStudent(
    student: Document,
): StudentProfileSummary {
    return {
        id:
            student._id.toString(),

        studentNumber:
            String(
                student.studentNumber,
            ),

        firstName:
            String(
                student.firstName,
            ),

        middleName:
            student.middleName
                ? String(
                      student.middleName,
                  )
                : undefined,

        lastName:
            String(
                student.lastName,
            ),

        fullName:
            student.fullName
                ? String(
                      student.fullName,
                  )
                : buildFullName(
                      student,
                  ),

        programCode:
            String(
                student.programCode,
            ),

        programName:
            String(
                student.programName,
            ),

        curriculumCode:
            String(
                student.curriculumCode,
            ),

        college:
            String(
                student.college,
            ),

        campus:
            String(
                student.campus,
            ),

        yearLevel:
            Number(
                student.yearLevel ??
                    0,
            ),

        requiredUnits:
            Number(
                student.requiredUnits ??
                    0,
            ),
    };
}

function mapTerm(
    term: Document,
): AcademicTermSummary {
    return {
        id:
            term._id.toString(),

        code:
            String(
                term.code,
            ),

        name:
            String(
                term.name,
            ),

        academicYear:
            String(
                term.academicYear,
            ),

        termNumber:
            Number(
                term.termNumber,
            ),

        status:
            term.status,

        isCurrent:
            Boolean(
                term.isCurrent,
            ),
    };
}

function normalizeSchedule(
    schedule: unknown,
): ScheduleItem[] {
    if (
        !Array.isArray(
            schedule,
        )
    ) {
        return [];
    }

    return schedule.map(
        (item) => ({
            days:
                Array.isArray(
                    item.days,
                )
                    ? item.days.map(
                          (day) =>
                              String(
                                  day,
                              )
                                  .trim()
                                  .toUpperCase(),
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

function getTodayName(): string {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday:
                "long",

            timeZone:
                "Asia/Manila",
        },
    )
        .format(
            new Date(),
        )
        .toUpperCase();
}

function getAcademicUnits(
    course: Document,
    enrollmentItem?: Document,
    enrollment?: Document,
): number {
    const value =
        enrollmentItem
            ?.academicUnits ??
        enrollment
            ?.academicUnits ??
        course.academicUnits ??
        course.units ??
        0;

    const parsed =
        Number(value);

    return Number.isFinite(
        parsed,
    )
        ? parsed
        : 0;
}

function getNonAcademicUnits(
    course: Document,
    enrollmentItem?: Document,
    enrollment?: Document,
): number {
    const value =
        enrollmentItem
            ?.nonAcademicUnits ??
        enrollment
            ?.nonAcademicUnits ??
        course.nonAcademicUnits ??
        0;

    const parsed =
        Number(value);

    return Number.isFinite(
        parsed,
    )
        ? parsed
        : 0;
}

export async function getStudentDashboard(
    authenticatedUserId: string,
): Promise<StudentDashboardResponse> {
    const database =
        getDatabase();

    const userId =
        toObjectId(
            authenticatedUserId,
            "Authenticated user ID",
        );

    const [
        student,
        currentTerm,
        enrollmentTerm,
    ] = await Promise.all([
        database
            .collection(
                "students",
            )
            .findOne({
                userId,
                status:
                    "ACTIVE",
            }),

        database
            .collection(
                "academicTerms",
            )
            .findOne({
                isCurrent:
                    true,

                status:
                    "ACTIVE",
            }),

        database
            .collection(
                "academicTerms",
            )
            .findOne({
                isEnrollmentTerm:
                    true,
            }),
    ]);

    if (!student) {
        throw new StudentDashboardError(
            "STUDENT_NOT_FOUND",
            "No active student profile was found for the authenticated account.",
            404,
        );
    }

    if (
        !currentTerm &&
        !enrollmentTerm
    ) {
        throw new StudentDashboardError(
            "ACADEMIC_TERM_NOT_FOUND",
            "No current or enrollment academic term is configured.",
            503,
        );
    }

    const enrollmentHeader =
        enrollmentTerm
            ? await database
                  .collection(
                      "studentEnrollments",
                  )
                  .findOne(
                      {
                          studentId:
                              student._id,

                          academicTermId:
                              enrollmentTerm._id,

                          status: {
                              $in: [
                                  "DRAFT",
                                  "SUBMITTED",
                              ],
                          },
                      },
                      {
                          sort: {
                              updatedAt:
                                  -1,

                              createdAt:
                                  -1,
                          },
                      },
                  )
            : null;

    const enrollmentItems =
        enrollmentHeader
            ? await database
                  .collection(
                      "studentEnrollmentItems",
                  )
                  .find({
                      enrollmentId:
                          enrollmentHeader._id,

                      studentId:
                          student._id,

                      academicTermId:
                          enrollmentHeader.academicTermId,
                  })
                  .sort({
                      createdAt:
                          1,
                  })
                  .toArray()
            : [];

    const relevantTermIds =
        [
            currentTerm?._id,
            enrollmentTerm?._id,
        ].filter(
            (
                value,
            ): value is ObjectId =>
                value instanceof
                ObjectId,
        );

    const finalEnrollments =
        relevantTermIds.length ===
        0
            ? []
            : await database
                  .collection(
                      "enrollments",
                  )
                  .find({
                      studentId:
                          student._id,

                      academicTermId: {
                          $in:
                              relevantTermIds,
                      },

                      status: {
                          $in: [
                              "ENROLLED",
                              "REGISTERED",
                          ],
                      },
                  })
                  .sort({
                      enrolledAt:
                          1,

                      registeredAt:
                          1,

                      createdAt:
                          1,
                  })
                  .toArray();

    const sectionIdMap =
        new Map<
            string,
            ObjectId
        >();

    for (
        const enrollment of
        finalEnrollments
    ) {
        if (
            enrollment.sectionId instanceof
            ObjectId
        ) {
            sectionIdMap.set(
                enrollment.sectionId.toHexString(),
                enrollment.sectionId,
            );
        }
    }

    for (
        const item of
        enrollmentItems
    ) {
        if (
            item.sectionId instanceof
            ObjectId
        ) {
            sectionIdMap.set(
                item.sectionId.toHexString(),
                item.sectionId,
            );
        }
    }

    const sectionIds =
        Array.from(
            sectionIdMap.values(),
        );

    const sections =
        sectionIds.length ===
        0
            ? []
            : await database
                  .collection(
                      "sections",
                  )
                  .find({
                      _id: {
                          $in:
                              sectionIds,
                      },
                  })
                  .toArray();

    const courseIdMap =
        new Map<
            string,
            ObjectId
        >();

    for (
        const section of
        sections
    ) {
        if (
            section.courseId instanceof
            ObjectId
        ) {
            courseIdMap.set(
                section.courseId.toHexString(),
                section.courseId,
            );
        }
    }

    const courseIds =
        Array.from(
            courseIdMap.values(),
        );

    const courses =
        courseIds.length ===
        0
            ? []
            : await database
                  .collection(
                      "courses",
                  )
                  .find({
                      _id: {
                          $in:
                              courseIds,
                      },
                  })
                  .toArray();

    const sectionMap =
        new Map(
            sections.map(
                (section) => [
                    section._id.toString(),
                    section,
                ],
            ),
        );

    const courseMap =
        new Map(
            courses.map(
                (course) => [
                    course._id.toString(),
                    course,
                ],
            ),
        );

    const registeredCourseMap =
        new Map<
            string,
            RegisteredCourse
        >();

    if (
        enrollmentHeader
    ) {
        const draftStatus:
            | "REGISTERED"
            | "IN_PROGRESS" =
            enrollmentHeader.status ===
            "SUBMITTED"
                ? "IN_PROGRESS"
                : "REGISTERED";

        for (
            const item of
            enrollmentItems
        ) {
            const section =
                sectionMap.get(
                    item.sectionId.toString(),
                );

            if (!section) {
                continue;
            }

            const course =
                courseMap.get(
                    section.courseId.toString(),
                );

            if (!course) {
                continue;
            }

            registeredCourseMap.set(
                course._id.toString(),
                {
                    enrollmentId:
                        item._id.toString(),

                    sectionId:
                        section._id.toString(),

                    courseCode:
                        String(
                            course.courseCode,
                        ),

                    courseName:
                        String(
                            course.courseName,
                        ),

                    units:
                        getAcademicUnits(
                            course,
                            item,
                        ),

                    nonAcademicUnits:
                        getNonAcademicUnits(
                            course,
                            item,
                        ),

                    sectionCode:
                        String(
                            section.sectionCode,
                        ),

                    schedule:
                        normalizeSchedule(
                            section.schedule,
                        ),

                    enrollmentStatus:
                        draftStatus,
                },
            );
        }
    }

    for (
        const enrollment of
        finalEnrollments
    ) {
        const section =
            sectionMap.get(
                enrollment.sectionId.toString(),
            );

        if (!section) {
            continue;
        }

        const course =
            courseMap.get(
                section.courseId.toString(),
            );

        if (!course) {
            continue;
        }

        registeredCourseMap.set(
            course._id.toString(),
            {
                enrollmentId:
                    enrollment._id.toString(),

                sectionId:
                    section._id.toString(),

                courseCode:
                    String(
                        course.courseCode,
                    ),

                courseName:
                    String(
                        course.courseName,
                    ),

                units:
                    getAcademicUnits(
                        course,
                        undefined,
                        enrollment,
                    ),

                nonAcademicUnits:
                    getNonAcademicUnits(
                        course,
                        undefined,
                        enrollment,
                    ),

                sectionCode:
                    String(
                        section.sectionCode,
                    ),

                schedule:
                    normalizeSchedule(
                        section.schedule,
                    ),

                enrollmentStatus:
                    enrollment.status ===
                    "REGISTERED"
                        ? "REGISTERED"
                        : "IN_PROGRESS",
            },
        );
    }

    const registeredCourses =
        Array.from(
            registeredCourseMap.values(),
        ).sort(
            (
                first,
                second,
            ) =>
                first.courseCode.localeCompare(
                    second.courseCode,
                ),
        );

    const registeredUnits =
        registeredCourses.reduce(
            (
                total,
                course,
            ) =>
                total +
                Number(
                    course.units ??
                        0,
                ),
            0,
        );

    const registeredNonAcademicUnits =
        registeredCourses.reduce(
            (
                total,
                course,
            ) =>
                total +
                Number(
                    course.nonAcademicUnits ??
                        0,
                ),
            0,
        );

    const today =
        getTodayName();

    const todaySchedule:
        StudentScheduleEntry[] =
        registeredCourses
            .flatMap(
                (course) =>
                    course.schedule
                        .filter(
                            (
                                scheduleItem,
                            ) =>
                                scheduleItem.days.includes(
                                    today,
                                ),
                        )
                        .map(
                            (
                                scheduleItem,
                            ) => ({
                                enrollmentId:
                                    course.enrollmentId,

                                sectionId:
                                    course.sectionId,

                                courseCode:
                                    course.courseCode,

                                courseName:
                                    course.courseName,

                                sectionCode:
                                    course.sectionCode,

                                day:
                                    today,

                                startTime:
                                    scheduleItem.startTime,

                                endTime:
                                    scheduleItem.endTime,

                                room:
                                    scheduleItem.room,
                            }),
                        ),
            )
            .sort(
                (
                    first,
                    second,
                ) =>
                    first.startTime.localeCompare(
                        second.startTime,
                    ),
            );

    const announcementDocuments =
        await database
            .collection(
                "announcements",
            )
            .find({
                audience: {
                    $in: [
                        "STUDENT",
                        "ALL",
                    ],
                },

                status:
                    "PUBLISHED",

                $or: [
                    {
                        expiresAt: {
                            $exists:
                                false,
                        },
                    },

                    {
                        expiresAt:
                            null,
                    },

                    {
                        expiresAt: {
                            $gte:
                                new Date(),
                        },
                    },
                ],
            })
            .sort({
                publishedAt:
                    -1,
            })
            .limit(5)
            .toArray();

    const announcements:
        AnnouncementItem[] =
        announcementDocuments.map(
            (announcement) => ({
                id:
                    announcement._id.toString(),

                title:
                    String(
                        announcement.title,
                    ),

                message:
                    String(
                        announcement.message,
                    ),

                publishedAt:
                    announcement
                        .publishedAt instanceof
                    Date
                        ? announcement
                              .publishedAt
                              .toISOString()
                        : String(
                              announcement
                                  .publishedAt,
                          ),
            }),
        );

    const displayedTerm =
        enrollmentItems.length >
            0 &&
        enrollmentTerm
            ? enrollmentTerm
            : currentTerm ??
              enrollmentTerm;

    if (!displayedTerm) {
        throw new StudentDashboardError(
            "ACADEMIC_TERM_NOT_FOUND",
            "The dashboard academic term could not be resolved.",
            503,
        );
    }

    return {
        student:
            mapStudent(
                student,
            ),

        currentTerm:
            mapTerm(
                displayedTerm,
            ),

        summary: {
            registeredCourseCount:
                registeredCourses.length,

            registeredUnits,

            registeredNonAcademicUnits,
        },

        registeredCourses,
        todaySchedule,
        announcements,
    };
}