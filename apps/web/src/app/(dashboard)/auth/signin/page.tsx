"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Button } from "@wine-club/ui";

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      // Successful sign-in — redirect to callback URL
      // (middleware will handle 2FA gate if needed)
      router.push(callbackUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-300 bg-white p-8">
          <div className="text-center mb-8">
            <h1 className="text-20 font-semibold text-gray-950 mb-2">
              Sign in
            </h1>
            <p className="text-14 text-gray-600">
              Enter your email and password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-13 font-medium text-gray-950 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                autoComplete="email"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 placeholder:text-gray-700 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-13 font-medium text-gray-950 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 placeholder:text-gray-700 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-14 text-red-800">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-13 text-gray-600 hover:text-gray-950 underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
