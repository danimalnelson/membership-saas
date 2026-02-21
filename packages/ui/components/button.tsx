import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { ChevronDownIcon } from "./icons";

// ---------------------------------------------------------------------------
// Variants (cva)
// ---------------------------------------------------------------------------

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-[color,background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:border-gray-600 focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gray-950 text-white hover:bg-[--themed-hover-bg] dark:bg-white dark:text-gray-950 dark:hover:bg-[--themed-hover-bg]",
        secondary:
          "border border-gray-300 bg-white text-gray-950 hover:bg-[--ds-gray-100] hover:border-gray-500 dark:border-gray-600 dark:bg-gray-100 dark:text-white dark:hover:border-gray-400",
        tertiary:
          "bg-transparent text-gray-950 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800",
        error:
          "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
        warning:
          "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700",
      },
      size: {
        small: "h-8 px-2.5 text-sm gap-1.5",
        medium: "h-10 px-2.5 text-sm gap-2",
        large: "h-12 px-2.5 text-sm gap-2",
      },
      shape: {
        square: "rounded-md",
        rounded: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "medium",
      shape: "square",
    },
  }
);

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="16"
      height="16"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "prefix" | "suffix">,
    Omit<VariantProps<typeof buttonVariants>, "variant"> {
  /** Visual style variant */
  variant?: "default" | "secondary" | "tertiary" | "error" | "warning";
  /** Render as child element (Radix Slot) */
  asChild?: boolean;
  /** Icon or element before children */
  prefix?: React.ReactNode;
  /** Icon or element after children */
  suffix?: React.ReactNode;
  /** Append a chevron-down icon as suffix */
  showChevron?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Add subtle box-shadow */
  shadow?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size,
      shape,
      asChild = false,
      prefix,
      suffix,
      showChevron = false,
      loading = false,
      shadow = false,
      disabled,
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    // For asChild, just pass through with variants
    if (asChild) {
      return (
        <Comp
          className={cn(
            buttonVariants({ variant, size, shape, className }),
            shadow && "shadow-sm",
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, shape, className }),
          shadow && "shadow-sm",
          loading && "pointer-events-none",
        )}
        ref={ref}
        disabled={isDisabled}
        type={type}
        {...props}
      >
        {loading ? (
          <>
            <Spinner className="shrink-0" />
            <span className="opacity-0">{children}</span>
          </>
        ) : (
          <>
            {prefix}
            {children}
            {suffix}
            {showChevron && !suffix && <ChevronDownIcon size={16} className="text-gray-800" />}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
