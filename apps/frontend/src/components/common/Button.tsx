import {
    LoaderCircle,
    type LucideIcon,
} from "lucide-react";
import type {
    ButtonHTMLAttributes,
    ReactNode,
} from "react";

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger";

export type ButtonSize =
    | "sm"
    | "md"
    | "lg"
    | "icon";

interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    children?: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    fullWidth?: boolean;
}

const variantClasses: Record<
    ButtonVariant,
    string
> = {
    primary:
        "border-[#35822E] bg-[#35822E] text-white hover:border-[#2d7028] hover:bg-[#2d7028] focus-visible:ring-[#35822E]/30",

    secondary:
        "border-[#3C6F37] bg-[#3C6F37] text-white hover:border-[#315c2e] hover:bg-[#315c2e] focus-visible:ring-[#3C6F37]/30",

    outline:
        "border-[#35822E] bg-white text-[#35822E] hover:bg-[#35822E]/5 focus-visible:ring-[#35822E]/25",

    ghost:
        "border-transparent bg-transparent text-[#35822E] hover:bg-[#35822E]/10 focus-visible:ring-[#35822E]/20",

    danger:
        "border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700 focus-visible:ring-red-500/30",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "h-9 rounded-lg px-3 text-sm",
    md: "h-11 rounded-lg px-4 text-sm",
    lg: "h-12 rounded-xl px-5 text-base",
    icon: "h-11 w-11 rounded-lg",
};

export default function Button({
    children,
    type = "button",
    variant = "primary",
    size = "md",
    isLoading = false,
    loadingText,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    fullWidth = false,
    disabled,
    className = "",
    ...props
}: ButtonProps) {
    const isDisabled = disabled || isLoading;

    return (
        <button
            type={type}
            disabled={isDisabled}
            aria-busy={isLoading}
            className={[
                "inline-flex items-center justify-center gap-2 border font-semibold",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-4",
                "disabled:cursor-not-allowed disabled:opacity-60",
                variantClasses[variant],
                sizeClasses[size],
                fullWidth ? "w-full" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...props}
        >
            {isLoading ? (
                <LoaderCircle
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                />
            ) : LeftIcon ? (
                <LeftIcon
                    aria-hidden="true"
                    className="h-4 w-4"
                />
            ) : null}

            {children ? (
                <span>
                    {isLoading && loadingText
                        ? loadingText
                        : children}
                </span>
            ) : null}

            {!isLoading && RightIcon ? (
                <RightIcon
                    aria-hidden="true"
                    className="h-4 w-4"
                />
            ) : null}
        </button>
    );
}