export default function StudentLoading() {
    return (
        <main className="min-h-screen bg-neutral-100 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl animate-pulse">
                {/* Dashboard header skeleton */}
                <section className="rounded-2xl bg-[#35822E] p-6 sm:p-8">
                    <div className="h-8 w-56 rounded-md bg-white/30 sm:w-72" />

                    <div className="mt-3 h-4 w-72 max-w-full rounded-md bg-white/20" />
                </section>

                {/* Main dashboard cards */}
                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="h-6 w-44 rounded-md bg-neutral-200" />

                            <div className="h-4 w-24 rounded-md bg-neutral-200" />
                        </div>

                        <div className="mt-5 space-y-4">
                            {Array.from({ length: 4 }).map(
                                (_, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[1fr_6rem_3rem] gap-4 border-b border-neutral-100 pb-4"
                                    >
                                        <div className="h-4 rounded-md bg-neutral-200" />

                                        <div className="h-4 rounded-md bg-neutral-200" />

                                        <div className="h-4 rounded-md bg-neutral-200" />
                                    </div>
                                ),
                            )}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="h-6 w-40 rounded-md bg-neutral-200" />

                        <div className="mt-5 space-y-5">
                            {Array.from({ length: 3 }).map(
                                (_, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-3"
                                    >
                                        <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#35822E]/30" />

                                        <div className="flex-1">
                                            <div className="h-4 w-3/5 rounded-md bg-neutral-200" />

                                            <div className="mt-2 h-3 w-4/5 rounded-md bg-neutral-100" />
                                        </div>

                                        <div className="h-3 w-12 rounded-md bg-neutral-100" />
                                    </div>
                                ),
                            )}
                        </div>
                    </section>
                </div>

                {/* Schedule skeleton */}
                <section className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="h-6 w-40 rounded-md bg-neutral-200" />

                            <div className="mt-2 h-3 w-28 rounded-md bg-neutral-100" />
                        </div>

                        <div className="flex gap-3">
                            <div className="h-10 w-28 rounded-lg bg-neutral-200" />

                            <div className="h-10 w-28 rounded-lg bg-neutral-200" />
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {Array.from({ length: 3 }).map(
                            (_, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 gap-3 border-b border-neutral-100 pb-4 sm:grid-cols-[7rem_7rem_1fr_6rem]"
                                >
                                    <div className="h-4 rounded-md bg-neutral-200" />

                                    <div className="h-4 rounded-md bg-neutral-200" />

                                    <div className="h-4 rounded-md bg-neutral-200" />

                                    <div className="h-7 rounded-full bg-neutral-100" />
                                </div>
                            ),
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}