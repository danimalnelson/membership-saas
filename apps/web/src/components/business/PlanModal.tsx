"use client";

import { Button, Input, formatCurrency } from "@wine-club/ui";
import { Check } from "geist-icons";
import { Cross } from "@/components/icons/Cross";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  basePrice: number | null;
  currency: string;
  shippingFee: number | null;
  setupFee: number | null;
  stockStatus: string;
}

interface Membership {
  name: string;
  description: string | null;
  billingInterval: string;
}

interface PlanModalProps {
  plan: Plan | null;
  membership: Membership | null;
  businessSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string) => void;
}

export function PlanModal({
  plan,
  membership,
  businessSlug,
  isOpen,
  onClose,
  onEmailSubmit,
}: PlanModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // Reset email when modal closes
      setEmail("");
      setIsSubmitting(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !plan || !membership) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || isSubmitting) return;
    
    // Pass email to parent and close this modal
    // Parent will open CheckoutModal
    onEmailSubmit(email);
  };

  const isDisabledStatuses = ["SOLD_OUT", "COMING_SOON", "UNAVAILABLE", "WAITLIST"];
  const isDisabled = isDisabledStatuses.includes(plan.stockStatus);
  const ctaLabel = plan.stockStatus === "SOLD_OUT"
    ? "Sold Out"
    : plan.stockStatus === "COMING_SOON"
      ? "Coming Soon"
      : isDisabled
        ? "Unavailable"
        : "Continue to checkout";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 ease-out" />

      {/* Modal */}
      <div
        className="relative bg-background rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Close"
        >
          <Cross size={20} className="w-5 h-5 text-foreground" />
        </button>

        <div className="p-8 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">
              {membership.name}
            </p>
            <h2 className="text-3xl font-semibold mb-3 text-balance">
              {plan.name} Plan
            </h2>
            {membership.description && (
              <p className="text-muted-foreground text-pretty">
                {membership.description}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-accent/50 rounded-lg p-6 mb-8">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-semibold">
                {formatCurrency(plan.basePrice ?? 0, plan.currency)}
              </span>
              <span className="text-lg text-muted-foreground">
                /{membership.billingInterval.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Plan Description */}
          {plan.description && (
            <div className="mb-8">
              <h3 className="font-semibold mb-3">About this plan</h3>
              <p className="text-muted-foreground leading-relaxed">
                {plan.description}
              </p>
            </div>
          )}

          {/* Features */}
          <div className="mb-8">
            <h3 className="font-semibold mb-4">What's included</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <Check className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Billed {membership.billingInterval.toLowerCase()}ly
                </span>
              </li>
              {plan.shippingFee && plan.shippingFee > 0 && (
                <li className="flex gap-3">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {formatCurrency(plan.shippingFee, plan.currency)} shipping per
                    delivery
                  </span>
                </li>
              )}
              {plan.setupFee && plan.setupFee > 0 && (
                <li className="flex gap-3">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {formatCurrency(plan.setupFee, plan.currency)} one-time setup
                    fee
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Additional info */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold mb-3">Good to know</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Cancel anytime with no fees</li>
              <li>• Access starts immediately after purchase</li>
              <li>• Benefits reset on your billing date</li>
              <li>• Manage your subscription from the member portal</li>
            </ul>
          </div>

          {/* Stock Status Warning */}
          {plan.stockStatus !== "AVAILABLE" && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {plan.stockStatus === "SOLD_OUT" && "This plan is currently sold out."}
                {plan.stockStatus === "COMING_SOON" && "This plan is coming soon."}
                {plan.stockStatus !== "SOLD_OUT" && plan.stockStatus !== "COMING_SOON" && "This plan is currently unavailable."}
              </p>
            </div>
          )}

          {/* Email Input Form */}
          <form onSubmit={handleCheckout} className="space-y-4">
            <Input
              type="email"
              id="email"
              label="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isDisabled || isSubmitting}
            />

            {/* CTA */}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              size="large"
              disabled={isDisabled || !email}
            >
              {ctaLabel}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              You won't be charged until you complete your order
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

