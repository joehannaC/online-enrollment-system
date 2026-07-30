import {
    ObjectId,
    type Document,
} from "mongodb";

import { getDatabase } from "../config/database.js";
import type {
    AcademicTermSummary,
    FacultyDashboardResponse,
    FacultyProfileSummary,
    FacultySubject,
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
        this.name = "FacultyDashboardError";
    }
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
    faculty: Document,
): string {
    return [
        faculty.title,
        faculty.firstName,
        faculty.middleName,
        faculty.lastName,
    ]
        .filter(Boolean)
        .join(" ");
}

function mapFaculty(
    faculty: Document,
): FacultyProfileSummary {
    return {
        id: faculty._id.toString(),
        employeeNumber:
            faculty.employeeNumber,
        title: faculty.title,

        firstName: faculty.firstName,
        middleName: faculty.middleName,
        lastName: faculty.lastName,

        fullName:
            faculty.fullName ??
            buildFullName(faculty),

        department: faculty.department,
        college: faculty.college,
    };
}

function mapAcademicTerm(
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
    value: unknown,
): ScheduleItem[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((item) => ({
        days: Array.isArray(item.days)
            ? item.days.map(String)
            : [],
        startTime: String(
            item.startTime ?? "",
        ),
        endTime: String(
            item.endTime ?? "",
        ),
        room: String(item.room ?? "TBA"),
    }));
}

function normalizeGradeStatus(
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

function getDaysRemaining(
    deadline: Date,
): number {
    const today = new Date();

    const startOfToday = Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );

    const startOfDeadline = Date.UTC(
        deadline.getFullYear(),
        deadline.getMonth(),
        deadline.getDate(),
    );

    return Math.ceil(
        (startOfDeadline - startOfToday) /
            86_400_000,
    );
}

function getDeadlineStatus(
    daysRemaining: number,
): "UPCOMING" | "DUE_SOON" | "OVERDUE" {
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
    const database = getDatabase();

    const userId = toObjectId(
        authenticatedUserId,
        "Authenticated user ID",
    );

    const [faculty, currentTerm] =
        await Promise.all([
            database
                .collection("faculty")
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

    if (!faculty) {
        throw new FacultyDashboardError(
            "FACULTY_NOT_FOUND",
            "No active faculty profile was found for the authenticated account.",
            404,
        );
    }

    if (!currentTerm) {
        throw new FacultyDashboardError(
            "CURRENT_TERM_NOT_FOUND",
            "No active academic term is currently configured.",
            503,
        );
    }

    const sections = await database
        .collection("sections")
        .find({
            facultyId: faculty._id,
            academicTermId: currentTerm._id,
            status: {
                $in: ["OPEN", "CLOSED"],
            },
        })
        .sort({
            sectionCode: 1,
        })
        .toArray();

    const courseIds = sections.map(
        (section) => section.courseId,
    );

    const sectionIds = sections.map(
        (section) => section._id,
    );

    const [
        courses,
        enrollments,
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

        sectionIds.length > 0
            ? database
                  .collection("enrollments")
                  .find({
                      sectionId: {
                          $in: sectionIds,
                      },
                      academicTermId:
                          currentTerm._id,
                      status: "ENROLLED",
                  })
                  .toArray()
            : [],

        sectionIds.length > 0
            ? database
                  .collection("grades")
                  .find({
                      sectionId: {
                          $in: sectionIds,
                      },
                      academicTermId:
                          currentTerm._id,
                      facultyId: faculty._id,
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
                          $in: sectionIds,
                      },
                      academicTermId:
                          currentTerm._id,
                      facultyId: faculty._id,
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

    const enrollmentsBySection = new Map<
        string,
        number
    >();

    for (const enrollment of enrollments) {
        const sectionId =
            enrollment.sectionId.toString();

        enrollmentsBySection.set(
            sectionId,
            (enrollmentsBySection.get(
                sectionId,
            ) ?? 0) + 1,
        );
    }

    const gradedBySection = new Map<
        string,
        number
    >();

    for (const grade of grades) {
        const hasCompleteGrade =
            grade.result !== "PENDING" &&
            grade.result !== "INCOMPLETE" &&
            grade.status !== "DRAFT";

        if (!hasCompleteGrade) {
            continue;
        }

        const sectionId =
            grade.sectionId.toString();

        gradedBySection.set(
            sectionId,
            (gradedBySection.get(
                sectionId,
            ) ?? 0) + 1,
        );
    }

    const submissionMap = new Map(
        submissions.map((submission) => [
            submission.sectionId.toString(),
            submission,
        ]),
    );

    const handledSubjects: FacultySubject[] =
    sections.flatMap((section) => {
        const course = courseMap.get(
            section.courseId.toString(),
        );

        if (!course) {
            return [];
        }

        const sectionId =
            section._id.toString();

        const enrolledStudents =
            enrollmentsBySection.get(
                sectionId,
            ) ?? 0;

        if (enrolledStudents === 0) {
            return [];
        }

        const gradedStudents =
            gradedBySection.get(
                sectionId,
            ) ?? 0;

        const submission =
            submissionMap.get(sectionId);

        return [
            {
                sectionId,
                sectionCode:
                    section.sectionCode,

                courseId:
                    course._id.toString(),
                courseCode:
                    course.courseCode,
                courseName:
                    course.courseName,

                schedule:
                    normalizeSchedule(
                        section.schedule,
                    ),

                enrolledStudents,
                gradedStudents,

                pendingGrades: Math.max(
                    enrolledStudents -
                        gradedStudents,
                    0,
                ),

                submissionStatus:
                    normalizeGradeStatus(
                        submission?.status,
                    ),
            },
        ];
    });

    const handledSubjectCount =
        handledSubjects.length;

    const enrolledStudentCount =
        handledSubjects.reduce(
            (total, subject) =>
                total +
                subject.enrolledStudents,
            0,
        );

    const pendingGradeCount =
        handledSubjects.reduce(
            (total, subject) =>
                total + subject.pendingGrades,
            0,
        );

    const gradedStudentCount =
        handledSubjects.reduce(
            (total, subject) =>
                total + subject.gradedStudents,
            0,
        );

    const submissionPercentage =
        enrolledStudentCount === 0
            ? 0
            : Math.round(
                  (gradedStudentCount /
                      enrolledStudentCount) *
                      100,
              );

    const upcomingDeadlines: FacultyDashboardResponse["upcomingDeadlines"] =
        [];

    if (
        currentTerm.gradeSubmissionDeadline
    ) {
        const deadline =
            currentTerm.gradeSubmissionDeadline instanceof
            Date
                ? currentTerm.gradeSubmissionDeadline
                : new Date(
                      currentTerm.gradeSubmissionDeadline,
                  );

        const daysRemaining =
            getDaysRemaining(deadline);

        upcomingDeadlines.push({
            id: `${currentTerm._id.toString()}-final-grades`,
            title:
                "Final grade submission",
            deadline:
                deadline.toISOString(),
            daysRemaining,
            status:
                getDeadlineStatus(
                    daysRemaining,
                ),
        });
    }

    return {
        faculty: mapFaculty(faculty),
        currentTerm:
            mapAcademicTerm(currentTerm),

        summary: {
            handledSubjectCount,
            enrolledStudentCount,
            pendingGradeCount,
            submissionPercentage,
        },

        handledSubjects,
        upcomingDeadlines,
    };
}