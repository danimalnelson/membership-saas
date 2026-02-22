import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const checkboxContainerVariants = cva(
  "inline-flex items-center text-gray-950 font-normal transition-colors select-none",
  {
    variants: {
      size: {
        sm: "gap-2 text-xs",
        md: "gap-2.5 text-sm",
        lg: "gap-3 text-base",
      },
      disabled: {
        true: "cursor-not-allowed opacity-50",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      size: "md",
      disabled: false,
    },
  }
);

const checkboxBoxVariants = cva(
  "shrink-0 rounded border border-gray-600 bg-white transition-colors flex items-center justify-center",
  {
    variants: {
      size: {
        sm: "h-3.5 w-3.5",
        md: "h-4 w-4",
        lg: "h-5 w-5",
      },
      checked: {
        true: "border-gray-950 bg-gray-950",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      checked: false,
    },
  }
);

const checkIconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-4 w-4",
} as const;

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size" | "onChange">,
    Omit<VariantProps<typeof checkboxContainerVariants>, "disabled"> {
  onChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      size = "md",
      checked = false,
      disabled = false,
      children,
      onChange,
      ...props
    },
    ref
  ) => {
    const resolvedSize = size ?? "md";

    return (
      <label
        className={cn(
          checkboxContainerVariants({ size: resolvedSize, disabled }),
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <span className={cn(checkboxBoxVariants({ size: resolvedSize, checked }))}>
          {checked ? (
            <svg
              fill="none"
              viewBox="0 0 20 20"
              className={cn(checkIconSizeClasses[resolvedSize], "text-white")}
              aria-hidden="true"
            >
              <path
                d="M14 7L8.5 12.5L6 10"
                stroke="var(--geist-background, #fff)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </span>
        {children ? <span className="leading-none">{children}</span> : null}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
