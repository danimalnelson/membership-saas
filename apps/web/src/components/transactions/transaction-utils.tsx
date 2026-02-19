import React from "react";
import { CrossCircle, FileText } from "geist-icons";
import { Clock } from "@/components/icons/Clock";
import { Dollar } from "@/components/icons/Dollar";
import { PauseCircle } from "@/components/icons/PauseCircle";
import { RefreshCounterClockwise } from "@/components/icons/RefreshCounterClockwise";
import { SubscriptionCancelled } from "@/components/icons/SubscriptionCancelled";
import { SubscriptionCreated } from "@/components/icons/SubscriptionCreated";

export interface TypeIconConfig {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
}

export const TYPE_CONFIG: Record<string, TypeIconConfig> = {
  CHARGE:                 { icon: Dollar, color: "var(--ds-blue-700)", bg: "var(--ds-blue-100)", label: "Renewed" },
  SUBSCRIPTION_CREATED:   { icon: SubscriptionCreated, color: "var(--ds-green-700)", bg: "var(--ds-green-100)", label: "Started" },
  START_FAILED:           { icon: CrossCircle, color: "var(--ds-gray-900)", bg: "var(--ds-gray-100)", label: "Failed" },
  RENEWAL_FAILED:         { icon: CrossCircle, color: "var(--ds-red-700)", bg: "var(--ds-red-100)", label: "Failed" },
  VOIDED:                 { icon: CrossCircle, color: "var(--ds-red-700)", bg: "var(--ds-red-100)", label: "Voided" },
  PENDING:                { icon: Clock, color: "var(--ds-amber-700)", bg: "var(--ds-amber-100)", label: "Pending" },
  REFUND:                 { icon: RefreshCounterClockwise, color: "var(--ds-gray-900)", bg: "var(--ds-gray-100)", label: "Refunded" },
  CANCELLATION_SCHEDULED: { icon: SubscriptionCancelled, color: "var(--ds-purple-700)", bg: "var(--ds-purple-100)", label: "Canceled" },
  SUBSCRIPTION_CANCELLED: { icon: SubscriptionCancelled, color: "var(--ds-purple-700)", bg: "var(--ds-purple-100)", label: "Canceled" },
  SUBSCRIPTION_PAUSED:    { icon: PauseCircle, color: "var(--ds-amber-700)", bg: "var(--ds-amber-100)", label: "Paused" },
  SUBSCRIPTION_RESUMED:   { icon: SubscriptionCreated, color: "var(--ds-green-700)", bg: "var(--ds-green-100)", label: "Resumed" },
  PAYMENT_FAILED:         { icon: CrossCircle, color: "var(--ds-red-700)", bg: "var(--ds-red-100)", label: "Failed" },
  PAYOUT_FEE:             { icon: FileText, color: "var(--ds-gray-900)", bg: "var(--ds-gray-100)", label: "Payout fee" },
};

export const DEFAULT_TYPE_CONFIG: TypeIconConfig = {
  icon: FileText,
  color: "var(--ds-gray-900)",
  bg: "var(--ds-gray-100)",
  label: "Event",
};

export function getTypeConfig(type: string): TypeIconConfig {
  return TYPE_CONFIG[type] || DEFAULT_TYPE_CONFIG;
}

export function TypeBadge({ type, size = "sm" }: { type: string; size?: "sm" | "lg" }) {
  const config = getTypeConfig(type);
  const Icon = config.icon;
  const iconSize = size === "lg" ? 28 : 24;
  const svgSize = size === "lg" ? 18 : 16;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center justify-center rounded shrink-0"
        style={{ width: iconSize, height: iconSize, backgroundColor: config.bg }}
      >
        <Icon size={svgSize} color={config.color} />
      </div>
      <span>{config.label}</span>
    </div>
  );
}
