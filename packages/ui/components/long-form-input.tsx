import * as React from "react";
import { cn } from "../lib/utils";

const baseStyles =
  "w-full rounded-md border border-gray-300 bg-white text-sm text-gray-950 placeholder:text-gray-700 outline-none ring-0 shadow-none transition-[border-color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-600 disabled:placeholder:text-gray-600 disabled:opacity-100 dark:border-gray-600 dark:bg-gray-100 dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:border-gray-400";

const focusDefault =
  "focus:border-gray-600 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] focus-visible:border-gray-600 focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]";

const focusError =
  "border-red-600 focus:border-red-600 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.25)] focus-visible:border-red-600 focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.25)]";

export interface LongFormInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
}

const LongFormInput = React.forwardRef<HTMLTextAreaElement, LongFormInputProps>(
  ({ className, label, helperText, error, rows = 3, id, required, ...props }, ref) => {
    const helperMessage = helperText ? (
      <p className="mt-1 text-12 text-gray-600 dark:text-gray-500">{helperText}</p>
    ) : null;

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

    const input = (
      <textarea
        ref={ref}
        id={inputId}
        required={required}
        rows={rows}
        className={cn(
          baseStyles,
          error ? focusError : focusDefault,
          "px-3 py-2 resize-y",
          className
        )}
        {...props}
      />
    );

    if (!labelNode && !helperMessage && !error) return input;
    return (
      <div>
        {labelNode}
        {input}
        {helperMessage}
        {error && <p className="mt-1.5 text-sm text-red-900">{error}</p>}
      </div>
    );
  }
);

LongFormInput.displayName = "LongFormInput";

export { LongFormInput };
