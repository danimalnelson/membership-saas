import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        gray: "border-gray-950 bg-gray-950 text-white",
        "gray-subtle": "border-gray-300 bg-gray-100 text-gray-950",
        blue: "border-blue-600 bg-blue-600 text-white",
        "blue-subtle": "border-blue-200 bg-blue-100 text-blue-900",
        purple: "border-purple-600 bg-purple-600 text-white",
        "purple-subtle": "border-purple-200 bg-purple-100 text-purple-900",
        amber: "border-amber-600 bg-amber-600 text-white",
        "amber-subtle": "border-amber-200 bg-amber-100 text-amber-900",
        red: "border-red-600 bg-red-600 text-white",
        "red-subtle": "border-red-200 bg-red-100 text-red-900",
        pink: "border-pink-600 bg-pink-600 text-white",
        "pink-subtle": "border-pink-200 bg-pink-100 text-pink-900",
        green: "border-green-600 bg-green-600 text-white",
        "green-subtle": "border-green-200 bg-green-100 text-green-900",
        teal: "border-teal-600 bg-teal-600 text-white",
        "teal-subtle": "border-teal-200 bg-teal-100 text-teal-900",
        inverted: "border-gray-300 bg-white text-gray-950 dark:border-gray-600 dark:bg-gray-950 dark:text-white",
        trial: "border-purple-200 bg-purple-100 text-purple-900",
        turbo: "border-gray-950 bg-gray-950 text-white",
      },
      size: {
        sm: "h-5 gap-1 px-2 text-[11px]",
        md: "h-6 gap-1 px-2.5 text-12",
        lg: "h-7 gap-1.5 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "gray-subtle",
      size: "md",
    },
  }
);

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
} as const;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export function Badge({
  className,
  variant,
  size = "md",
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon ? <span className={cn("shrink-0", iconSizeClasses[size])}>{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}

export { badgeVariants };
