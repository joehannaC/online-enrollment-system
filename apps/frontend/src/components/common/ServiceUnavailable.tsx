"use client";

import {
    RefreshCw,
    ServerOff,
} from "lucide-react";
import { useRouter } from "next/navigation";

import Button from "./Button";

interface ServiceUnavailableProps {
    serviceName?: string;
    title?: string;
    description?: string;
    code?: string | number;
    showRetry?: boolean;
    onRetry?: () => void;
    fullScreen?: boolean;
}

export default function ServiceUnavailable({
    serviceName,
    title = "Service unavailable",
    description,
    code = "503",
    showRetry = true,
    onRetry,
    fullScreen = true,
}: ServiceUnavailableProps) {
    const router = useRouter();

    const resolvedDescription =
        description ??
        (serviceName
            ? `The ${serviceName} is currently unavailable. Other system features may still continue to work.`
            : "This feature is temporarily unavailable. Please try again in a moment.");

    function handleRetry(): void {
        if (onRetry) {
            onRetry();
            return;
        }

        router.refresh();
    }

    return (
        <main
            className={[
                "relative overflow-hidden bg-[#01301E]",
                fullScreen
                    ? "min-h-screen"
                    : "min-h-[680px] rounded-2xl",
            ].join(" ")}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(53,130,46,0.45),transparent_45%)]"
            />

            <div
                aria-hidden="true"
                className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#3C6F37]/25 blur-3xl"
            />

            <div className="relative z-10 flex min-h-[inherit] items-center justify-center px-6 py-16">
                <section className="w-full max-w-3xl text-white">
                    <div className="mb-8 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                            <ServerOff
                                aria-hidden="true"
                                className="h-8 w-8 text-white"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-5 text-center sm:flex-row sm:gap-7">
                        <p className="font-serif text-5xl font-semibold sm:text-6xl">
                            {code}
                        </p>

                        <div
                            aria-hidden="true"
                            className="h-px w-24 bg-white/30 sm:h-20 sm:w-px"
                        />

                        <div className="max-w-lg text-center sm:text-left">
                            <h1 className="text-xl font-semibold sm:text-2xl">
                                {title}
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-white/70 sm:text-base">
                                {resolvedDescription}
                            </p>
                        </div>
                    </div>

                    {showRetry ? (
                        <div className="mt-8 flex justify-center">
                            <Button
                                variant="outline"
                                leftIcon={RefreshCw}
                                onClick={handleRetry}
                                className="border-white bg-white text-[#35822E] hover:bg-white/90"
                            >
                                Try again
                            </Button>
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    );
}