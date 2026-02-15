import * as React from "react";
import { cn } from "@wine-club/ui";

/**
 * Reusable section card.
 * Title floats above the card. Optional header action (e.g. edit icon) to the right of the title.
 * Optional footer actions row at the bottom of the card.
 */
export interface SectionCardProps {
  /** Section title rendered above the card */
  title: React.ReactNode;
  /** Optional element rendered to the right of the title (e.g. an IconButton) */
  headerAction?: React.ReactNode;
  /** Optional actions/buttons rendered in a footer row at the bottom of the card */
  actions?: React.ReactNode;
  /** Main content inside the card */
  children: React.ReactNode;
  /** Remove content padding so children sit flush against the card edges. */
  flush?: boolean;
  className?: string;
}

export const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  ({ title, headerAction, actions, children, flush, className }, ref) => (
    <div ref={ref} className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-14 font-medium text-gray-950 dark:text-white">
          {title}
        </h2>
        {headerAction && (
          <div className="shrink-0">{headerAction}</div>
        )}
      </div>
      <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-100 text-gray-950 dark:text-white overflow-hidden">
        <div className={flush ? undefined : "p-4"}>{children}</div>
        {actions && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-300 dark:border-gray-600 bg-ds-background-200">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
);
SectionCard.displayName = "SectionCard";
