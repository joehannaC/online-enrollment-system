"use client";

import {
    CircleAlert,
    CircleCheck,
    Save,
    Send,
    X,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import ConfirmationModal from "@/components/common/ConfirmationModal";
import {
    Button,
    EmptyState,
    LoadingSkeleton,
    Select,
    ServiceUnavailable,
    StatusBadge,
} from "@/components/common";
import {
    GradeEntryMobileCard,
    GradeEntryTable,
} from "@/components/faculty";
import {
    PageContainer,
} from "@/components/layout";
import {
    FacultyApiError,
    getFacultyGradeEntry,
    saveFacultyGradeDraft,
    submitFacultyGrades,
} from "@/lib/api/facultyApi";
import {
    clearAuthSession,
} from "@/lib/auth/tokenStorage";
import {
    completeGradeComponentsSchema,
    gradeComponentsSchema,
} from "@/lib/validators/facultyGradeEntrySchemas";
import type {
    GradeComponents,
    GradeEntryPageResponse,
    GradeEntryStudent,
} from "@/types";

type Notification = {
    type:
        | "SUCCESS"
        | "ERROR";
    title: string;
    message: string;
};

function hasCompleteGradeComponents(
    components: GradeComponents,
): boolean {
    const scores = [
        components.activitiesScore,
        components.majorOutput1Score,
        components.majorOutput2Score,
        components.midtermExamScore,
        components.finalExamScore,
    ];

    return scores.every(
        (score) =>
            typeof score === "number" &&
            Number.isFinite(score) &&
            score >= 0 &&
            score <= 100,
    );
}

function computeGrade(
    components:
        GradeComponents,
): {
    rawFinalGrade?: number;
    finalGradeValue?: number;
} {
    const parsed =
        completeGradeComponentsSchema.safeParse(
            components,
        );

    if (!parsed.success) {
        return {};
    }

    const raw =
        (
            Number(
                components.activitiesScore,
            ) *
                0.2 +
            Number(
                components.majorOutput1Score,
            ) *
                0.2 +
            Number(
                components.majorOutput2Score,
            ) *
                0.2 +
            Number(
                components.midtermExamScore,
            ) *
                0.2 +
            Number(
                components.finalExamScore,
            ) *
                0.2
        );

    const rawFinalGrade =
        Math.round(raw * 100) /
        100;

    let finalGradeValue =
        0.0;

    if (rawFinalGrade >= 90) {
        finalGradeValue = 4.0;
    } else if (
        rawFinalGrade >= 85
    ) {
        finalGradeValue = 3.5;
    } else if (
        rawFinalGrade >= 80
    ) {
        finalGradeValue = 3.0;
    } else if (
        rawFinalGrade >= 75
    ) {
        finalGradeValue = 2.5;
    } else if (
        rawFinalGrade >= 70
    ) {
        finalGradeValue = 2.0;
    } else if (
        rawFinalGrade >= 65
    ) {
        finalGradeValue = 1.5;
    } else if (
        rawFinalGrade >= 60
    ) {
        finalGradeValue = 1.0;
    }

    return {
        rawFinalGrade,
        finalGradeValue,
    };
}

interface LocalGradeDraftStudent {
    studentId: string;
    components: GradeComponents;
}

interface LocalGradeDraft {
    students: LocalGradeDraftStudent[];
    savedAt: string;
}

function getLocalDraftKey(
    sectionId: string,
): string {
    return `faculty-grade-draft:${sectionId}`;
}

function saveLocalDraft(
    sectionId: string,
    students: GradeEntryStudent[],
): void {
    const draft: LocalGradeDraft = {
        students:
            students.map(
                (student) => ({
                    studentId:
                        student.studentId,
                    components:
                        student.components,
                }),
            ),
        savedAt:
            new Date().toISOString(),
    };

    window.localStorage.setItem(
        getLocalDraftKey(
            sectionId,
        ),
        JSON.stringify(
            draft,
        ),
    );
}

function removeLocalDraft(
    sectionId: string,
): void {
    window.localStorage.removeItem(
        getLocalDraftKey(
            sectionId,
        ),
    );
}

function loadLocalDraft(
    sectionId: string,
): LocalGradeDraft | null {
    const stored =
        window.localStorage.getItem(
            getLocalDraftKey(
                sectionId,
            ),
        );

    if (!stored) {
        return null;
    }

    try {
        const parsed =
            JSON.parse(
                stored,
            ) as LocalGradeDraft;

        if (
            !Array.isArray(
                parsed.students,
            )
        ) {
            removeLocalDraft(
                sectionId,
            );

            return null;
        }

        return parsed;
    } catch {
        removeLocalDraft(
            sectionId,
        );

        return null;
    }
}

export default function FacultyGradeEntryPage() {
    const router =
        useRouter();

    const searchParams =
        useSearchParams();

    const requestedSectionId =
        searchParams.get(
            "sectionId",
        ) ?? undefined;

    const [
        data,
        setData,
    ] =
        useState<GradeEntryPageResponse | null>(
            null,
        );

    const [
        students,
        setStudents,
    ] =
        useState<
            GradeEntryStudent[]
        >([]);

    const [
        errors,
        setErrors,
    ] =
        useState<
            Record<
                string,
                string
            >
        >({});

    const [
        notification,
        setNotification,
    ] =
        useState<Notification | null>(
            null,
        );

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        isSaving,
        setIsSaving,
    ] = useState(false);

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const [
        isSubmitModalOpen,
        setIsSubmitModalOpen,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        hasUnsavedChanges,
        setHasUnsavedChanges,
    ] = useState(false);

    const autosaveTimeout =
        useRef<
            ReturnType<
                typeof setTimeout
            > | null
        >(null);

    const saveInProgressRef =
        useRef(false);

    const loadGradeEntry =
        useCallback(
            async (
                sectionId?: string,
                signal?: AbortSignal,
            ): Promise<void> => {
                setIsLoading(true);
                setErrorMessage("");

                try {
                    const response =
                        await getFacultyGradeEntry(
                            sectionId,
                            signal,
                        );

                    setData(
                        response,
                    );

                    const selectedSection =
                        response.selectedSection;

                    const localDraft =
                        selectedSection &&
                        selectedSection
                            .submissionStatus !==
                            "SUBMITTED"
                            ? loadLocalDraft(
                                  selectedSection
                                      .sectionId,
                              )
                            : null;

                    if (
                        selectedSection
                            ?.submissionStatus ===
                        "SUBMITTED"
                    ) {
                        removeLocalDraft(
                            selectedSection
                                .sectionId,
                        );
                    }

                    const localComponentsByStudentId =
                        new Map(
                            localDraft?.students.map(
                                (student) => [
                                    student.studentId,
                                    student.components,
                                ],
                            ) ?? [],
                        );

                    const restoredStudents =
                        response.students.map(
                            (student) => {
                                const localComponents =
                                    localComponentsByStudentId.get(
                                        student.studentId,
                                    );

                                if (!localComponents) {
                                    return student;
                                }

                                return {
                                    ...student,
                                    components:
                                        localComponents,
                                    ...computeGrade(
                                        localComponents,
                                    ),
                                };
                            },
                        );

                    setStudents(
                        restoredStudents,
                    );

                    setHasUnsavedChanges(
                        Boolean(
                            localDraft &&
                                selectedSection
                                    ?.submissionStatus !==
                                    "SUBMITTED",
                        ),
                    );

                    setErrors({});
                } catch (error) {
                    if (
                        error instanceof
                            DOMException &&
                        error.name ===
                            "AbortError"
                    ) {
                        return;
                    }

                    if (
                        error instanceof
                            FacultyApiError &&
                        error.status ===
                            401
                    ) {
                        clearAuthSession();

                        router.replace(
                            "/login",
                        );

                        return;
                    }

                    setErrorMessage(
                        error instanceof
                            Error
                            ? error.message
                            : "The grade entry page could not be loaded.",
                    );
                } finally {
                    if (
                        !signal?.aborted
                    ) {
                        setIsLoading(
                            false,
                        );
                    }
                }
            },
            [
                router,
            ],
        );

    useEffect(() => {
        const controller =
            new AbortController();

        void loadGradeEntry(
            requestedSectionId,
            controller.signal,
        );

        return () => {
            controller.abort();
        };
    }, [
        loadGradeEntry,
        requestedSectionId,
    ]);

    useEffect(() => {
        if (!notification) {
            return;
        }

        const timeout =
            window.setTimeout(
                () => {
                    setNotification(
                        null,
                    );
                },
                5000,
            );

        return () => {
            window.clearTimeout(
                timeout,
            );
        };
    }, [
        notification,
    ]);

    const completedCount =
    useMemo(
        () =>
            students.filter(
                (student) =>
                    hasCompleteGradeComponents(
                        student.components,
                    ),
            ).length,
        [students],
    );

    const allStudentsGraded =
        students.length > 0 &&
        completedCount ===
            students.length;

    const submitted =
        data?.selectedSection
            ?.submissionStatus ===
        "SUBMITTED";

    const saveDraft =
        useCallback(
            async (
                showNotification:
                    boolean,
            ): Promise<boolean> => {
                if (
                    !data
                        ?.selectedSection ||
                    submitted ||
                    isSaving ||
                    saveInProgressRef.current
                ) {
                    return false;
                }

                const validationErrors:
                    Record<
                        string,
                        string
                    > = {};

                for (
                    const student of
                    students
                ) {
                    const result =
                        gradeComponentsSchema.safeParse(
                            student.components,
                        );

                    if (!result.success) {
                        for (
                            const issue of
                            result.error
                                .issues
                        ) {
                            const key =
                                `${student.studentId}.${issue.path.join(
                                    ".",
                                )}`;

                            validationErrors[
                                key
                            ] =
                                issue.message;
                        }
                    }
                }

                setErrors(
                    validationErrors,
                );

                if (
                    Object.keys(
                        validationErrors,
                    ).length > 0
                ) {
                    if (
                        showNotification
                    ) {
                        setNotification({
                            type:
                                "ERROR",
                            title:
                                "Draft not saved",
                            message:
                                "Correct the invalid scores before saving.",
                        });
                    }

                    return false;
                }

                saveInProgressRef.current =
                    true;

                setIsSaving(true);

                try {
                    const result =
                        await saveFacultyGradeDraft(
                            {
                                sectionId:
                                    data
                                        .selectedSection
                                        .sectionId,
                                grades:
                                    students.map(
                                        (
                                            student,
                                        ) => ({
                                            gradeId:
                                                student.gradeId,
                                            studentId:
                                                student.studentId,
                                            expectedVersion:
                                                student.version,
                                            components:
                                                student.components,
                                        }),
                                    ),
                            },
                        );

                    const sectionId =
                        data
                            .selectedSection
                            .sectionId;

                    removeLocalDraft(
                        sectionId,
                    );

                    setHasUnsavedChanges(
                        false,
                    );

                    await loadGradeEntry(
                        sectionId,
                    );

                    if (
                        showNotification
                    ) {
                        setNotification({
                            type:
                                "SUCCESS",
                            title:
                                "Draft saved",
                            message:
                                `${result.savedCount} student grade records were saved successfully.`,
                        });
                    }

                    return true;
                } catch (error) {
                    const isVersionConflict =
                        error instanceof
                            FacultyApiError &&
                        error.code ===
                            "GRADE_VERSION_CONFLICT";

                    if (
                        isVersionConflict &&
                        data
                            ?.selectedSection
                    ) {
                        const sectionId =
                            data
                                .selectedSection
                                .sectionId;

                        removeLocalDraft(
                            sectionId,
                        );

                        setHasUnsavedChanges(
                            false,
                        );

                        await loadGradeEntry(
                            sectionId,
                        );
                    }

                    if (showNotification) {
                        setNotification({
                            type:
                                "ERROR",
                            title:
                                "Draft not saved",
                            message:
                                isVersionConflict
                                    ? "The latest grade record was reloaded. Please enter the changes again."
                                    : error instanceof
                                          Error
                                      ? error.message
                                      : "The grade draft could not be saved.",
                        });
                    }

                    return false;
                } finally {
                    saveInProgressRef.current =
                        false;

                    setIsSaving(
                        false,
                    );
                }
            },
            [
                data,
                isSaving,
                loadGradeEntry,
                students,
                submitted,
            ],
        );

    useEffect(() => {
        if (
            !hasUnsavedChanges ||
            submitted
        ) {
            return;
        }

        if (
            autosaveTimeout.current
        ) {
            clearTimeout(
                autosaveTimeout.current,
            );
        }

        autosaveTimeout.current =
            setTimeout(
                () => {
                    void saveDraft(
                        false,
                    );
                },
                2000,
            );

        return () => {
            if (
                autosaveTimeout.current
            ) {
                clearTimeout(
                    autosaveTimeout.current,
                );
            }
        };
    }, [
        hasUnsavedChanges,
        saveDraft,
        submitted,
    ]);

    function updateStudent(
        studentId: string,
        components:
            GradeComponents,
    ): void {
        const validation =
            gradeComponentsSchema.safeParse(
                components,
            );

        setStudents((current) => {
            const updated =
                current.map((student) => {
                    if (
                        student.studentId !==
                        studentId
                    ) {
                        return student;
                    }

                    return {
                        ...student,
                        components,
                        ...computeGrade(
                            components,
                        ),
                    };
                });

            if (
                data?.selectedSection
                    ?.sectionId &&
                !submitted
            ) {
                saveLocalDraft(
                    data.selectedSection
                        .sectionId,
                    updated,
                );
            }

            return updated;
        });

        setErrors(
            (current) => {
                const next = {
                    ...current,
                };

                for (
                    const key of
                    Object.keys(next)
                ) {
                    if (
                        key.startsWith(
                            `${studentId}.`,
                        )
                    ) {
                        delete next[
                            key
                        ];
                    }
                }

                if (
                    !validation.success
                ) {
                    for (
                        const issue of
                        validation.error
                            .issues
                    ) {
                        next[
                            `${studentId}.${issue.path.join(
                                ".",
                            )}`
                        ] =
                            issue.message;
                    }
                }

                return next;
            },
        );

        setHasUnsavedChanges(
            true,
        );
    }

    async function confirmSubmit(): Promise<void> {
        if (
            !data
                ?.selectedSection ||
            isSubmitting
        ) {
            return;
        }

        const validationErrors:
            Record<
                string,
                string
            > = {};

        for (
            const student of
            students
        ) {
            const result =
                completeGradeComponentsSchema.safeParse(
                    student.components,
                );

            if (!result.success) {
                for (
                    const issue of
                    result.error
                        .issues
                ) {
                    validationErrors[
                        `${student.studentId}.${issue.path.join(
                            ".",
                        )}`
                    ] =
                        issue.message;
                }
            }
        }

        setErrors(
            validationErrors,
        );

        if (
            Object.keys(
                validationErrors,
            ).length > 0
        ) {
            setIsSubmitModalOpen(
                false,
            );

            setNotification({
                type:
                    "ERROR",
                title:
                    "Submission unsuccessful",
                message:
                    "Complete all five grade components for every student before submitting.",
            });

            return;
        }

        setIsSubmitting(true);

        try {
            if (
                hasUnsavedChanges
            ) {
                const saved =
                    await saveDraft(
                        false,
                    );

                if (!saved) {
                    throw new Error(
                        "The latest grade changes could not be saved.",
                    );
                }
            }

            const result =
                await submitFacultyGrades(
                    data
                        .selectedSection
                        .sectionId,
                );

            setIsSubmitModalOpen(
                false,
            );

            removeLocalDraft(
                data
                    .selectedSection
                    .sectionId,
            );

            setHasUnsavedChanges(
                false,
            );

            setNotification({
                type:
                    "SUCCESS",
                title:
                    "Grades submitted",
                message:
                    `${result.completedCount} student grades were submitted successfully.`,
            });

            await loadGradeEntry(
                data
                    .selectedSection
                    .sectionId,
            );
        } catch (error) {
            setIsSubmitModalOpen(
                false,
            );

            setNotification({
                type:
                    "ERROR",
                title:
                    "Submission unsuccessful",
                message:
                    error instanceof
                        Error
                        ? error.message
                        : "The grades could not be submitted.",
            });
        } finally {
            setIsSubmitting(
                false,
            );
        }
    }

    if (
        errorMessage &&
        !data
    ) {
        return (
            <ServiceUnavailable
                serviceName="Grade Service"
                title="Grade entry unavailable"
                description={
                    errorMessage
                }
                onRetry={() => {
                    void loadGradeEntry(
                        requestedSectionId,
                    );
                }}
            />
        );
    }

    return (
        <PageContainer>
            <div className="space-y-5">
                <header>
                    <h1 className="font-serif text-3xl font-semibold text-[#35822E] sm:text-4xl">
                        Grade Entry
                    </h1>

                    <p className="mt-1 text-sm text-neutral-600">
                        Input, validate, save, and submit student grades for a selected class.
                    </p>
                </header>

                {isLoading ? (
                    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <LoadingSkeleton className="h-6 w-60" />
                        <LoadingSkeleton className="mt-3 h-4 w-96 max-w-full" />
                    </section>
                ) : data &&
                  data.subjects.length >
                      0 ? (
                    <section className="rounded-xl border border-[#35822E]/50 bg-white p-4 shadow-sm sm:p-5">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
                            <div>
                                <h2 className="text-lg font-semibold text-neutral-900">
                                    {
                                        data
                                            .selectedSection
                                            ?.courseName
                                    }
                                </h2>

                                <p className="mt-1 text-sm text-neutral-600">
                                    {
                                        data
                                            .selectedSection
                                            ?.courseCode
                                    }{" "}
                                    • Section{" "}
                                    {
                                        data
                                            .selectedSection
                                            ?.sectionCode
                                    }{" "}
                                    •{" "}
                                    {
                                        data
                                            .selectedSection
                                            ?.scheduleLabel
                                    }{" "}
                                    •{" "}
                                    {
                                        data
                                            .selectedSection
                                            ?.room
                                    }
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <StatusBadge variant="primary">
                                        {
                                            data
                                                .selectedSection
                                                ?.totalStudents
                                        }{" "}
                                        students
                                    </StatusBadge>

                                    <StatusBadge
                                        variant={
                                            completedCount ===
                                            students.length
                                                ? "success"
                                                : "warning"
                                        }
                                    >
                                        {
                                            completedCount
                                        }{" "}
                                        /{" "}
                                        {
                                            students.length
                                        }{" "}
                                        graded
                                    </StatusBadge>

                                    {submitted ? (
                                        <StatusBadge variant="success">
                                            Submitted
                                        </StatusBadge>
                                    ) : null}
                                </div>
                            </div>

                            <Select
                                label="Select subject"
                                name="sectionId"
                                value={
                                    data
                                        .selectedSection
                                        ?.sectionId ??
                                    ""
                                }
                                disabled={
                                    isSaving ||
                                    isSubmitting
                                }
                                onChange={(
                                    event,
                                ) => {
                                    const sectionId =
                                        event
                                            .target
                                            .value;

                                    router.replace(
                                        `/faculty/grade-entry?sectionId=${sectionId}`,
                                    );
                                }}
                                options={
                                    data.subjects.map(
                                        (
                                            subject,
                                        ) => ({
                                            label:
                                                `${subject.courseCode} • ${subject.sectionCode}`,
                                            value:
                                                subject.sectionId,
                                        }),
                                    )
                                }
                            />
                        </div>
                    </section>
                ) : (
                    <EmptyState
                        icon={
                            CircleAlert
                        }
                        title="No subjects available"
                        description="No handled sections currently have successfully enrolled students."
                    />
                )}

                {data
                    ?.selectedSection ? (
                    <>
                        <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-800">
                                    Enter every component as a score out of 100.
                                </p>

                                <p className="mt-1 text-xs text-neutral-500">
                                    {completedCount} of{" "}
                                    {
                                        students.length
                                    }{" "}
                                    student grades completed
                                    {data.lastSavedAt
                                        ? ` • Last saved ${new Date(
                                              data.lastSavedAt,
                                          ).toLocaleTimeString(
                                              "en-PH",
                                              {
                                                  hour:
                                                      "numeric",
                                                  minute:
                                                      "2-digit",
                                              },
                                          )}`
                                        : ""}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    variant="outline"
                                    leftIcon={
                                        Save
                                    }
                                    disabled={
                                        submitted ||
                                        isSaving ||
                                        isSubmitting
                                    }
                                    onClick={() => {
                                        void saveDraft(
                                            true,
                                        );
                                    }}
                                >
                                    {isSaving
                                        ? "Saving..."
                                        : "Save Draft"}
                                </Button>

                                <Button
                                    leftIcon={
                                        Send
                                    }
                                    disabled={
                                        submitted ||
                                        isSaving ||
                                        isSubmitting ||
                                        !allStudentsGraded
                                    }
                                    title={
                                        !allStudentsGraded
                                            ? "Complete all student grades before submitting."
                                            : undefined
                                    }
                                    onClick={() => {
                                        setIsSubmitModalOpen(
                                            true,
                                        );
                                    }}
                                >
                                    Submit Grades
                                </Button>
                            </div>
                        </section>

                        <div className="hidden lg:block">
                            <GradeEntryTable
                                students={
                                    students
                                }
                                disabled={
                                    submitted ||
                                    isSaving ||
                                    isSubmitting
                                }
                                errors={
                                    errors
                                }
                                onChange={
                                    updateStudent
                                }
                            />
                        </div>

                        <div className="space-y-4 lg:hidden">
                            {students.map(
                                (
                                    student,
                                ) => (
                                    <GradeEntryMobileCard
                                        key={
                                            student.studentId
                                        }
                                        student={
                                            student
                                        }
                                        disabled={
                                            submitted ||
                                            isSaving ||
                                            isSubmitting
                                        }
                                        errors={
                                            errors
                                        }
                                        onChange={
                                            updateStudent
                                        }
                                    />
                                ),
                            )}
                        </div>
                    </>
                ) : null}
            </div>

            {notification ? (
                <div
                    role={
                        notification.type ===
                        "SUCCESS"
                            ? "status"
                            : "alert"
                    }
                    aria-live={
                        notification.type ===
                        "SUCCESS"
                            ? "polite"
                            : "assertive"
                    }
                    className={[
                        "fixed right-4 top-16 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border bg-white p-4 shadow-2xl sm:right-6 sm:top-20",
                        notification.type ===
                        "SUCCESS"
                            ? "border-green-200"
                            : "border-red-200",
                    ].join(
                        " ",
                    )}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className={[
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                notification.type ===
                                "SUCCESS"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                            ].join(
                                " ",
                            )}
                        >
                            {notification.type ===
                            "SUCCESS" ? (
                                <CircleCheck className="h-5 w-5" />
                            ) : (
                                <CircleAlert className="h-5 w-5" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold text-neutral-900">
                                {
                                    notification.title
                                }
                            </h2>

                            <p className="mt-1 text-sm leading-5 text-neutral-600">
                                {
                                    notification.message
                                }
                            </p>
                        </div>

                        <button
                            type="button"
                            aria-label="Close notification"
                            onClick={() => {
                                setNotification(
                                    null,
                                );
                            }}
                            className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ) : null}

            <ConfirmationModal
                isOpen={
                    isSubmitModalOpen
                }
                title="Submit final grades?"
                description="Are you sure you want to submit these grades? Once submitted, changes are no longer permitted."
                confirmLabel="Yes, submit grades"
                isLoading={
                    isSubmitting
                }
                onClose={() => {
                    if (
                        !isSubmitting
                    ) {
                        setIsSubmitModalOpen(
                            false,
                        );
                    }
                }}
                onConfirm={() => {
                    void confirmSubmit();
                }}
            />
        </PageContainer>
    );
}