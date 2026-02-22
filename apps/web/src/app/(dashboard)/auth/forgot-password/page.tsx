"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button, Input } from "@wine-club/ui";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || sending) return;

    setSending(true);
    setError("");

    try {
      // Use NextAuth's email provider to send a magic link
      // The callback URL takes the user to set-password after sign-in
      const result = await signIn("email", {
        email: email.toLowerCase().trim(),
        callbackUrl: "/auth/set-password",
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to send reset email. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-gray-300 bg-white p-8">
            <div className="text-center">
              <h1 className="text-20 font-semibold text-gray-950 mb-2">
                Check your email
              </h1>
              <p className="text-14 text-gray-600 mb-6">
                We sent a sign-in link to <strong>{email}</strong>. Click the
                link to sign in and set a new password.
              </p>
              <Link
                href="/auth/signin"
                className="text-13 text-gray-600 hover:text-gray-950 underline transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-300 bg-white p-8">
          <div className="text-center mb-8">
            <h1 className="text-20 font-semibold text-gray-950 mb-2">
              Reset your password
            </h1>
            <p className="text-14 text-gray-600">
              Enter your email and we&apos;ll send you a link to sign in and set
              a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-14 text-red-800">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={sending || !email}
              className="w-full"
            >
              {sending ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <Link
                href="/auth/signin"
                className="text-13 text-gray-600 hover:text-gray-950 underline transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
