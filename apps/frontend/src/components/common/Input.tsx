import type {
    InputHTMLAttributes,
    ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

interface InputProps
    extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: LucideIcon;
    rightElement?: ReactNode;
    containerClassName?: string;
}

export default function Input({
    id,
    name,
    label,
    error,
    helperText,
    leftIcon: LeftIcon,
    rightElement,
    containerClassName = "",
    className = "",
    required,
    disabled,
    ...props
}: InputProps) {
    const inputId =
        id ??
        name ??
        `input-${label
            ?.toLowerCase()
            .replace(/\s+/g, "-")}`;

    const descriptionId = error
        ? `${inputId}-error`
        : helperText
        ? `${inputId}-helper`
        : undefined;

    return (
        <div className={containerClassName}>
            {label ? (
                <label
                    htmlFor={inputId}
                    className="mb-2 block text-sm font-medium text-neutral-800"
                >
                    {label}

                    {required ? (
                        <span
                            aria-hidden="true"
                            className="ml-1 text-red-600"
                        >
                            *
                        </span>
                    ) : null}
                </label>
            ) : null}

            <div className="relative">
                {LeftIcon ? (
                    <LeftIcon
                        aria-hidden="true"
                        className={[
                            "absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2",
                            error
                                ? "text-red-500"
                                : "text-neutral-500",
                        ].join(" ")}
                    />
                ) : null}

                <input
                    id={inputId}
                    name={name}
                    required={required}
                    disabled={disabled}
                    aria-invalid={
                        error ? true : undefined
                    }
                    aria-describedby={descriptionId}
                    className={[
                        "h-11 w-full rounded-lg border bg-white text-sm text-neutral-900",
                        "outline-none transition",
                        "placeholder:text-neutral-400",
                        "focus:ring-4",
                        "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
                        LeftIcon ? "pl-11" : "pl-3",
                        rightElement ? "pr-11" : "pr-3",
                        error
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
                            : "border-neutral-300 focus:border-[#35822E] focus:ring-[#35822E]/15",
                        className,
                    ].join(" ")}
                    {...props}
                />

                {rightElement ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                ) : null}
            </div>

            {error ? (
                <p
                    id={`${inputId}-error`}
                    role="alert"
                    className="mt-1.5 text-sm text-red-600"
                >
                    {error}
                </p>
            ) : helperText ? (
                <p
                    id={`${inputId}-helper`}
                    className="mt-1.5 text-sm text-neutral-500"
                >
                    {helperText}
                </p>
            ) : null}
        </div>
    );
}