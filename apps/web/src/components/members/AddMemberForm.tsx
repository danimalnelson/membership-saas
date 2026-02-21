"use client";

import { useState } from "react";
import { Button, Input, useToasts } from "@wine-club/ui";

interface AddMemberFormProps {
  businessId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddMemberForm({ businessId, onSuccess, onCancel }: AddMemberFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const toasts = useToasts();

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleEmailBlur = () => {
    if (email.trim() && !isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address.");
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/business/${businessId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add member");
      }

      const memberName = name.trim() || email.trim();
      toasts.message({ text: `${memberName} was added.` });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-950 mb-1.5">
          Email <span className="text-red-900">*</span>
        </label>
        <Input
          type="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          placeholder="customer@example.com"
          error={emailError || undefined}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-950 mb-1.5">
          Name <span className="text-red-900">*</span>
        </label>
        <Input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-950 mb-1.5">
          Phone
        </label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !email.trim() || !name.trim()}
        >
          {loading ? "Adding..." : "Add member"}
        </Button>
      </div>
    </form>
  );
}
