import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const toggleRootVariants = cva(
  "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-[24px] w-[44px] p-[1px]",
        large: "h-[28px] w-[50px] p-[1px]",
      },
      checked: {
        true: "bg-green-600 dark:bg-green-500",
        false: "bg-gray-200 dark:bg-gray-700",
      },
    },
    defaultVariants: {
      size: "default",
      checked: false,
    },
  }
);

const toggleThumbVariants = cva(
  "pointer-events-none inline-block rounded-full bg-white ring-0 transition-transform duration-200 ease-out shadow-[0_1px_2px_rgba(16,24,40,0.18),0_1px_1px_rgba(16,24,40,0.10)]",
  {
    variants: {
      size: {
        default: "h-[22px] w-[22px]",
        large: "h-[26px] w-[26px]",
      },
      checked: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      checked: false,
    },
  }
);

const thumbTranslate = {
  default: {
    true: "translate-x-[20px]",
    false: "translate-x-0",
  },
  large: {
    true: "translate-x-[22px]",
    false: "translate-x-0",
  },
} as const;

export interface ToggleProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "onChange" | "children"
    >,
    VariantProps<typeof toggleRootVariants> {
  checked?: boolean;
  onChange?: () => void;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      size = "default",
      checked = false,
      disabled = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const resolvedSize = size ?? "default";
    const resolvedChecked = checked ?? false;

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={resolvedChecked}
        disabled={disabled}
        data-state={resolvedChecked ? "checked" : "unchecked"}
        className={cn(
          toggleRootVariants({
            size: resolvedSize,
            checked: resolvedChecked,
          }),
          className
        )}
        onClick={() => {
          if (disabled) return;
          onChange?.();
        }}
        {...props}
      >
        <span
          className={cn(
            toggleThumbVariants({ size: resolvedSize, checked: resolvedChecked }),
            thumbTranslate[resolvedSize][resolvedChecked ? "true" : "false"]
          )}
        />
      </button>
    );
  }
);

Toggle.displayName = "Toggle";
