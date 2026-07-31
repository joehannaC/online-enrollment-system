export type AcademicGradeResult =
    | "PASSED"
    | "FAILED"
    | "CREDITED";

export type AcademicGradeStatus =
    | "DRAFT"
    | "SUBMITTED"
    | "VERIFIED";

export interface AcademicGradeInput {
    academicUnits: number;

    /**
     * Raw percentage from 0 to 100.
     *
     * When provided, the calculator derives
     * the correct GPE using the official scale.
     */
    rawPercentage?: number | null;

    /**
     * Stored GPE value.
     *
     * This is used only when rawPercentage is
     * unavailable.
     */
    finalGradeValue?: number | null;

    result:
        AcademicGradeResult;

    status:
        AcademicGradeStatus;
}

export interface AcademicSummary {
    currentGpa: number | null;

    earnedAcademicUnits: number;

    gpaAcademicUnits: number;

    totalGradePoints: number;

    creditedAcademicUnits: number;

    failedAcademicUnits: number;

    verifiedAcademicUnits: number;
}

export interface NormalizedAcademicGrade {
    academicUnits: number;

    rawPercentage:
        number | null;

    finalGradeValue: number;

    result:
        AcademicGradeResult;

    status:
        AcademicGradeStatus;
}

/**
 * Converts a raw percentage to GPE.
 *
 * Grading scale:
 *
 * >= 94 = 4.0
 * >= 89 = 3.5
 * >= 83 = 3.0
 * >= 78 = 2.5
 * >= 72 = 2.0
 * >= 66 = 1.5
 * >= 60 = 1.0
 * <  60 = 0.0
 */
export function getGpeFromRawPercentage(
    rawPercentage: number,
): number {
    if (
        !Number.isFinite(
            rawPercentage,
        )
    ) {
        throw new Error(
            "Raw percentage must be a finite number.",
        );
    }

    if (
        rawPercentage < 0 ||
        rawPercentage > 100
    ) {
        throw new Error(
            "Raw percentage must be between 0 and 100.",
        );
    }

    if (
        rawPercentage >= 94
    ) {
        return 4.0;
    }

    if (
        rawPercentage >= 89
    ) {
        return 3.5;
    }

    if (
        rawPercentage >= 83
    ) {
        return 3.0;
    }

    if (
        rawPercentage >= 78
    ) {
        return 2.5;
    }

    if (
        rawPercentage >= 72
    ) {
        return 2.0;
    }

    if (
        rawPercentage >= 66
    ) {
        return 1.5;
    }

    if (
        rawPercentage >= 60
    ) {
        return 1.0;
    }

    return 0.0;
}

/**
 * Returns the official GPE for a grade.
 *
 * Rules:
 *
 * CREDITED = always 3.5
 * FAILED   = always 0.0
 * PASSED   = derived from raw percentage when available
 * PASSED   = otherwise uses the stored finalGradeValue
 */
export function resolveFinalGradeValue(
    grade: AcademicGradeInput,
): number {
    if (
        grade.result ===
        "CREDITED"
    ) {
        return 3.5;
    }

    if (
        grade.result ===
        "FAILED"
    ) {
        return 0.0;
    }

    if (
        typeof grade.rawPercentage ===
            "number" &&
        Number.isFinite(
            grade.rawPercentage,
        )
    ) {
        return getGpeFromRawPercentage(
            grade.rawPercentage,
        );
    }

    if (
        typeof grade.finalGradeValue ===
            "number" &&
        Number.isFinite(
            grade.finalGradeValue,
        )
    ) {
        validateGpe(
            grade.finalGradeValue,
        );

        return grade.finalGradeValue;
    }

    throw new Error(
        "A passed grade must contain either a raw percentage or a valid final grade value.",
    );
}

/**
 * Returns the expected result based on the
 * normalized GPE.
 */
export function getGradeResultFromGpe(
    finalGradeValue: number,
): Exclude<
    AcademicGradeResult,
    "CREDITED"
> {
    validateGpe(
        finalGradeValue,
    );

    return finalGradeValue <= 0
        ? "FAILED"
        : "PASSED";
}

/**
 * Normalizes and validates one academic grade.
 */
