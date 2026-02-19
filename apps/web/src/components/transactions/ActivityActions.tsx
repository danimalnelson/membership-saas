"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, formatCurrency } from "@wine-club/ui";

export function ActivityActions({
  stripeUrl,
  refundableId,
  amount,
  currency,
  customerName,
}: {
  stripeUrl: string | null;
  refundableId: string | null;
  amount: number;
  currency: string;
  customerName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  const handleRefund = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundableId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refund");
      }
      setShowRefundDialog(false);
      router.refresh();
    } catch (error: any) {
      alert(`Refund failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {stripeUrl && (
          <Button
            variant="secondary"
            size="small"
            asChild
          >
            <a href={stripeUrl} target="_blank" rel="noopener noreferrer">
              View on Stripe
            </a>
          </Button>
        )}
        {refundableId && (
          <Button
            variant="error"
            size="small"
            onClick={() => setShowRefundDialog(true)}
          >
            Refund
          </Button>
        )}
      </div>

      {refundableId && (
        <Dialog
          open={showRefundDialog}
          onClose={() => setShowRefundDialog(false)}
          title="Refund Payment"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowRefundDialog(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="error" onClick={handleRefund} loading={loading}>
                Refund {formatCurrency(amount, currency)}
              </Button>
            </>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-800">
            This will issue a full refund of{" "}
            <strong>{formatCurrency(amount, currency)}</strong>{" "}
            to {customerName}. This action cannot be undone.
          </p>
        </Dialog>
      )}
    </>
  );
}
