"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@wine-club/ui";

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
  pricingType: "FIXED" | "DYNAMIC";
  basePrice: string; // In dollars for form
  currency: string;
  interval: "WEEK" | "MONTH" | "YEAR";
  intervalCount: number;
  quantityPerShipment: string;
  productType: string;
  setupFee: string;
  shippingType: "INCLUDED" | "FLAT_RATE" | "CALCULATED" | "FREE_OVER_AMOUNT";
  shippingCost: string;
  trialPeriodDays: string;
  minimumCommitmentMonths: string;
  stockStatus: "AVAILABLE" | "SOLD_OUT" | "COMING_SOON" | "WAITLIST";
  maxSubscribers: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
}

interface PlanFormProps {
  businessId: string;
  memberships: Membership[];
  initialData?: Partial<PlanFormData>;
  planId?: string; // If editing
}

export function PlanForm({
  businessId,
  memberships,
  initialData,
  planId,
}: PlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    membershipId: initialData?.membershipId || memberships[0]?.id || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    pricingType: initialData?.pricingType || "FIXED",
    basePrice: initialData?.basePrice || "",
    currency: initialData?.currency || "usd",
    interval: initialData?.interval || "MONTH",
    intervalCount: initialData?.intervalCount || 1,
    quantityPerShipment: initialData?.quantityPerShipment || "",
    productType: initialData?.productType || "",
    setupFee: initialData?.setupFee || "",
    shippingType: initialData?.shippingType || "INCLUDED",
    shippingCost: initialData?.shippingCost || "",
    trialPeriodDays: initialData?.trialPeriodDays || "",
    minimumCommitmentMonths: initialData?.minimumCommitmentMonths || "",
    stockStatus: initialData?.stockStatus || "AVAILABLE",
    maxSubscribers: initialData?.maxSubscribers || "",
    status: initialData?.status || "DRAFT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert dollar amounts to cents
      const payload = {
        ...formData,
        basePrice: formData.basePrice
          ? Math.round(parseFloat(formData.basePrice) * 100)
          : null,
        setupFee: formData.setupFee
          ? Math.round(parseFloat(formData.setupFee) * 100)
          : null,
        shippingCost: formData.shippingCost
          ? Math.round(parseFloat(formData.shippingCost) * 100)
          : null,
        quantityPerShipment: formData.quantityPerShipment
          ? parseInt(formData.quantityPerShipment)
          : null,
        trialPeriodDays: formData.trialPeriodDays
          ? parseInt(formData.trialPeriodDays)
          : null,
        minimumCommitmentMonths: formData.minimumCommitmentMonths
          ? parseInt(formData.minimumCommitmentMonths)
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

      // Redirect to plans list
      router.push(`/app/${businessId}/plans`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Core details about this subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="membershipId"
              className="block text-sm font-medium mb-2"
            >
              Membership *
            </label>
            <select
              id="membershipId"
              value={formData.membershipId}
              onChange={(e) =>
                setFormData({ ...formData, membershipId: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select a membership</option>
              {memberships.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Plan Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Monthly Red Wine Selection"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what's included in this plan..."
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as PlanFormData["status"],
                })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="DRAFT">Draft (not visible to customers)</option>
              <option value="ACTIVE">Active (available for signup)</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>
            Set how much and how often customers are charged
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="pricingType"
              className="block text-sm font-medium mb-2"
            >
              Pricing Type
            </label>
            <select
              id="pricingType"
              value={formData.pricingType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricingType: e.target.value as "FIXED" | "DYNAMIC",
                })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="FIXED">Fixed (same price every interval)</option>
              <option value="DYNAMIC">Dynamic (price varies)</option>
            </select>
          </div>

          {formData.pricingType === "FIXED" && (
            <div>
              <label
                htmlFor="basePrice"
                className="block text-sm font-medium mb-2"
              >
                Price (USD) *
              </label>
              <input
                type="number"
                id="basePrice"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({ ...formData, basePrice: e.target.value })
                }
                placeholder="50.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="interval"
                className="block text-sm font-medium mb-2"
              >
                Billing Interval
              </label>
              <select
                id="interval"
                value={formData.interval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interval: e.target.value as PlanFormData["interval"],
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
              <option value="WEEK">Week</option>
              <option value="MONTH">Month</option>
              <option value="YEAR">Year</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="intervalCount"
                className="block text-sm font-medium mb-2"
              >
                Every X Intervals
              </label>
              <input
                type="number"
                id="intervalCount"
                value={formData.intervalCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    intervalCount: parseInt(e.target.value) || 1,
                  })
                }
                min="1"
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-muted-foreground mt-1">
                e.g., "2" for every 2 {formData.interval.toLowerCase()}s
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            What customers receive with this plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="productType"
                className="block text-sm font-medium mb-2"
              >
                Product Type
              </label>
              <input
                type="text"
                id="productType"
                value={formData.productType}
                onChange={(e) =>
                  setFormData({ ...formData, productType: e.target.value })
                }
                placeholder="e.g., wine, beer, coffee"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label
                htmlFor="quantityPerShipment"
                className="block text-sm font-medium mb-2"
              >
                Quantity Per Shipment
              </label>
              <input
                type="number"
                id="quantityPerShipment"
                value={formData.quantityPerShipment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantityPerShipment: e.target.value,
                  })
                }
                placeholder="6"
                min="1"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fees & Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>Fees & Shipping</CardTitle>
          <CardDescription>
            Additional charges and shipping options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="setupFee"
              className="block text-sm font-medium mb-2"
            >
              One-Time Setup Fee (USD)
            </label>
            <input
              type="number"
              id="setupFee"
              value={formData.setupFee}
              onChange={(e) =>
                setFormData({ ...formData, setupFee: e.target.value })
              }
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="shippingType"
              className="block text-sm font-medium mb-2"
            >
              Shipping
            </label>
            <select
              id="shippingType"
              value={formData.shippingType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shippingType: e.target.value as PlanFormData["shippingType"],
                })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="INCLUDED">Included in price</option>
              <option value="FLAT_RATE">Flat rate</option>
              <option value="CALCULATED">Calculated at checkout</option>
              <option value="FREE_OVER_AMOUNT">Free over amount</option>
            </select>
          </div>

          {(formData.shippingType === "FLAT_RATE" || formData.shippingType === "FREE_OVER_AMOUNT") && (
            <div>
              <label
                htmlFor="shippingCost"
                className="block text-sm font-medium mb-2"
              >
                Shipping Cost (USD)
              </label>
              <input
                type="number"
                id="shippingCost"
                value={formData.shippingCost}
                onChange={(e) =>
                  setFormData({ ...formData, shippingCost: e.target.value })
                }
                placeholder="10.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trial & Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Trial & Inventory</CardTitle>
          <CardDescription>
            Trial periods, commitment, and availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="trialPeriodDays"
                className="block text-sm font-medium mb-2"
              >
                Trial Period (Days)
              </label>
              <input
                type="number"
                id="trialPeriodDays"
                value={formData.trialPeriodDays}
                onChange={(e) =>
                  setFormData({ ...formData, trialPeriodDays: e.target.value })
                }
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label
                htmlFor="minimumCommitmentMonths"
                className="block text-sm font-medium mb-2"
              >
                Min. Commitment (Months)
              </label>
              <input
                type="number"
                id="minimumCommitmentMonths"
                value={formData.minimumCommitmentMonths}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumCommitmentMonths: e.target.value,
                  })
                }
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="stockStatus"
              className="block text-sm font-medium mb-2"
            >
              Stock Status
            </label>
            <select
              id="stockStatus"
              value={formData.stockStatus}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stockStatus: e.target.value as PlanFormData["stockStatus"],
                })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="AVAILABLE">Available</option>
              <option value="COMING_SOON">Coming soon</option>
              <option value="WAITLIST">Waitlist only</option>
              <option value="SOLD_OUT">Sold out</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="maxSubscribers"
              className="block text-sm font-medium mb-2"
            >
              Max Subscribers (Optional)
            </label>
            <input
              type="number"
              id="maxSubscribers"
              value={formData.maxSubscribers}
              onChange={(e) =>
                setFormData({ ...formData, maxSubscribers: e.target.value })
              }
              placeholder="Unlimited"
              min="1"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : planId ? "Update Plan" : "Create Plan"}
        </Button>
      </div>
    </form>
  );
}

