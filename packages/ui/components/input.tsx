import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const baseStyles =
  "w-full rounded-md border border-gray-300 bg-white text-sm text-gray-950 placeholder:text-gray-700 outline-none ring-0 shadow-none transition-[border-color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-600 disabled:placeholder:text-gray-600 disabled:opacity-100 dark:border-gray-600 dark:bg-gray-100 dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:border-gray-400";

const focusDefault =
  "focus:border-gray-600 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] focus-visible:border-gray-600 focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";

const focusError =
  "border-red-600 focus:border-red-600 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.25)] focus-visible:border-red-600 focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.25)]";

const focusWithinDefault = "focus-within:border-gray-600 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";
const focusWithinError = "border-red-600 focus-within:border-red-600 focus-within:shadow-[0_0_0_3px_rgba(220,38,38,0.25)]";

const inputVariants = cva(`flex ${baseStyles}`, {

  variants: {
    size: {
      small: "h-8 px-3",
      medium: "h-10 px-3",
      large: "h-12 px-3",
    },
  },
  defaultVariants: {
    size: "medium",
  },
});

const wrapperVariants = cva(
  `flex items-center gap-2 ${baseStyles}`,
  {
    variants: {
      size: {
        small: "h-8 px-2.5",
        medium: "h-10 px-3",
        large: "h-12 px-3",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix">,
    VariantProps<typeof inputVariants> {
  label?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, label, prefix, suffix, helperText, error, id, required, ...props }, ref) => {
    const hasWrapper = prefix || suffix;
    const inputId = id ?? React.useId();

    const labelNode = label ? (
      <label
        htmlFor={inputId}
        className="mb-1 block text-sm font-medium text-gray-950 dark:text-white"
      >
        {label}
        {required && <span className="text-red-900"> *</span>}
      </label>
    ) : null;

    const helperMessage = helperText ? (
      <p className="mt-1 text-12 text-gray-600 dark:text-gray-500">{helperText}</p>
    ) : null;

    const errorMessage = error ? (
      <p className="mt-1.5 text-sm text-red-900">{error}</p>
    ) : null;

    if (hasWrapper) {
      const wrapper = (
        <div
          className={cn(
            wrapperVariants({ size }),
            error ? focusWithinError : focusWithinDefault,
            className,
          )}
        >
          {prefix && (
            <span className="text-gray-600 shrink-0 flex items-center">{prefix}</span>
          )}
          <input
            type={type}
            ref={ref}
            id={inputId}
            required={required}
            className="flex-1 min-w-0 bg-transparent border-none outline-none ring-0 shadow-none text-sm text-gray-950 placeholder:text-gray-700 disabled:cursor-not-allowed disabled:text-gray-600 disabled:placeholder:text-gray-600 disabled:opacity-100 dark:text-white dark:placeholder:text-gray-500 p-0"
            {...props}
          />
          {suffix && (
            <span className="text-gray-600 shrink-0 flex items-center">{suffix}</span>
          )}
        </div>
      );

      if (!labelNode && !helperMessage && !errorMessage) return wrapper;
      return <div>{labelNode}{wrapper}{helperMessage}{errorMessage}</div>;
    }

    const input = (
      <input
        type={type}
        id={inputId}
        required={required}
        className={cn(inputVariants({ size }), error ? focusError : focusDefault, className)}
        ref={ref}
        {...props}
      />
    );

    if (!labelNode && !helperMessage && !errorMessage) return input;
    return <div>{labelNode}{input}{helperMessage}{errorMessage}</div>;
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
