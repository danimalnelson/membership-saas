"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  LongFormInput,
  MenuContainer,
  Menu,
  MenuButton,
  MenuItem,
} from "@wine-club/ui";
import { useBusinessContext } from "@/contexts/business-context";

interface Membership {
  id: string;
  name: string;
  billingAnchor: string;
  cohortBillingDay?: number | null;
  status: string;
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
  stockStatus: "AVAILABLE" | "UNAVAILABLE" | "SOLD_OUT" | "COMING_SOON" | "";
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
  const rawInitialStockStatus = (initialData as { stockStatus?: string } | undefined)
    ?.stockStatus;
  const stockStatusOptions: Array<{ value: PlanFormData["stockStatus"]; label: string }> = [
    { value: "AVAILABLE", label: "Available" },
    { value: "UNAVAILABLE", label: "Unavailable" },
    { value: "COMING_SOON", label: "Coming soon" },
    { value: "SOLD_OUT", label: "Sold out" },
  ];
  const router = useRouter();
  const { businessSlug } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
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
    stockStatus:
      rawInitialStockStatus &&
      ["AVAILABLE", "UNAVAILABLE", "SOLD_OUT", "COMING_SOON"].includes(
        rawInitialStockStatus
      )
        ? (rawInitialStockStatus as PlanFormData["stockStatus"])
        : "",
    maxSubscribers: initialData?.maxSubscribers || "",
  });
  const selectedStockStatusLabel =
    stockStatusOptions.find((option) => option.value === formData.stockStatus)
      ?.label ?? "Select status";
  const isStatusPlaceholder = !formData.stockStatus;

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
    if (!formData.stockStatus) {
      setStatusError("Please select a status.");
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
        maxSubscribers: formData.maxSubscribers
          ? parseInt(formData.maxSubscribers)
          : null,
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

        <div>
          <p className="block text-sm font-medium mb-1">
            Status <span className="text-red-900">*</span>
          </p>
          <MenuContainer className="w-full">
            <MenuButton
              type="button"
              variant="secondary"
              className={`w-full justify-between ${isStatusPlaceholder ? "text-gray-700 dark:text-gray-500" : ""}`}
              showChevron
            >
              {selectedStockStatusLabel}
            </MenuButton>
            <Menu width={220}>
              {stockStatusOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  onClick={() =>
                    {
                      setFormData({
                        ...formData,
                        stockStatus: option.value,
                      });
                      if (statusError) setStatusError(null);
                    }
                  }
                >
                  {option.label}
                </MenuItem>
              ))}
            </Menu>
          </MenuContainer>
          {statusError && (
            <p className="mt-1.5 text-sm text-red-900">{statusError}</p>
          )}
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
          disabled={loading || !formData.name.trim() || !formData.basePrice.trim() || !formData.stockStatus}
        >
          {loading ? "Saving..." : planId ? "Update Plan" : "Create plan"}
        </Button>
      </div>
    </form>
  );
}
