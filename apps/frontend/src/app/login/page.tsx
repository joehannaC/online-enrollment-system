"use client";

import {
    Eye,
    EyeOff,
    LockKeyhole,
    UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    type FormEvent,
    useState,
} from "react";

import {
    ApiRequestError,
    login,
} from "@/lib/api/authApi";
import {
    saveAuthSession,
} from "@/lib/auth/tokenStorage";

export default function LoginPage() {
    const router = useRouter();

    const [
        usernameOrEmail,
        setUsernameOrEmail,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> {
        event.preventDefault();
        event.stopPropagation();

        if (isSubmitting) {
            return;
        }

        setErrorMessage("");

        const normalizedUsernameOrEmail =
            usernameOrEmail.trim();

        if (
            !normalizedUsernameOrEmail ||
            !password
        ) {
            setErrorMessage(
                "Enter your username/email and password.",
            );

            return;
        }

        setIsSubmitting(true);

        try {
            const result = await login({
                usernameOrEmail:
                    normalizedUsernameOrEmail,
                password,
            });

            saveAuthSession(
                result.accessToken,
                result.user,
            );

            if (
                result.user.role ===
                "STUDENT"
            ) {
                router.replace(
                    "/student/dashboard",
                );

                router.refresh();

                return;
            }

            router.replace(
                "/faculty/dashboard",
            );

            router.refresh();
        } catch (error) {
            if (
                error instanceof
                ApiRequestError
            ) {
                setErrorMessage(
                    error.message,
                );

                return;
            }

            setErrorMessage(
                "An unexpected error occurred. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main
            className="
                relative min-h-screen
                overflow-hidden
                bg-[#35822E]
                bg-[url('/Login-bg.png')]
                bg-cover
                bg-[position:45%_center]
                bg-no-repeat
            "
        >
            <div
                aria-hidden="true"
                className="
                    absolute inset-0
                    bg-gradient-to-l
                    from-[#01301E]/20
                    via-transparent
                    to-transparent
                "
            />

            <div
                className="
                    relative z-10
                    flex min-h-screen
                    items-center
                    justify-center
                    px-5 py-10
                    sm:px-8
                    lg:justify-end
                    lg:px-[8vw]
                "
            >
                <section
                    className="
                        w-full max-w-md
                        translate-y-4
                        rounded-3xl
                        border border-white/30
                        bg-white/15
                        p-6
                        text-white
                        shadow-2xl
                        shadow-black/20
                        backdrop-blur-xl
                        sm:p-8
                        lg:max-w-[400px]
                        lg:translate-y-8
                    "
                >
                    <div className="mb-8">
                        <p
                            className="
                                mb-2
                                text-sm
                                font-medium
                                uppercase
                                tracking-[0.18em]
                                text-[#35822E]
                                lg:text-white/80
                            "
                        >
                            Online Enrollment System
                        </p>

                        <h1
                            className="
                                font-serif
                                text-3xl
                                font-semibold
                                tracking-tight
                                text-neutral-900
                                sm:text-4xl
                                lg:text-white
                            "
                        >
                            University Portal
                        </h1>

                        <p
                            className="
                                mt-2
                                text-sm
                                text-neutral-600
                                lg:text-white/85
                            "
                        >
                            Sign in to access your
                            university account.
                        </p>
                    </div>

                    <form
                        noValidate
                        aria-busy={
                            isSubmitting
                        }
                        className="space-y-5"
                        onSubmit={
                            handleSubmit
                        }
                    >
                        <div>
                            <label
                                htmlFor="usernameOrEmail"
                                className="
                                    mb-2 block
                                    text-sm
                                    font-medium
                                    text-neutral-800
                                    lg:text-white
                                "
                            >
                                Username / Email
                            </label>

                            <div className="relative">
                                <UserRound
                                    aria-hidden="true"
                                    className="
                                        absolute
                                        left-3 top-1/2
                                        h-5 w-5
                                        -translate-y-1/2
                                        text-neutral-500
                                    "
                                />

                                <input
                                    id="usernameOrEmail"
                                    name="usernameOrEmail"
                                    type="text"
                                    autoComplete="username"
                                    value={
                                        usernameOrEmail
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        setUsernameOrEmail(
                                            event
                                                .target
                                                .value,
                                        );

                                        if (
                                            errorMessage
                                        ) {
                                            setErrorMessage(
                                                "",
                                            );
                                        }
                                    }}
                                    disabled={
                                        isSubmitting
                                    }
                                    required
                                    placeholder="Enter username or email"
                                    className="
                                        h-12 w-full
                                        rounded-lg
                                        border
                                        border-neutral-300
                                        bg-white
                                        pl-11 pr-4
                                        text-neutral-900
                                        outline-none
                                        transition
                                        placeholder:text-neutral-400
                                        focus:border-[#35822E]
                                        focus:ring-4
                                        focus:ring-[#35822E]/15
                                        disabled:cursor-not-allowed
                                        disabled:opacity-70
                                    "
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="
                                    mb-2 block
                                    text-sm
                                    font-medium
                                    text-neutral-800
                                    lg:text-white
                                "
                            >
                                Password
                            </label>

                            <div className="relative">
                                <LockKeyhole
                                    aria-hidden="true"
                                    className="
                                        absolute
                                        left-3 top-1/2
                                        h-5 w-5
                                        -translate-y-1/2
                                        text-neutral-500
                                    "
                                />

                                <input
                                    id="password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    autoComplete="current-password"
                                    value={
                                        password
                                    }
                                    onChange={(
                                        event,
                                    ) => {
                                        setPassword(
                                            event
                                                .target
                                                .value,
                                        );

                                        if (
                                            errorMessage
                                        ) {
                                            setErrorMessage(
                                                "",
                                            );
                                        }
                                    }}
                                    disabled={
                                        isSubmitting
                                    }
                                    required
                                    placeholder="Enter password"
                                    className="
                                        h-12 w-full
                                        rounded-lg
                                        border
                                        border-neutral-300
                                        bg-white
                                        pl-11 pr-12
                                        text-neutral-900
                                        outline-none
                                        transition
                                        placeholder:text-neutral-400
                                        focus:border-[#35822E]
                                        focus:ring-4
                                        focus:ring-[#35822E]/15
                                        disabled:cursor-not-allowed
                                        disabled:opacity-70
                                    "
                                />

                                <button
                                    type="button"
                                    disabled={
                                        isSubmitting
                                    }
                                    onClick={() => {
                                        setShowPassword(
                                            (
                                                current,
                                            ) =>
                                                !current,
                                        );
                                    }}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    aria-pressed={
                                        showPassword
                                    }
                                    className="
                                        absolute
                                        right-3 top-1/2
                                        -translate-y-1/2
                                        rounded-md
                                        p-1
                                        text-neutral-500
                                        transition
                                        hover:bg-neutral-100
                                        hover:text-neutral-900
                                        focus-visible:outline-none
                                        focus-visible:ring-2
                                        focus-visible:ring-[#35822E]
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                    "
                                >
                                    {showPassword ? (
                                        <EyeOff
                                            aria-hidden="true"
                                            className="h-5 w-5"
                                        />
                                    ) : (
                                        <Eye
                                            aria-hidden="true"
                                            className="h-5 w-5"
                                        />
                                    )}
                                </button>
                            </div>
                        </div>

                        {errorMessage ? (
                            <div
                                role="alert"
                                aria-live="polite"
                                className="
                                    rounded-lg
                                    border
                                    border-red-200
                                    bg-red-50
                                    px-4 py-3
                                    text-sm
                                    text-red-700
                                "
                            >
                                {errorMessage}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={
                                isSubmitting
                            }
                            className="
                                mt-8 flex
                                h-12 w-full
                                items-center
                                justify-center
                                rounded-lg
                                bg-white
                                px-4
                                font-semibold
                                text-[#35822E]
                                shadow-sm
                                transition
                                hover:bg-neutral-100
                                focus-visible:outline-none
                                focus-visible:ring-4
                                focus-visible:ring-white/30
                                disabled:cursor-not-allowed
                                disabled:opacity-70
                            "
                        >
                            {isSubmitting
                                ? "Signing in..."
                                : "Sign in"}
                        </button>
                    </form>

                    <p
                        className="
                            mt-5
                            text-center
                            text-xs
                            text-neutral-500
                            lg:text-white/70
                        "
                    >
                        Use your assigned university
                        credentials.
                    </p>
                </section>
            </div>
        </main>
    );
}