"use client";

import { Badge } from "@wine-club/ui";

const STATUS_VARIANTS: Record<string, "green-subtle" | "red-subtle" | "amber-subtle"> = {
  ACTIVE: "green-subtle",
  PAYMENT: "green-subtle",
  CANCELLED: "red-subtle",
  VOIDED: "red-subtle",
  PENDING: "amber-subtle",
};

interface StatusBadgeProps {
  status: string;
  /** Override the displayed label (defaults to status with underscores replaced by spaces) */
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variant = STATUS_VARIANTS[status] || "gray-subtle";
  const raw = label ?? status.replace(/_/g, " ");
  const displayLabel = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();

  return (
    <Badge
      role="status"
      aria-label={`Status: ${displayLabel}`}
      variant={variant}
      size="sm"
    >
      {displayLabel}
    </Badge>
  );
}
