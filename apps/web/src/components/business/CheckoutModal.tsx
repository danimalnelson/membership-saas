"use client";

import { Button } from "@wine-club/ui";
import { X, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  basePrice: number | null;
  currency: string;
  interval: string;
  intervalCount: number;
  setupFee: number | null;
  shippingFee: number | null;
}

interface Membership {
  name: string;
  description: string | null;
}

interface CheckoutFormProps {
  plan: Plan;
  membership: Membership;
  email: string;
  businessSlug: string;
  onSuccess: () => void;
  onClose: () => void;
}

function CheckoutForm({
  plan,
  membership,
  email,
  businessSlug,
  onSuccess,
  onClose,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const calculateTotal = () => {
    let total = plan.basePrice || 0;
    if (plan.setupFee) total += plan.setupFee;
    if (plan.shippingFee) total += plan.shippingFee;
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Please enter your name");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("Please accept the terms and conditions");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with Stripe
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Confirm the setup intent (for subscriptions)
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/${businessSlug}/success`,
          payment_method_data: {
            billing_details: {
              name: name,
              email: email,
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message);
      }

      if (setupIntent?.status === "succeeded") {
        // Create subscription on our backend
        const confirmRes = await fetch(
          `/api/checkout/${businessSlug}/${plan.id}/confirm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              setupIntentId: setupIntent.id,
              paymentMethodId: setupIntent.payment_method,
              consumerEmail: email,
              consumerName: name,
            }),
          }
        );

        if (!confirmRes.ok) {
          const errorData = await confirmRes.json();
          throw new Error(errorData.error || "Failed to create subscription");
        }

        // Success!
        onSuccess();
        router.push(`/${businessSlug}/success`);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMessage(err.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
        <div className="bg-accent/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              {membership.name} - {plan.name}
            </span>
            <span className="text-sm font-medium">
              {plan.basePrice && formatCurrency(plan.basePrice, plan.currency)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Billed {plan.intervalCount > 1 && `every ${plan.intervalCount} `}
            {plan.interval.toLowerCase()}
            {plan.intervalCount > 1 && "s"}
          </div>
          
          {plan.setupFee && plan.setupFee > 0 && (
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                One-time setup fee
              </span>
              <span className="text-sm font-medium">
                {formatCurrency(plan.setupFee, plan.currency)}
              </span>
            </div>
          )}
          
          {plan.shippingFee && plan.shippingFee > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Shipping</span>
              <span className="text-sm font-medium">
                {formatCurrency(plan.shippingFee, plan.currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t font-semibold">
            <span>Total due today</span>
            <span>{formatCurrency(calculateTotal(), plan.currency)}</span>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
        <PaymentElement />
      </div>

      {/* Billing Address */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Billing Address</h3>
        <AddressElement options={{ mode: "billing" }} />
      </div>

      {/* Terms & Conditions */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1"
          disabled={isProcessing}
        />
        <label htmlFor="terms" className="text-sm text-muted-foreground">
          I agree to the terms and conditions and authorize recurring charges
          for this subscription
        </label>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-base"
        disabled={!stripe || isProcessing || !acceptedTerms}
      >
        {isProcessing ? "Processing..." : "Complete Purchase"}
      </Button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Secured by Stripe</span>
      </div>
    </form>
  );
}

interface CheckoutModalProps {
  plan: Plan;
  membership: Membership;
  email: string;
  businessSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({
  plan,
  membership,
  email,
  businessSlug,
  isOpen,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">
              Complete Your Purchase
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your payment information to subscribe
            </p>
          </div>

          {/* Form */}
          <CheckoutForm
            plan={plan}
            membership={membership}
            email={email}
            businessSlug={businessSlug}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

