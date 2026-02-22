"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  MenuContainer,
  Menu,
  MenuItem,
  MenuIconTrigger,
  LongFormInput,
} from "@wine-club/ui";
import { Play, MoreHorizontal } from "geist-icons";
import { PauseCircle } from "@/components/icons/PauseCircle";
import { Cross } from "@/components/icons/Cross";

// ---------------------------------------------------------------------------
// Compact three-dot menu for row actions
// ---------------------------------------------------------------------------

function CompactMoreMenu({
  canPause,
  canResume,
  canCancel,
  loading,
  businessSlug,
  planId,
  onPause,
  onResume,
  onCancel,
}: {
  canPause: boolean;
  canResume: boolean;
  canCancel: boolean;
  loading: boolean;
  businessSlug?: string;
  planId?: string;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}) {
  return (
    <MenuContainer>
      <MenuIconTrigger>
        <MoreHorizontal className="h-4 w-4" />
      </MenuIconTrigger>
      <Menu width={180} align="end">
        {canPause && (
          <MenuItem onClick={onPause} disabled={loading}>
            Pause subscription
          </MenuItem>
        )}
        {canResume && (
          <MenuItem onClick={onResume} disabled={loading}>
            Resume subscription
          </MenuItem>
        )}
        {canCancel && (
          <MenuItem onClick={onCancel} disabled={loading}>
            Cancel subscription
          </MenuItem>
        )}
        {planId && businessSlug && (
          <MenuItem href={`/app/${businessSlug}/plans/${planId}`}>
            View plan
          </MenuItem>
        )}
      </Menu>
    </MenuContainer>
  );
}

// ---------------------------------------------------------------------------
// Cancel Dialog (shared between compact and full modes)
// ---------------------------------------------------------------------------

function CancelDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [cancelReason, setCancelReason] = useState("");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cancel Subscription"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Keep Subscription
          </Button>
          <Button
            variant="error"
            onClick={() => onConfirm(cancelReason)}
            disabled={loading}
          >
            {loading ? "Cancelling..." : "Cancel Subscription"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-800">
          This will cancel the subscription at the end of the current billing period.
          The member will retain access until then.
        </p>

        <LongFormInput
          id="cancelReason"
          label="Reason for Cancellation (Optional)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="e.g., Customer requested, payment issues, etc."
          rows={3}
          disabled={loading}
        />
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SubscriptionActionsProps {
  subscriptionId: string;
  stripeSubscriptionId: string;
  status: string;
  cancelAtPeriodEnd?: boolean | null;
  pausedAt: Date | null;
  /** Compact icon-only layout for row hover actions */
  compact?: boolean;
  businessSlug?: string;
  planId?: string;
}

export function SubscriptionActions({
  subscriptionId,
  stripeSubscriptionId,
  status,
  cancelAtPeriodEnd = false,
  pausedAt,
  compact = false,
  businessSlug,
  planId,
}: SubscriptionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isPaused = pausedAt !== null;
  const coerceCancel = !!cancelAtPeriodEnd;
  const canPause = status === "active" && !coerceCancel && !isPaused;
  const canResume = isPaused;
  const canCancel = (status === "active" || status === "trialing") && !coerceCancel && !isPaused;

  const handlePause = async () => {
    if (!confirm("Pause this subscription? The member won't be charged until resumed.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/pause`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Pause error:", error);
        throw new Error(error.details || "Failed to pause subscription");
      }

      alert("✅ Subscription paused successfully!");
      router.refresh();
    } catch (error: any) {
      console.error("Pause error:", error);
      alert(`Failed to pause subscription: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!confirm("Resume this subscription? The member will be charged on the next billing date.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/resume`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to resume subscription");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to resume subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reason: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      setShowCancelDialog(false);
      router.refresh();
    } catch (error) {
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <>
        <div>
          <CompactMoreMenu
            canPause={canPause}
            canResume={canResume}
            canCancel={canCancel}
            loading={loading}
            businessSlug={businessSlug}
            planId={planId}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={() => setShowCancelDialog(true)}
          />
        </div>
        <CancelDialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleCancel}
          loading={loading}
        />
      </>
    );
  }

  return (
    <div className="flex gap-2">
      {canPause && (
        <Button
          variant="secondary"
          size="small"
          onClick={handlePause}
          disabled={loading}
          prefix={<PauseCircle size={16} className="h-4 w-4" />}
        >
          {loading ? "Pausing..." : "Pause"}
        </Button>
      )}

      {canResume && (
        <Button
          variant="secondary"
          size="small"
          onClick={handleResume}
          disabled={loading}
          prefix={<Play className="h-4 w-4" />}
        >
          {loading ? "Resuming..." : "Resume"}
        </Button>
      )}

      {canCancel && (
        <Button
          variant="error"
          size="small"
          onClick={() => setShowCancelDialog(true)}
          disabled={loading}
          prefix={<Cross size={16} className="h-4 w-4" />}
        >
          Cancel
        </Button>
      )}

      <CancelDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        loading={loading}
      />
    </div>
  );
}
