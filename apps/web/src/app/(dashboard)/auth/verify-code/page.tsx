"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@wine-club/ui";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function VerifyCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send code on mount
  const sendCode = useCallback(async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/two-factor/send", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send code");
        return;
      }

      setCodeSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Failed to send verification code");
    } finally {
      setSending(false);
    }
  }, []);

  useEffect(() => {
    sendCode();
  }, [sendCode]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (codeSent) {
      inputRefs.current[0]?.focus();
    }
  }, [codeSent]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError("");

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (digit && index === CODE_LENGTH - 1) {
      const code = newDigits.join("");
      if (code.length === CODE_LENGTH) {
        handleVerify(code);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pastedText.length === CODE_LENGTH) {
      const newDigits = pastedText.split("");
      setDigits(newDigits);
      inputRefs.current[CODE_LENGTH - 1]?.focus();
      handleVerify(pastedText);
    }
  };

  const handleVerify = async (code: string) => {
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/auth/two-factor/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      // Update the session to mark 2FA as verified
      await updateSession({ twoFactorVerified: true });

      // Redirect to the callback URL
      router.push(callbackUrl);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    setDigits(Array(CODE_LENGTH).fill(""));
    sendCode();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-300 bg-white p-8">
          <div className="text-center mb-8">
            <h1 className="text-20 font-semibold text-gray-950 mb-2">
              Check your email
            </h1>
            <p className="text-14 text-gray-600">
              {codeSent
                ? "We sent a 6-digit verification code to your email."
                : sending
                  ? "Sending verification code..."
                  : "Preparing verification..."}
            </p>
          </div>

          {/* Code input */}
          <div className="flex justify-center gap-2 mb-6">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={verifying || sending}
                className="w-12 h-14 text-center text-xl font-semibold rounded-md border border-gray-300 bg-white text-gray-950 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950 disabled:opacity-50 transition-colors"
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-14 text-red-800 text-center">
              {error}
            </div>
          )}

          {/* Verify button */}
          <Button
            onClick={() => handleVerify(digits.join(""))}
            disabled={
              verifying || digits.join("").length !== CODE_LENGTH
            }
            className="w-full mb-4"
          >
            {verifying ? "Verifying..." : "Verify"}
          </Button>

          {/* Resend */}
          <div className="text-center">
            {cooldown > 0 ? (
              <p className="text-13 text-gray-500">
                Resend code in {cooldown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={sending}
                className="text-13 text-gray-600 hover:text-gray-950 underline transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : "Resend code"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-12 text-gray-500 mt-4">
          Didn&apos;t receive the email? Check your spam folder.
        </p>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyCodeForm />
    </Suspense>
  );
}
