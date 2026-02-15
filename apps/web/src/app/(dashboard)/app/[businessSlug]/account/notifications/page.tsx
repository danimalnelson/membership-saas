"use client";

import { useState, useEffect } from "react";
import { Button } from "@wine-club/ui";
import { useBusinessContext } from "@/contexts/business-context";

interface NotificationPreferences {
  newMember: boolean;
  paymentReceived: boolean;
  paymentFailed: boolean;
  cancellationScheduled: boolean;
  subscriptionCanceled: boolean;
  subscriptionPaused: boolean;
  subscriptionResumed: boolean;
}

const NOTIFICATION_OPTIONS: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: "newMember",
    label: "New member signup",
    description: "When a new member subscribes to one of your plans",
  },
  {
    key: "paymentReceived",
    label: "Payment received",
    description: "When a subscription payment is successfully processed",
  },
  {
    key: "paymentFailed",
    label: "Payment failed",
    description: "When a subscription payment fails",
  },
  {
    key: "cancellationScheduled",
    label: "Cancellation scheduled",
    description:
      "When a member requests cancellation (subscription ends at period end)",
  },
  {
    key: "subscriptionCanceled",
    label: "Subscription canceled",
    description:
      "When a subscription is fully canceled after the billing period ends",
  },
  {
    key: "subscriptionPaused",
    label: "Subscription paused",
    description: "When a member pauses their subscription",
  },
  {
    key: "subscriptionResumed",
    label: "Subscription resumed",
    description: "When a member resumes a paused subscription",
  },
];

export default function AccountNotificationsPage() {
  const { businessId } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch(
          `/api/business/${businessId}/notifications`
        );
        if (!res.ok) throw new Error("Failed to fetch preferences");
        const data = await res.json();
        setPreferences(data.preferences);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [businessId]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: !preferences[key] });
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(
        `/api/business/${businessId}/notifications`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save preferences");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading notification settings...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
        {error || "Failed to load notification preferences"}
      </div>
    );
  }

  return (
    <div>
      <p className="text-14 text-gray-600 mb-4">
        Choose which email notifications you receive for subscription and
        payment events.
      </p>

      <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
        {NOTIFICATION_OPTIONS.map((option, index) => (
          <div
            key={option.key}
            className={`flex items-center justify-between px-4 py-4 ${
              index < NOTIFICATION_OPTIONS.length - 1
                ? "border-b border-gray-300"
                : ""
            }`}
          >
            <div className="mr-4">
              <div className="text-14 font-medium text-gray-950">
                {option.label}
              </div>
              <div className="text-13 text-gray-600 mt-0.5">
                {option.description}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences[option.key]}
              onClick={() => handleToggle(option.key)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${
                preferences[option.key]
                  ? "bg-gray-950"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences[option.key]
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-14 text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-14 text-green-800">
          Notification preferences saved.
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving} className="min-w-32">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
