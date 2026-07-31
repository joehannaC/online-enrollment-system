import {
    FairSemaphore,
} from "./fairSemaphore.js";

const configuredPermits =
    Number(
        process.env
            .ENROLLMENT_MAX_CONCURRENT_SUBMISSIONS ??
            24,
    );

export const enrollmentSubmissionSemaphore =
    new FairSemaphore(
        Number.isInteger(
            configuredPermits,
        ) &&
        configuredPermits > 0
            ? configuredPermits
            : 24,
    );