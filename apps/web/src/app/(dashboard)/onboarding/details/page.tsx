"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  MenuContainer,
  Menu,
  MenuButton,
  MenuItem,
} from "@wine-club/ui";

export default function OnboardingDetailsPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    name: "",
    slug: "",
    country: "US",
    currency: "USD",
    timeZone: "America/New_York",
  });
  const countryOptions = [
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "GB", label: "United Kingdom" },
    { value: "AU", label: "Australia" },
  ] as const;
  const currencyOptions = [
    { value: "USD", label: "USD ($)" },
    { value: "CAD", label: "CAD ($)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "AUD", label: "AUD ($)" },
  ] as const;
  const selectedCountryLabel =
    countryOptions.find((option) => option.value === formData.country)?.label ??
    "Select country";
  const selectedCurrencyLabel =
    currencyOptions.find((option) => option.value === formData.currency)?.label ??
    "Select currency";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { firstName, lastName, ...businessData } = formData;
      const res = await fetch("/api/business/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...businessData,
          userName: `${firstName} ${lastName}`.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create business");
      }

      // Update session with user name so it's immediately available
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      if (fullName) {
        await updateSession({ userName: fullName });
      }

      // Redirect to Stripe Connect step
      router.push(`/onboarding/connect?businessId=${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug from name
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <span className="text-sm font-medium">Business Details</span>
            </div>
            <div className="w-12 h-0.5 bg-muted-foreground/30"></div>
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center font-semibold">
                2
              </div>
              <span className="text-sm">Connect Stripe</span>
            </div>
            <div className="w-12 h-0.5 bg-muted-foreground/30"></div>
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center font-semibold">
                3
              </div>
              <span className="text-sm">Complete</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to Vintigo! 🍷</CardTitle>
            <CardDescription>
              Let&apos;s set up your business so you can start selling wine club memberships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="firstName"
                  type="text"
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  required
                  placeholder="Dan"
                />
                <Input
                  id="lastName"
                  type="text"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  required
                  placeholder="Nelson"
                />
              </div>

              <div>
                <Input
                  id="name"
                  type="text"
                  label="Business Name"
                  helperText="The name of your wine bar, shop, or business"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  placeholder="Ruby Tap Wine Bar"
                />
              </div>

              <div>
                <Input
                  id="slug"
                  type="text"
                  label="URL Slug"
                  helperText="This will be your public page URL (lowercase, letters and hyphens only)"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  required
                  pattern="[a-z0-9-]+"
                  prefix={
                    <span className="text-sm text-muted-foreground">
                      vintigo.com/
                    </span>
                  }
                  placeholder="ruby-tap"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Country *
                  </label>
                  <MenuContainer className="w-full">
                    <MenuButton
                      type="button"
                      variant="secondary"
                      className="w-full justify-between"
                      showChevron
                    >
                      {selectedCountryLabel}
                    </MenuButton>
                    <Menu width={220}>
                      {countryOptions.map((option) => (
                        <MenuItem
                          key={option.value}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, country: option.value }))
                          }
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  </MenuContainer>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Currency *
                  </label>
                  <MenuContainer className="w-full">
                    <MenuButton
                      type="button"
                      variant="secondary"
                      className="w-full justify-between"
                      showChevron
                    >
                      {selectedCurrencyLabel}
                    </MenuButton>
                    <Menu width={220}>
                      {currencyOptions.map((option) => (
                        <MenuItem
                          key={option.value}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, currency: option.value }))
                          }
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  </MenuContainer>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="tertiary"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign Out
                </Button>
                <Button type="submit" disabled={loading} className="min-w-32">
                  {loading ? "Creating..." : "Continue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

