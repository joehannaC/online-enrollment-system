import { ChevronDown } from "lucide-react";
import type {
    SelectHTMLAttributes,
} from "react";

export interface SelectOption {
    label: string;
    value: string;
    disabled?: boolean;
}

interface SelectProps
    extends Omit<
        SelectHTMLAttributes<HTMLSelectElement>,
        "children"
    > {
    label?: string;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    helperText?: string;
    containerClassName?: string;
}

export default function Select({
    id,
    name,
    label,
    options,
    placeholder = "Select an option",
    error,
    helperText,
    containerClassName = "",
    className = "",
    required,
    disabled,
    ...props
}: SelectProps) {
    const selectId =
        id ??
        name ??
        `select-${label
            ?.toLowerCase()
            .replace(/\s+/g, "-")}`;

    const descriptionId = error
        ? `${selectId}-error`
        : helperText
        ? `${selectId}-helper`
        : undefined;

    return (
        <div className={containerClassName}>
            {label ? (
                <label
                    htmlFor={selectId}
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
                <select
                    id={selectId}
                    name={name}
                    required={required}
                    disabled={disabled}
                    aria-invalid={
                        error ? true : undefined
                    }
                    aria-describedby={descriptionId}
                    defaultValue=""
                    className={[
                        "h-11 w-full appearance-none rounded-lg border bg-white",
                        "px-3 pr-10 text-sm text-neutral-900 outline-none transition",
                        "focus:ring-4",
                        "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
                        error
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
                            : "border-neutral-300 focus:border-[#35822E] focus:ring-[#35822E]/15",
                        className,
                    ].join(" ")}
                    {...props}
                >
                    <option value="" disabled>
                        {placeholder}
                    </option>

                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                />
            </div>

            {error ? (
                <p
                    id={`${selectId}-error`}
                    role="alert"
                    className="mt-1.5 text-sm text-red-600"
                >
                    {error}
                </p>
            ) : helperText ? (
                <p
                    id={`${selectId}-helper`}
                    className="mt-1.5 text-sm text-neutral-500"
                >
                    {helperText}
                </p>
            ) : null}
        </div>
    );
}