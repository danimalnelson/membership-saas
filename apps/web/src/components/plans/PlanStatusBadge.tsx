import React from "react";
import { Badge } from "@wine-club/ui";

type PlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

interface PlanStatusBadgeProps {
  status: PlanStatus;
}

const statusConfig = {
  DRAFT: {
    label: "Draft",
    variant: "gray-subtle" as const,
  },
  ACTIVE: {
    label: "Active",
    variant: "green-subtle" as const,
  },
  ARCHIVED: {
    label: "Archived",
    variant: "red-subtle" as const,
  },
};

export const PlanStatusBadge = React.memo(
  ({ status }: PlanStatusBadgeProps) => {
    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  }
);

PlanStatusBadge.displayName = "PlanStatusBadge";

