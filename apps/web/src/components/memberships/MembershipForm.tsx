"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  Input,
  LongFormInput,
  MenuContainer,
  Menu,
  MenuButton,
  MenuItem,
} from "@wine-club/ui";
import useSWR from "swr";
import { useBusinessContext } from "@/contexts/business-context";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface MembershipFormProps {
  businessId: string;
  membership?: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    billingInterval: string;
    billingAnchor: string;
    cohortBillingDay: number | null;
    chargeImmediately: boolean;
    allowMultiplePlans: boolean;
    maxMembers: number | null;
    status: string;
    giftEnabled: boolean;
    waitlistEnabled: boolean;
    membersOnlyAccess: boolean;
    pauseEnabled: boolean;
    skipEnabled: boolean;
    benefits: any;
    displayOrder: number;
  };
  onSuccess?: () => void; // If provided, called instead of router.push on save
  onCancel?: () => void; // If provided, called instead of router.push on cancel
}

export const MembershipForm = React.memo(
  ({ businessId, membership, onSuccess, onCancel }: MembershipFormProps) => {
    const router = useRouter();
    const { businessSlug } = useBusinessContext();
    const isEdit = !!membership;

    // Form state
    const [name, setName] = useState(membership?.name || "");
    const [description, setDescription] = useState(
      membership?.description || ""
    );
    const [slug, setSlug] = useState(membership?.slug || "");
    const [billingInterval, setBillingInterval] = useState(
      membership?.billingInterval || "MONTH"
    );
    const [billingAnchor, setBillingAnchor] = useState(
      membership?.billingAnchor || "IMMEDIATE"
    );
    const [cohortBillingDay] = useState("1");  // Hardcoded to 1 for MVP
    const [chargeImmediately, setChargeImmediately] = useState(
      membership?.chargeImmediately ?? true
    );
    const [billingStartSelection, setBillingStartSelection] = useState<
      "ROLLING_START" | "COHORT_IMMEDIATE" | "COHORT_DEFERRED" | ""
    >(() => {
      if (!membership) return "";
      if (membership.billingAnchor === "IMMEDIATE") return "ROLLING_START";
      return membership.chargeImmediately ? "COHORT_IMMEDIATE" : "COHORT_DEFERRED";
    });
    const [allowMultiplePlans, setAllowMultiplePlans] = useState(
      membership?.allowMultiplePlans || false
    );
    const [maxMembers, setMaxMembers] = useState(
      membership?.maxMembers?.toString() || ""
    );
    const [status, setStatus] = useState(membership?.status || "");
    const [giftEnabled, setGiftEnabled] = useState(
      membership?.giftEnabled ?? true
    );
    const [waitlistEnabled, setWaitlistEnabled] = useState(
      membership?.waitlistEnabled ?? false
    );
    const [membersOnlyAccess, setMembersOnlyAccess] = useState(
      membership?.membersOnlyAccess ?? false
    );
    const [pauseEnabled, setPauseEnabled] = useState(
      membership?.pauseEnabled ?? false
    );
    const [skipEnabled, setSkipEnabled] = useState(
      membership?.skipEnabled ?? false
    );
    const [benefitRows, setBenefitRows] = useState<string[]>(() => {
      const existing = Array.isArray(membership?.benefits)
        ? (membership?.benefits as string[])
        : [];
      const minRows = 5;
      if (existing.length >= minRows) return existing;
      return [...existing, ...Array(minRows - existing.length).fill("")];
    });
    const [displayOrder, setDisplayOrder] = useState(
      membership?.displayOrder?.toString() || "0"
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [nameError, setNameError] = useState<string | null>(null);
    const [slugError, setSlugError] = useState<string | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [billingStartError, setBillingStartError] = useState<string | null>(null);

    // Fetch subscription count for edit mode
    const { data: subscriptionData } = useSWR(
      isEdit && membership?.id
        ? `/api/memberships/${membership.id}/subscription-count`
        : null,
      fetcher
    );

    const activeSubscriptionCount = subscriptionData?.count || 0;
    const hasBillingRestriction = isEdit && activeSubscriptionCount > 0;

    const billingStartOptions = [
      { value: "ROLLING_START", label: "Rolling start" },
      { value: "COHORT_IMMEDIATE", label: "Cohort billing, immediate start" },
      { value: "COHORT_DEFERRED", label: "Cohort billing, deferred start" },
    ] as const;
    const selectedStatusLabel =
      status === "DRAFT"
        ? "Draft"
        : status === "ACTIVE"
          ? "Active"
          : status === "PAUSED"
            ? "Paused"
            : status === "ARCHIVED"
              ? "Archived"
              : "Select status";
    const selectedBillingStartLabel =
      billingStartOptions.find((option) => option.value === billingStartSelection)
        ?.label ?? "Select billing and start timing";
    const isStatusPlaceholder = !status;
    const isBillingStartPlaceholder = !billingStartSelection;

    const handleBillingStartSelection = (value: (typeof billingStartOptions)[number]["value"]) => {
      setBillingStartSelection(value);
      if (value === "ROLLING_START") {
        setBillingAnchor("IMMEDIATE");
        setChargeImmediately(true);
        return;
      }

      setBillingAnchor("NEXT_INTERVAL");
      setChargeImmediately(value === "COHORT_IMMEDIATE");
    };

    // Auto-generate slug from name
    const handleNameChange = useCallback(
      (value: string) => {
        setName(value);
        if (nameError) setNameError(null);
        if (!isEdit) {
          const generatedSlug = value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          setSlug(generatedSlug);
        }
      },
      [isEdit]
    );

    // Submit form
    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedSlug = slug.trim();
        let hasValidationError = false;

        if (!trimmedName) {
          setNameError("Please enter a club name.");
          hasValidationError = true;
        }
        if (!trimmedSlug) {
          setSlugError("Please enter a slug.");
          hasValidationError = true;
        }
        if (!status) {
          setStatusError("Please select a status.");
          hasValidationError = true;
        }
        if (!isEdit && !billingStartSelection) {
          setBillingStartError("Please select billing and start timing.");
          hasValidationError = true;
        }
        if (hasValidationError) {
          return;
        }

        setError("");
        setIsSubmitting(true);

        try {
          const normalizedBenefits = benefitRows
            .map((value) => value.trim())
            .filter((value) => value.length > 0);

          const payload = {
            name,
            description: description || null,
            slug,
            billingInterval,
            billingAnchor,
            cohortBillingDay:
              billingAnchor === "NEXT_INTERVAL" ? 1 : null,  // Hardcoded to 1
            chargeImmediately: billingAnchor === "NEXT_INTERVAL" ? chargeImmediately : true,
            allowMultiplePlans,
            maxMembers: maxMembers ? parseInt(maxMembers, 10) : null,
            status,
            giftEnabled,
            waitlistEnabled,
            membersOnlyAccess,
            pauseEnabled,
            skipEnabled,
            benefits: normalizedBenefits.length > 0 ? normalizedBenefits : null,
            displayOrder: parseInt(displayOrder, 10) || 0,
          };

          const url = isEdit
            ? `/api/memberships/${membership.id}`
            : "/api/memberships/create";

          const response = await fetch(url, {
            method: isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId, ...payload }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to save club");
          }

          // Close drawer or redirect to memberships list
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/app/${businessSlug}/memberships`);
            router.refresh();
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
          setIsSubmitting(false);
        }
      },
      [
        name,
        description,
        slug,
        billingInterval,
        billingAnchor,
        chargeImmediately,
        allowMultiplePlans,
        maxMembers,
        status,
        giftEnabled,
        waitlistEnabled,
        membersOnlyAccess,
        pauseEnabled,
        skipEnabled,
        benefitRows,
        displayOrder,
        businessId,
        isEdit,
        membership,
        onSuccess,
        router,
        billingStartSelection,
      ]
    );

    return (
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Details */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold">Details</h3>
              <div>
                <Input
                  type="text"
                  label="Name"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Wine Club, Premium Club"
                  error={nameError || undefined}
                />
              </div>

              <div>
                <Input
                  type="text"
                  label="Slug"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    if (slugError) setSlugError(null);
                  }}
                  disabled={isEdit}
                  className="disabled:bg-gray-100"
                  placeholder="wine-club"
                  helperText="A unique, user-friendly identifier added to the URL"
                  error={slugError || undefined}
                />
              </div>

              <div>
                <LongFormInput
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what this club includes..."
                />
              </div>

              {false && (
                <div className="space-y-2">
                  <p className="block text-sm font-medium text-gray-950">Benefits</p>
                  <div className="overflow-hidden rounded-md border border-gray-300">
                    <table className="w-full border-collapse">
                      <tbody>
                        {benefitRows.map((benefit, index) => (
                          <tr
                            key={index}
                            className={index < benefitRows.length - 1 ? "border-b border-gray-300" : ""}
                          >
                            <td className="p-0">
                              <Input
                                type="text"
                                size="small"
                                value={benefit}
                                onChange={(e) =>
                                  setBenefitRows((prev) =>
                                    prev.map((row, rowIndex) =>
                                      rowIndex === index ? e.target.value : row
                                    )
                                  )
                                }
                                className="border-0 rounded-none shadow-none focus:shadow-none"
                                placeholder="Add benefit..."
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status <span className="text-red-900">*</span>
                </label>
                <MenuContainer className="w-full">
                  <MenuButton
                    type="button"
                    variant="secondary"
                    className={`w-full justify-between ${isStatusPlaceholder ? "text-gray-700 dark:text-gray-500" : ""}`}
                    showChevron
                  >
                    {selectedStatusLabel}
                  </MenuButton>
                  <Menu width={220}>
                    <MenuItem
                      onClick={() => {
                        setStatus("DRAFT");
                        if (statusError) setStatusError(null);
                      }}
                    >
                      Draft
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setStatus("ACTIVE");
                        if (statusError) setStatusError(null);
                      }}
                    >
                      Active
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setStatus("PAUSED");
                        if (statusError) setStatusError(null);
                      }}
                    >
                      Paused
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setStatus("ARCHIVED");
                        if (statusError) setStatusError(null);
                      }}
                    >
                      Archived
                    </MenuItem>
                  </Menu>
                </MenuContainer>
                {statusError && (
                  <p className="mt-1.5 text-sm text-red-900">{statusError}</p>
                )}
              </div>
        </section>

        {/* Billing */}
        <section className="space-y-6">
              <h3 className="text-base font-semibold">Billing</h3>

              {/* Warning: Active subscriptions exist */}
              {hasBillingRestriction && (
                <div className="border border-amber-300 bg-amber-50 text-amber-900 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">
                        Billing Settings Locked
                      </h4>
                      <p className="text-sm">
                        You have{" "}
                        <span className="font-semibold">
                          {activeSubscriptionCount} active subscription
                          {activeSubscriptionCount !== 1 ? "s" : ""}
                        </span>
                        . Billing settings cannot be changed while subscriptions
                        are active. Cancel or wait for subscriptions to expire
                        before modifying billing settings.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Frequency */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Billing frequency <span className="text-red-900">*</span>
                </label>
                <MenuContainer className="w-full">
                  <MenuButton
                    type="button"
                    variant="secondary"
                    className="w-full justify-between"
                    showChevron
                    disabled={hasBillingRestriction}
                  >
                    {billingInterval === "MONTH" ? "Monthly" : billingInterval}
                  </MenuButton>
                  <Menu width={220}>
                    <MenuItem onClick={() => setBillingInterval("MONTH")}>
                      Monthly
                    </MenuItem>
                  </Menu>
                </MenuContainer>
                <p className="text-12 text-gray-600 mt-1">
                  All plans in this club will bill at this frequency
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Billing and start timing <span className="text-red-900">*</span>
                </label>
                <MenuContainer className="w-full">
                  <MenuButton
                    type="button"
                    variant="secondary"
                    className={`w-full justify-between ${isBillingStartPlaceholder ? "text-gray-700 dark:text-gray-500" : ""}`}
                    showChevron
                    disabled={hasBillingRestriction}
                  >
                    {selectedBillingStartLabel}
                  </MenuButton>
                  <Menu width={300}>
                    {billingStartOptions.map((option) => (
                      <MenuItem
                        key={option.value}
                        onClick={() => {
                          handleBillingStartSelection(option.value);
                          if (billingStartError) setBillingStartError(null);
                        }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </MenuContainer>
                {billingStartError && (
                  <p className="mt-1.5 text-sm text-red-900">{billingStartError}</p>
                )}
              </div>
        </section>

        {/* Advanced */}
        <section className="space-y-4">
          <h3 className="text-base font-semibold">Advanced</h3>
              <div>
                <Checkbox
                  checked={allowMultiplePlans}
                  onChange={setAllowMultiplePlans}
                >
                  Allow members to subscribe to multiple plans
                </Checkbox>
              </div>

              <div>
                <Checkbox
                  checked={pauseEnabled}
                  onChange={setPauseEnabled}
                >
                  Allow members to pause
                </Checkbox>
              </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => onCancel ? onCancel() : router.push(`/app/${businessSlug}/memberships`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !slug.trim() || !status || (!isEdit && !billingStartSelection)}
          >
            {isSubmitting
              ? "Saving..."
              : isEdit
              ? "Update club"
              : "Create club"}
          </Button>
        </div>
      </form>
    );
  }
);

MembershipForm.displayName = "MembershipForm";

