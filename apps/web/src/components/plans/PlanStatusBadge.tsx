import React from "react";

type PlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

interface PlanStatusBadgeProps {
  status: PlanStatus;
}

const statusConfig = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-800",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-red-100 text-red-800",
  },
};

export const PlanStatusBadge = React.memo(
  ({ status }: PlanStatusBadgeProps) => {
    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  }
);

PlanStatusBadge.displayName = "PlanStatusBadge";

