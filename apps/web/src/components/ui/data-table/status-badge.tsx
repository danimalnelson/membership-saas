"use client";

const STATUS_STYLES: Record<string, { border: string; text: string; bg: string }> = {
  ACTIVE: { border: "var(--color-green-100)", text: "var(--color-green-100)", bg: "var(--color-green-25)" },
  PAYMENT: { border: "var(--color-green-100)", text: "var(--color-green-100)", bg: "var(--color-green-25)" },
  CANCELLED: { border: "var(--color-red-100)", text: "var(--color-red-100)", bg: "var(--color-red-25)" },
  VOIDED: { border: "var(--color-red-100)", text: "var(--color-red-100)", bg: "var(--color-red-25)" },
  PENDING: { border: "var(--color-yellow-100)", text: "var(--color-yellow-100)", bg: "var(--color-yellow-25)" },
};

const DEFAULT_STYLE = { border: "var(--color-neutral-800)", text: "var(--color-neutral-800)", bg: "var(--color-neutral-100)" };

interface StatusBadgeProps {
  status: string;
  /** Override the displayed label (defaults to status with underscores replaced by spaces) */
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || DEFAULT_STYLE;
  const raw = label ?? status.replace(/_/g, " ");
  const displayLabel = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();

  return (
    <span
      className="inline-flex items-center rounded px-1.5 h-5 font-medium"
      style={{
        fontSize: 12,
        color: style.text,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      {displayLabel}
    </span>
  );
}
