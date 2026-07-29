import {
    ObjectId,
    type Document,
} from "mongodb";

import { getDatabase } from "../config/database.js";
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
        public readonly code: string,
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "StudentDashboardError";
    }
}

function toObjectId(
    value: string,
    fieldName: string,
): ObjectId {
    if (!ObjectId.isValid(value)) {
        throw new StudentDashboardError(
            "INVALID_IDENTIFIER",
            `${fieldName} is invalid.`,
            400,
        );
    }

    return new ObjectId(value);
}

function buildFullName(student: Document): string {
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
        id: student._id.toString(),
        studentNumber: student.studentNumber,

        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        fullName:
            student.fullName ??
            buildFullName(student),

        programCode: student.programCode,
        programName: student.programName,
        curriculumCode: student.curriculumCode,

        college: student.college,
        campus: student.campus,
        yearLevel: student.yearLevel,
        requiredUnits: student.requiredUnits,
    };
}

function mapCurrentTerm(
    term: Document,
): AcademicTermSummary {
    return {
        id: term._id.toString(),
        code: term.code,
        name: term.name,
        academicYear: term.academicYear,
        termNumber: term.termNumber,
        status: term.status,
        isCurrent: term.isCurrent,
    };
}

function normalizeSchedule(
    schedule: unknown,
): ScheduleItem[] {
    if (!Array.isArray(schedule)) {
        return [];
    }

    return schedule.map((item) => ({
        days: Array.isArray(item.days)
            ? item.days.map(String)
            : [],
        startTime: String(item.startTime ?? ""),
        endTime: String(item.endTime ?? ""),
        room: String(item.room ?? "TBA"),
    }));
}

function getTodayName(): string {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "Asia/Manila",
    })
        .format(new Date())
        .toUpperCase();
}

export async function getStudentDashboard(
    authenticatedUserId: string,
): Promise<StudentDashboardResponse> {
    const database = getDatabase();

    const userId = toObjectId(
        authenticatedUserId,
        "Authenticated user ID",
    );

    const [student, currentTerm] =
        await Promise.all([
            database
                .collection("students")
                .findOne({
                    userId,
                    status: "ACTIVE",
                }),

            database
                .collection("academicTerms")
                .findOne({
                    isCurrent: true,
                    status: "ACTIVE",
                }),
        ]);

    if (!student) {
        throw new StudentDashboardError(
            "STUDENT_NOT_FOUND",
            "No active student profile was found for the authenticated account.",
            404,
        );
    }

    if (!currentTerm) {
        throw new StudentDashboardError(
            "CURRENT_TERM_NOT_FOUND",
            "No active academic term is currently configured.",
            503,
        );
    }

    const enrollmentDocuments = await database
        .collection("enrollments")
        .find({
            studentId: student._id,
            academicTermId: currentTerm._id,
            status: {
                $in: [
                    "ENROLLED",
                    "ENLISTED",
                ],
            },
        })
        .sort({
            enrolledAt: 1,
            createdAt: 1,
        })
        .toArray();

    const sectionIds = enrollmentDocuments.map(
        (enrollment) => enrollment.sectionId,
    );

    const sections =
        sectionIds.length === 0
            ? []
            : await database
                  .collection("sections")
                  .find({
                      _id: {
                          $in: sectionIds,
                      },
                  })
                  .toArray();

    const courseIds = sections.map(
        (section) => section.courseId,
    );

    const courses =
        courseIds.length === 0
            ? []
            : await database
                  .collection("courses")
                  .find({
                      _id: {
                          $in: courseIds,
                      },
                  })
                  .toArray();

    const sectionMap = new Map(
        sections.map((section) => [
            section._id.toString(),
            section,
        ]),
    );

    const courseMap = new Map(
        courses.map((course) => [
            course._id.toString(),
            course,
        ]),
    );

    const registeredCourses: RegisteredCourse[] =
        enrollmentDocuments.flatMap(
            (enrollment) => {
                const section = sectionMap.get(
                    enrollment.sectionId.toString(),
                );

                if (!section) {
                    return [];
                }

                const course = courseMap.get(
                    section.courseId.toString(),
                );

                if (!course) {
                    return [];
                }

                return [
                    {
                        enrollmentId:
                            enrollment._id.toString(),
                        sectionId:
                            section._id.toString(),

                        courseCode:
                            course.courseCode,
                        courseName:
                            course.courseName,
                        units:
                            course.units ??
                            course.academicUnits ??
                            0,
                        sectionCode:
                            section.sectionCode,

                        schedule:
                            normalizeSchedule(
                                section.schedule,
                            ),

                        enrollmentStatus:
                            enrollment.status,
                    },
                ];
            },
        );

    const registeredUnits =
        registeredCourses.reduce(
            (total, course) =>
                total + course.units,
            0,
        );

    const today = getTodayName();

    const todaySchedule: StudentScheduleEntry[] =
        registeredCourses
            .flatMap((course) =>
                course.schedule
                    .filter((scheduleItem) =>
                        scheduleItem.days.includes(
                            today,
                        ),
                    )
                    .map((scheduleItem) => ({
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

                        day: today,
                        startTime:
                            scheduleItem.startTime,
                        endTime:
                            scheduleItem.endTime,
                        room: scheduleItem.room,
                    })),
            )
            .sort((first, second) =>
                first.startTime.localeCompare(
                    second.startTime,
                ),
            );

    const announcementDocuments = await database
        .collection("announcements")
        .find({
            audience: {
                $in: [
                    "STUDENT",
                    "ALL",
                ],
            },
            status: "PUBLISHED",
            $or: [
                {
                    expiresAt: {
                        $exists: false,
                    },
                },
                {
                    expiresAt: null,
                },
                {
                    expiresAt: {
                        $gte: new Date(),
                    },
                },
            ],
        })
        .sort({
            publishedAt: -1,
        })
        .limit(5)
        .toArray();

    const announcements: AnnouncementItem[] =
        announcementDocuments.map(
            (announcement) => ({
                id: announcement._id.toString(),
                title: announcement.title,
                message: announcement.message,
                publishedAt:
                    announcement.publishedAt instanceof
                    Date
                        ? announcement.publishedAt.toISOString()
                        : String(
                              announcement.publishedAt,
                          ),
            }),
        );

    return {
        student: mapStudent(student),
        currentTerm:
            mapCurrentTerm(currentTerm),

        summary: {
            registeredCourseCount:
                registeredCourses.length,
            registeredUnits,
        },

        registeredCourses,
        todaySchedule,
        announcements,
    };
}