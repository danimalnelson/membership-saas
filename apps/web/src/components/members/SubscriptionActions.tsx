"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, MenuContainer, Menu, MenuItem, useMenuContext } from "@wine-club/ui";
import { Play, Pencil, MoreVertical } from "geist-icons";
import { PauseCircle } from "@/components/icons/PauseCircle";
import { CrossCircle } from "geist-icons";
import { Cross } from "@/components/icons/Cross";

// ---------------------------------------------------------------------------
// Compact three-dot menu for row actions (uses Menu components)
// ---------------------------------------------------------------------------

function CompactMoreMenuTrigger() {
  const { toggle, triggerRef } = useMenuContext();
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      title="More actions"
      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center border-l border-transparent text-muted-foreground group-hover:border-neutral-200 hover:bg-neutral-100 hover:text-foreground dark:group-hover:border-neutral-600 dark:hover:bg-neutral-800"
    >
      <MoreVertical className="h-4 w-4" />
    </button>
  );
}

function CompactMoreMenu({
  canPause,
  canCancel,
  loading,
  businessSlug,
  planId,
  onPause,
  onCancel,
}: {
  canPause: boolean;
  canCancel: boolean;
  loading: boolean;
  businessSlug?: string;
  planId?: string;
  onPause: () => void;
  onCancel: () => void;
}) {
  return (
    <MenuContainer>
      <CompactMoreMenuTrigger />
      <Menu width={160} align="end">
        {canPause && (
          <MenuItem onClick={onPause} disabled={loading}>
            Pause subscription
          </MenuItem>
        )}
        {planId && businessSlug && (
          <MenuItem href={`/app/${businessSlug}/plans/${planId}/edit`}>
            Edit subscription
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
  const [cancelReason, setCancelReason] = useState("");

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

  const handleCancel = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
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
        {/* Combined actions bar - hover actions + three-dot, one unit on row hover */}
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-stretch gap-0 overflow-hidden rounded-lg border border-transparent bg-transparent transition-[border-color,background-color,box-shadow] group-hover:border-neutral-300 group-hover:bg-white group-hover:shadow-sm dark:group-hover:border-neutral-600 dark:group-hover:bg-neutral-100">
          <div className="pointer-events-none flex items-center opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 [&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-neutral-200 dark:[&>button:not(:first-child)]:border-neutral-600">
            {canPause && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePause(); }}
                disabled={loading}
                title="Pause"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-muted-foreground hover:bg-neutral-100 hover:text-foreground disabled:opacity-50 dark:hover:bg-neutral-700"
              >
                <PauseCircle size={16} className="h-4 w-4" />
              </button>
            )}
            {canResume && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleResume(); }}
                disabled={loading}
                title="Resume"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-muted-foreground hover:bg-neutral-100 hover:text-foreground disabled:opacity-50 dark:hover:bg-neutral-700"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowCancelDialog(true); }}
                disabled={loading}
                title="Cancel"
                className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-muted-foreground hover:bg-neutral-100 hover:text-foreground disabled:opacity-50 dark:hover:bg-neutral-700"
              >
                <CrossCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          <CompactMoreMenu
            canPause={canPause}
            canCancel={canCancel}
            loading={loading}
            businessSlug={businessSlug}
            planId={planId}
            onPause={handlePause}
            onCancel={() => setShowCancelDialog(true)}
          />
        </div>
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Cancel Subscription</h2>
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Cross size={20} className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will cancel the subscription at the end of the current billing period.
                  The member will retain access until then.
                </p>

                <div>
                  <label htmlFor="cancelReason" className="block text-sm font-medium mb-2">
                    Reason for Cancellation (Optional)
                  </label>
                  <textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g., Customer requested, payment issues, etc."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="secondary"
                    onClick={() => setShowCancelDialog(false)}
                    disabled={loading}
                  >
                    Keep Subscription
                  </Button>
                  <Button
                    type="error"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    {loading ? "Cancelling..." : "Cancel Subscription"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex gap-2">
      {canPause && (
        <Button
          type="secondary"
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
          type="secondary"
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
          type="error"
          size="small"
          onClick={() => setShowCancelDialog(true)}
          disabled={loading}
          prefix={<Cross size={16} className="h-4 w-4" />}
        >
          Cancel
        </Button>
      )}

      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Cancel Subscription</h2>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Cross size={20} className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will cancel the subscription at the end of the current billing period.
                The member will retain access until then.
              </p>

              <div>
                <label htmlFor="cancelReason" className="block text-sm font-medium mb-2">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Customer requested, payment issues, etc."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="secondary"
                  onClick={() => setShowCancelDialog(false)}
                  disabled={loading}
                >
                  Keep Subscription
                </Button>
                <Button
                  type="error"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {loading ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

