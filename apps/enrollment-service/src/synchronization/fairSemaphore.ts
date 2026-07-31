interface Waiter {
    resolve: () => void;
    reject: (
        error: Error,
    ) => void;

    timeout?: NodeJS.Timeout;
}

export class FairSemaphore {
    private availablePermits: number;

    private readonly queue:
        Waiter[] = [];

    private closed = false;

    constructor(
        private readonly maximumPermits: number,
    ) {
        if (
            !Number.isInteger(
                maximumPermits,
            ) ||
            maximumPermits <= 0
        ) {
            throw new Error(
                "Semaphore permits must be a positive integer.",
            );
        }

        this.availablePermits =
            maximumPermits;
    }

    public async acquire(
        timeoutMilliseconds =
            10_000,
    ): Promise<() => void> {
        if (this.closed) {
            throw new Error(
                "Semaphore is closed.",
            );
        }

        if (
            this.availablePermits > 0 &&
            this.queue.length === 0
        ) {
            this.availablePermits -= 1;

            return this.createRelease();
        }

        await new Promise<void>(
            (resolve, reject) => {
                const waiter: Waiter = {
                    resolve,
                    reject,
                };

                waiter.timeout =
                    setTimeout(() => {
                        const index =
                            this.queue.indexOf(
                                waiter,
                            );

                        if (index >= 0) {
                            this.queue.splice(
                                index,
                                1,
                            );
                        }

                        reject(
                            new Error(
                                "Semaphore acquisition timed out.",
                            ),
                        );
                    }, timeoutMilliseconds);

                this.queue.push(
                    waiter,
                );
            },
        );

        return this.createRelease();
    }

    public close(): void {
        this.closed = true;

        for (
            const waiter of
            this.queue.splice(0)
        ) {
            if (waiter.timeout) {
                clearTimeout(
                    waiter.timeout,
                );
            }

            waiter.reject(
                new Error(
                    "Semaphore is closed.",
                ),
            );
        }
    }

    private createRelease(): () => void {
        let released = false;

        return () => {
            if (released) {
                return;
            }

            released = true;

            const next =
                this.queue.shift();

            if (next) {
                if (next.timeout) {
                    clearTimeout(
                        next.timeout,
                    );
                }

                next.resolve();

                return;
            }

            this.availablePermits =
                Math.min(
                    this.availablePermits +
                        1,
                    this.maximumPermits,
                );
        };
    }
}