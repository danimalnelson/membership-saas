import React from "react";
import { Badge } from "@wine-club/ui";

type MembershipStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

interface MembershipStatusBadgeProps {
  status: MembershipStatus;
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
  PAUSED: {
    label: "Paused",
    variant: "amber-subtle" as const,
  },
  ARCHIVED: {
    label: "Archived",
    variant: "red-subtle" as const,
  },
};

export const MembershipStatusBadge = React.memo(
  ({ status }: MembershipStatusBadgeProps) => {
    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  }
);

MembershipStatusBadge.displayName = "MembershipStatusBadge";

