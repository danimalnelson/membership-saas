"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@wine-club/ui";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const planId = params.planId as string;

  const [error, setError] = useState("");

  useEffect(() => {
    // Automatically redirect to Stripe Checkout
    // Stripe will collect the email - no need to ask twice!
    const createCheckoutSession = async () => {
      try {
        const response = await fetch(`/api/checkout/${slug}/${planId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}), // No email needed - Stripe will collect it
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create checkout session");
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No checkout URL returned");
        }
      } catch (err: any) {
        console.error("Checkout error:", err);
        setError(err.message || "Something went wrong. Please try again.");
      }
    };

    createCheckoutSession();
  }, [slug, planId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          href={`/${slug}/plans/${planId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plan details
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              {error ? (
                "Error"
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirecting to checkout...
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
                <Button 
                  variant="outline"
                  className="w-full"
                  asChild
                >
                  <Link href={`/${slug}/plans/${planId}`}>
                    Back to Plan
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Please wait while we prepare your secure checkout...
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Powered by{" "}
                  <a 
                    href="https://stripe.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Stripe
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