export function normalizeAcademicGrade(
    grade: AcademicGradeInput,
): NormalizedAcademicGrade {
    validateAcademicUnits(
        grade.academicUnits,
    );

    const finalGradeValue =
        resolveFinalGradeValue(
            grade,
        );

    if (
        grade.result ===
            "PASSED" &&
        finalGradeValue <= 0
    ) {
        throw new Error(
            "A passed course cannot have a GPE of 0.0.",
        );
    }

    if (
        grade.result ===
            "FAILED" &&
        finalGradeValue !== 0
    ) {
        throw new Error(
            "A failed course must have a GPE of 0.0.",
        );
    }

    if (
        grade.result ===
            "CREDITED" &&
        finalGradeValue !== 3.5
    ) {
        throw new Error(
            "A credited course must have a GPE of 3.5.",
        );
    }

    return {
        academicUnits:
            grade.academicUnits,

        rawPercentage:
            typeof grade.rawPercentage ===
                "number"
                ? grade.rawPercentage
                : null,

        finalGradeValue,

        result:
            grade.result,

        status:
            grade.status,
    };
}

/**
 * Calculates GPA and official earned-unit totals.
 *
 * GPA formula:
 *
 * sum(GPE × academic units)
 * --------------------------------
 * sum(GPA-eligible academic units)
 *
 * Credited courses:
 * - count toward earned units
 * - are included in GPA using 3.5
 *
 * Failed courses:
 * - do not count toward earned units
 * - are included in GPA using 0.0
 *
 * Draft and submitted grades:
 * - do not affect official GPA or earned units
 *
 * Zero-unit courses:
 * - do not affect academic GPA or academic units
 */
export function calculateAcademicSummary(
    grades: AcademicGradeInput[],
): AcademicSummary {
    let earnedAcademicUnits = 0;
    let gpaAcademicUnits = 0;
    let totalGradePoints = 0;
    let creditedAcademicUnits = 0;
    let failedAcademicUnits = 0;
    let verifiedAcademicUnits = 0;

    for (const grade of grades) {
        if (
            grade.status !==
            "VERIFIED"
        ) {
            continue;
        }

        validateAcademicUnits(
            grade.academicUnits,
        );

        if (
            grade.academicUnits ===
            0
        ) {
            continue;
        }

        const normalizedGrade =
            normalizeAcademicGrade(
                grade,
            );

        verifiedAcademicUnits +=
            normalizedGrade.academicUnits;

        /*
         * Passed and credited courses count
         * toward earned academic units.
         */
        if (
            normalizedGrade.result ===
                "PASSED" ||
            normalizedGrade.result ===
                "CREDITED"
        ) {
            earnedAcademicUnits +=
                normalizedGrade.academicUnits;
        }

        if (
            normalizedGrade.result ===
            "CREDITED"
        ) {
            creditedAcademicUnits +=
                normalizedGrade.academicUnits;
        }

        if (
            normalizedGrade.result ===
            "FAILED"
        ) {
            failedAcademicUnits +=
                normalizedGrade.academicUnits;
        }

        /*
         * All verified academic courses are
         * included in GPA:
         *
         * PASSED   -> calculated GPE
         * CREDITED -> 3.5
         * FAILED   -> 0.0
         */
        totalGradePoints +=
            normalizedGrade.finalGradeValue *
            normalizedGrade.academicUnits;

        gpaAcademicUnits +=
            normalizedGrade.academicUnits;
    }

    const currentGpa =
        gpaAcademicUnits > 0
            ? roundToThreeDecimals(
                  totalGradePoints /
                      gpaAcademicUnits,
              )
            : null;

    return {
        currentGpa,

        earnedAcademicUnits,

        gpaAcademicUnits,

        totalGradePoints:
            roundToThreeDecimals(
                totalGradePoints,
            ),

        creditedAcademicUnits,

        failedAcademicUnits,

        verifiedAcademicUnits,
    };
}

function validateAcademicUnits(
    academicUnits: number,
): void {
    if (
        !Number.isFinite(
            academicUnits,
        )
    ) {
        throw new Error(
            "Academic units must be a finite number.",
        );
    }

    if (
        academicUnits < 0
    ) {
        throw new Error(
            "Academic units cannot be negative.",
        );
    }
}

function validateGpe(
    finalGradeValue: number,
): void {
    if (
        !Number.isFinite(
            finalGradeValue,
        )
    ) {
        throw new Error(
            "Final grade value must be a finite number.",
        );
    }

    const allowedGpeValues =
        new Set([
            0.0,
            1.0,
            1.5,
            2.0,
            2.5,
            3.0,
            3.5,
            4.0,
        ]);

    if (
        !allowedGpeValues.has(
            finalGradeValue,
        )
    ) {
        throw new Error(
            `Invalid GPE value: ${finalGradeValue}.`,
        );
    }
}

function roundToThreeDecimals(
    value: number,
): number {
    return Number(
        value.toFixed(3),
    );
}