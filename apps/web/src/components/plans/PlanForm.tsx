"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  LongFormInput,
  Toggle,
} from "@wine-club/ui";
import { useBusinessContext } from "@/contexts/business-context";

interface Membership {
  id: string;
  name: string;
  billingAnchor: string;
  cohortBillingDay?: number | null;
}

interface PlanFormData {
  membershipId: string;
  name: string;
  description: string;
  basePrice: string; // In dollars
  currency: string;
  interval: "MONTH";
  intervalCount: number;
  setupFee: string;
  recurringFee: string;
  recurringFeeName: string;
  shippingFee: string;
  visible: boolean;
  available: boolean;
  maxSubscribers: string;
}

interface PlanFormProps {
  businessId: string;
  memberships: Membership[];
  initialData?: Partial<PlanFormData>;
  planId?: string; // If editing
  onSuccess?: () => void; // If provided, called instead of router.push on save
  onCancel?: () => void; // If provided, called instead of router.back on cancel
}

export function PlanForm({
  businessId,
  memberships,
  initialData,
  planId,
  onSuccess,
  onCancel,
}: PlanFormProps) {
  const initialVisible =
    (initialData as { visible?: boolean } | undefined)?.visible ??
    true;
  const initialAvailable =
    (initialData as { available?: boolean } | undefined)?.available ??
    true;
  const router = useRouter();
  const { businessSlug } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    membershipId: initialData?.membershipId || memberships[0]?.id || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    basePrice: initialData?.basePrice || "",
    currency: initialData?.currency || "usd",
    interval: initialData?.interval || "MONTH",
    intervalCount: initialData?.intervalCount || 1,
    setupFee: initialData?.setupFee || "",
    recurringFee: initialData?.recurringFee || "",
    recurringFeeName: initialData?.recurringFeeName || "",
    shippingFee: initialData?.shippingFee || "",
    visible: initialVisible,
    available: initialAvailable,
    maxSubscribers: initialData?.maxSubscribers || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const rawPrice = formData.basePrice.trim();
    const parsedPrice = rawPrice ? Number.parseFloat(rawPrice) : NaN;

    let hasValidationError = false;
    if (!trimmedName) {
      setNameError("Please enter a plan name.");
      hasValidationError = true;
    }
    if (!rawPrice || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setPriceError("Please enter a valid price.");
      hasValidationError = true;
    }
    if (hasValidationError) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert dollar amounts to cents
      const payload: any = {
        ...formData,
        basePrice: formData.basePrice
          ? Math.round(parseFloat(formData.basePrice) * 100)
          : null,
        setupFee: formData.setupFee
          ? Math.round(parseFloat(formData.setupFee) * 100)
          : null,
        recurringFee: formData.recurringFee
          ? Math.round(parseFloat(formData.recurringFee) * 100)
          : null,
        recurringFeeName: formData.recurringFee && parseFloat(formData.recurringFee) > 0 
          ? "Processing Fee" 
          : null,
        shippingFee: formData.shippingFee
          ? Math.round(parseFloat(formData.shippingFee) * 100)
          : null,
        maxSubscribers: formData.maxSubscribers ? parseInt(formData.maxSubscribers) : null,
      };

      const url = planId
        ? `/api/plans/${planId}`
        : "/api/plans/create";
      const method = planId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save plan");
      }

      const data = await response.json();

      // Close drawer or redirect to plans list
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/app/${businessSlug}/plans`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Details */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Details</h3>

        <div>
          <Input
            type="text"
            id="name"
            label="Plan name"
            required
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (nameError) setNameError(null);
            }}
            placeholder="e.g., Monthly Red Wine Selection"
            error={nameError || undefined}
          />
        </div>

        <LongFormInput
          id="description"
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Describe what's included in this plan..."
          rows={3}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-950">Visible</p>
              <p className="text-12 text-gray-600">Show this plan in the consumer experience</p>
            </div>
            <Toggle
              aria-label="Toggle plan visibility"
              checked={formData.visible}
              onChange={() =>
                setFormData((prev) => ({ ...prev, visible: !prev.visible }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-950">Available</p>
              <p className="text-12 text-gray-600">Allow customers to purchase this plan</p>
            </div>
            <Toggle
              aria-label="Toggle plan availability"
              checked={formData.available}
              onChange={() =>
                setFormData((prev) => ({ ...prev, available: !prev.available }))
              }
            />
          </div>
        </div>
      </section>

      {/* Price and fees */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Price and fees</h3>
        <div>
          <Input
            type="number"
            id="basePrice"
            label="Price"
            required
            prefix="$"
            value={formData.basePrice}
            onChange={(e) => {
              setFormData({ ...formData, basePrice: e.target.value });
              if (priceError) setPriceError(null);
            }}
            placeholder="50.00"
            step="0.01"
            min="0"
            error={priceError || undefined}
          />
        </div>

        <div>
          <Input
            type="number"
            id="setupFee"
            label="One-time setup fee"
            helperText="Charged during the first billing cycle"
            prefix="$"
            value={formData.setupFee}
            onChange={(e) =>
              setFormData({ ...formData, setupFee: e.target.value })
            }
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <Input
            type="number"
            id="recurringFee"
            label="Processing fee"
            helperText="Added to each billing cycle"
            prefix="$"
            value={formData.recurringFee}
            onChange={(e) =>
              setFormData({
                ...formData,
                recurringFee: e.target.value,
                recurringFeeName: "Processing Fee"
              })
            }
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => onCancel ? onCancel() : router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim() || !formData.basePrice.trim()}
        >
          {loading ? "Saving..." : planId ? "Update Plan" : "Create plan"}
        </Button>
      </div>
    </form>
  );
}
