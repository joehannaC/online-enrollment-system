"use client";

import {
    AlertTriangle,
    X,
} from "lucide-react";
import {
    useEffect,
} from "react";

interface ConfirmationModalProps {
    isOpen: boolean;

    title: string;
    description: string;

    confirmLabel: string;
    cancelLabel?: string;

    variant?:
        | "danger"
        | "primary";

    isLoading?: boolean;

    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmationModal({
    isOpen,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    variant = "primary",
    isLoading = false,
    onConfirm,
    onClose,
}: ConfirmationModalProps) {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleKeyDown(
            event: KeyboardEvent,
        ): void {
            if (
                event.key ===
                    "Escape" &&
                !isLoading
            ) {
                onClose();
            }
        }

        document.addEventListener(
            "keydown",
            handleKeyDown,
        );

        const previousOverflow =
            document.body.style
                .overflow;

        document.body.style.overflow =
            "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown,
            );

            document.body.style.overflow =
                previousOverflow;
        };
    }, [
        isLoading,
        isOpen,
        onClose,
    ]);

    if (!isOpen) {
        return null;
    }

    const confirmClassName =
        variant === "danger"
            ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
            : "bg-[#35822E] hover:bg-[#2B6D26] focus-visible:ring-[#35822E]";

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-description"
            className="
                fixed inset-0 z-[100]
                flex items-center
                justify-center
                bg-black/50
                px-4 py-6
                backdrop-blur-sm
            "
            onMouseDown={(event) => {
                if (
                    event.target ===
                        event.currentTarget &&
                    !isLoading
                ) {
                    onClose();
                }
            }}
        >
            <section
                className="
                    w-full max-w-md
                    rounded-2xl
                    bg-white p-5
                    shadow-2xl
                    sm:p-6
                "
            >
                <div
                    className="
                        flex items-start
                        justify-between
                        gap-4
                    "
                >
                    <div
                        className={[
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                            variant ===
                            "danger"
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-[#35822E]",
                        ].join(" ")}
                    >
                        <AlertTriangle
                            aria-hidden="true"
                            className="h-5 w-5"
                        />
                    </div>

                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onClose}
                        aria-label="Close confirmation"
                        className="
                            rounded-lg p-2
                            text-neutral-500
                            transition
                            hover:bg-neutral-100
                            hover:text-neutral-900
                            disabled:opacity-50
                        "
                    >
                        <X
                            aria-hidden="true"
                            className="h-5 w-5"
                        />
                    </button>
                </div>

                <h2
                    id="confirmation-title"
                    className="
                        mt-4 text-xl
                        font-semibold
                        text-neutral-900
                    "
                >
                    {title}
                </h2>

                <p
                    id="confirmation-description"
                    className="
                        mt-2 text-sm
                        leading-6
                        text-neutral-600
                    "
                >
                    {description}
                </p>

                <div
                    className="
                        mt-6 flex
                        flex-row gap-3
                    "
                >
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onClose}
                        className="
                            h-11 flex-1
                            rounded-lg border
                            border-neutral-300
                            bg-white px-4
                            text-sm font-semibold
                            text-neutral-700
                            transition
                            hover:bg-neutral-50
                            disabled:opacity-50
                        "
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onConfirm}
                        className={[
                            "h-11 flex-1 rounded-lg px-4",
                            "text-sm font-semibold text-white",
                            "transition focus-visible:outline-none focus-visible:ring-4",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            confirmClassName,
                        ].join(" ")}
                    >
                        {isLoading
                            ? "Processing..."
                            : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}