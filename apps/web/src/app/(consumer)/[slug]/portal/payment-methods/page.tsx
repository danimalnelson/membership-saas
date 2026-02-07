"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentMethodForm } from "@/components/portal/PaymentMethodForm";
import { PaymentMethodList } from "@/components/portal/PaymentMethodList";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PaymentMethod {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
}

export default function PaymentMethodsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  
  const [slug, setSlug] = useState<string>("");
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;

    // Fetch Stripe configuration
    fetch(`/api/portal/${slug}/stripe-config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey, {
            stripeAccount: data.stripeAccount,
          }));
        }
      })
      .catch((err) => {
        console.error("Failed to load Stripe config:", err);
        setError("Failed to initialize payment system");
      });
  }, [slug]);

  useEffect(() => {
    if (!email || !slug || !stripePromise) return;

    Promise.all([
      fetchSetupIntent(),
      fetchPaymentMethods(),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, slug, stripePromise]);

  const fetchSetupIntent = async () => {
    try {
      const res = await fetch(`/api/portal/${slug}/payment-methods/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initialize");
      }

      const data = await res.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error("Failed to fetch setup intent:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize payment form");
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch(
        `/api/portal/${slug}/payment-methods?email=${encodeURIComponent(email!)}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch payment methods");
      }

      const data = await res.json();
      setPaymentMethods(data.paymentMethods);
      setDefaultPaymentMethodId(data.defaultPaymentMethodId);
    } catch (err) {
      console.error("Failed to fetch payment methods:", err);
      // Don't set error here - it's okay if they have no payment methods yet
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const res = await fetch(`/api/portal/${slug}/payment-methods/set-default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, paymentMethodId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to set default");
      }

      // Refresh payment methods list
      await fetchPaymentMethods();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to set default payment method");
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return;
    }

    try {
      const res = await fetch(
        `/api/portal/${slug}/payment-methods/${paymentMethodId}?email=${encodeURIComponent(email!)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove");
      }

      // Refresh payment methods list
      await fetchPaymentMethods();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove payment method");
    }
  };

  const handlePaymentMethodAdded = async () => {
    // Refresh both the setup intent and payment methods list
    await fetchSetupIntent();
    await fetchPaymentMethods();
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Invalid access. Please log in through the member portal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link 
            href={`/${slug}/portal`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portal
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="mt-2 text-gray-600">
            Manage your payment methods for all subscriptions
          </p>
        </div>

        {/* Existing Payment Methods */}
        {paymentMethods.length > 0 && (
          <div className="mb-8">
            <PaymentMethodList
              paymentMethods={paymentMethods}
              defaultPaymentMethodId={defaultPaymentMethodId}
              onSetDefault={handleSetDefault}
              onRemove={handleRemove}
            />
          </div>
        )}

        {/* Add New Payment Method */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {paymentMethods.length > 0 ? "Add New Payment Method" : "Add Payment Method"}
          </h2>
          {clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#3b82f6",
                  },
                },
              }}
            >
              <PaymentMethodForm
                slug={slug}
                email={email}
                onSuccess={handlePaymentMethodAdded}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}

