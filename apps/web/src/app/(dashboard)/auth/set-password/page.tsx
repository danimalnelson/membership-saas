"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@wine-club/ui";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const allRequirementsMet = PASSWORD_REQUIREMENTS.every((r) =>
    r.test(password)
  );
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";
  const canSubmit = allRequirementsMet && passwordsMatch && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set password");
        return;
      }

      // Update session to reflect the new password state
      await updateSession({ hasPassword: true });

      // Redirect to the callback URL (will go through 2FA if needed)
      router.push(callbackUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-300 bg-white p-8">
          <div className="text-center mb-8">
            <h1 className="text-20 font-semibold text-gray-950 mb-2">
              Set your password
            </h1>
            <p className="text-14 text-gray-600">
              Create a password to secure your account. You&apos;ll use this to
              sign in going forward.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-13 font-medium text-gray-950 mb-1"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 placeholder:text-gray-700 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                placeholder="Enter your password"
              />
            </div>

            {/* Password requirements */}
            {password.length > 0 && (
              <div className="space-y-1">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = req.test(password);
                  return (
                    <div
                      key={req.label}
                      className={`flex items-center gap-2 text-12 ${
                        met ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      <span>{met ? "\u2713" : "\u2022"}</span>
                      <span>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm password field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-13 font-medium text-gray-950 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 placeholder:text-gray-700 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                placeholder="Confirm your password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-12 text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-14 text-red-800">
                {error}
              </div>
            )}

            {/* Submit button */}
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {saving ? "Setting password..." : "Set Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
