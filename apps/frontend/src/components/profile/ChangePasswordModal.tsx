"use client";

import {
    Check,
    Eye,
    EyeOff,
    X,
} from "lucide-react";
import {
    useState,
    type FormEvent,
} from "react";

import {
    Button,
    Input,
} from "@/components/common";
import {
    changePassword,
    ChangePasswordApiError,
} from "@/lib/api/changePasswordApi";
import {
    changePasswordFormSchema,
    type ChangePasswordFormValues,
} from "@/lib/validators/changePasswordSchema";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FormErrors = Partial<
    Record<
        keyof ChangePasswordFormValues,
        string
    >
>;

const initialValues: ChangePasswordFormValues = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

function Requirement({
    met,
    children,
}: {
    met: boolean;
    children: string;
}) {
    return (
        <li
            className={[
                "flex items-center gap-2 text-xs",
                met
                    ? "text-green-700"
                    : "text-neutral-500",
            ].join(" ")}
        >
            <span
                className={[
                    "flex h-4 w-4 items-center justify-center rounded-full border",
                    met
                        ? "border-green-600 bg-green-50"
                        : "border-neutral-300",
                ].join(" ")}
            >
                {met ? (
                    <Check className="h-3 w-3" />
                ) : null}
            </span>

            {children}
        </li>
    );
}

export default function ChangePasswordModal({
    isOpen,
    onClose,
}: ChangePasswordModalProps) {
    const [values, setValues] =
        useState(initialValues);

    const [errors, setErrors] =
        useState<FormErrors>({});

    const [serverError, setServerError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [
        visiblePasswords,
        setVisiblePasswords,
    ] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    if (!isOpen) {
        return null;
    }

    const password =
        values.newPassword;

    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special:
            /[^A-Za-z0-9]/.test(password),
    };

    function updateField(
        field: keyof ChangePasswordFormValues,
        value: string,
    ): void {
        setValues((current) => ({
            ...current,
            [field]: value,
        }));

        setErrors((current) => ({
            ...current,
            [field]: undefined,
        }));

        setServerError("");
        setSuccessMessage("");
    }

    function resetAndClose(): void {
        if (isSubmitting) {
            return;
        }

        setValues(initialValues);
        setErrors({});
        setServerError("");
        setSuccessMessage("");
        onClose();
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> {
        event.preventDefault();

        setErrors({});
        setServerError("");
        setSuccessMessage("");

        const result =
            changePasswordFormSchema.safeParse(
                values,
            );

        if (!result.success) {
            const fieldErrors: FormErrors =
                {};

            for (
                const issue of
                result.error.issues
            ) {
                const field =
                    issue.path[0] as
                        | keyof ChangePasswordFormValues
                        | undefined;

                if (
                    field &&
                    !fieldErrors[field]
                ) {
                    fieldErrors[field] =
                        issue.message;
                }
            }

            setErrors(fieldErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            const response =
                await changePassword(
                    result.data,
                );

            setSuccessMessage(
                response.message,
            );

            setValues(initialValues);
        } catch (error) {
            if (
                error instanceof
                ChangePasswordApiError
            ) {
                setServerError(
                    error.message,
                );

                return;
            }

            setServerError(
                "The password could not be changed.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-8"
        >
            <button
                type="button"
                aria-label="Close change password dialog"
                className="absolute inset-0"
                onClick={resetAndClose}
            />

            <section className="relative z-10 max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <header className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                    <div>
                        <h2
                            id="change-password-title"
                            className="text-lg font-semibold text-[#35822E]"
                        >
                            Change Password
                        </h2>

                        <p className="mt-1 text-sm text-neutral-500">
                            Create a secure password for your account.
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="Close"
                        onClick={resetAndClose}
                        className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 p-5"
                >
                    <Input
                        label="Current Password"
                        type={
                            visiblePasswords.current
                                ? "text"
                                : "password"
                        }
                        value={
                            values.currentPassword
                        }
                        onChange={(event) =>
                            updateField(
                                "currentPassword",
                                event.target.value,
                            )
                        }
                        error={
                            errors.currentPassword
                        }
                        autoComplete="current-password"
                        rightElement={
                            <button
                                type="button"
                                aria-label="Toggle current password visibility"
                                onClick={() =>
                                    setVisiblePasswords(
                                        (current) => ({
                                            ...current,
                                            current:
                                                !current.current,
                                        }),
                                    )
                                }
                                className="text-neutral-500 hover:text-[#35822E]"
                            >
                                {visiblePasswords.current ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        }
                    />

                    <div>
                        <Input
                            label="New Password"
                            type={
                                visiblePasswords.new
                                    ? "text"
                                    : "password"
                            }
                            value={
                                values.newPassword
                            }
                            onChange={(event) =>
                                updateField(
                                    "newPassword",
                                    event.target.value,
                                )
                            }
                            error={
                                errors.newPassword
                            }
                            autoComplete="new-password"
                            rightElement={
                                <button
                                    type="button"
                                    aria-label="Toggle new password visibility"
                                    onClick={() =>
                                        setVisiblePasswords(
                                            (current) => ({
                                                ...current,
                                                new: !current.new,
                                            }),
                                        )
                                    }
                                    className="text-neutral-500 hover:text-[#35822E]"
                                >
                                    {visiblePasswords.new ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            }
                        />

                        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Requirement
                                met={
                                    requirements.length
                                }
                            >
                                At least 8 characters
                            </Requirement>

                            <Requirement
                                met={
                                    requirements.uppercase
                                }
                            >
                                One uppercase letter
                            </Requirement>

                            <Requirement
                                met={
                                    requirements.lowercase
                                }
                            >
                                One lowercase letter
                            </Requirement>

                            <Requirement
                                met={
                                    requirements.number
                                }
                            >
                                One number
                            </Requirement>

                            <Requirement
                                met={
                                    requirements.special
                                }
                            >
                                One special character
                            </Requirement>
                        </ul>
                    </div>

                    <Input
                        label="Confirm New Password"
                        type={
                            visiblePasswords.confirm
                                ? "text"
                                : "password"
                        }
                        value={
                            values.confirmPassword
                        }
                        onChange={(event) =>
                            updateField(
                                "confirmPassword",
                                event.target.value,
                            )
                        }
                        error={
                            errors.confirmPassword
                        }
                        autoComplete="new-password"
                        rightElement={
                            <button
                                type="button"
                                aria-label="Toggle confirmation password visibility"
                                onClick={() =>
                                    setVisiblePasswords(
                                        (current) => ({
                                            ...current,
                                            confirm:
                                                !current.confirm,
                                        }),
                                    )
                                }
                                className="text-neutral-500 hover:text-[#35822E]"
                            >
                                {visiblePasswords.confirm ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        }
                    />

                    {serverError ? (
                        <p
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {serverError}
                        </p>
                    ) : null}

                    {successMessage ? (
                        <p
                            role="status"
                            className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                        >
                            {successMessage}
                        </p>
                    ) : null}

                    <div className="flex flex-row gap-3 border-t border-neutral-200 pt-5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetAndClose}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            loadingText="Changing..."
                            className="flex-1"
                        >
                            Change Password
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}