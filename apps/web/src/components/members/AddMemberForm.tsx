"use client";

import { useState } from "react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error(data.error || "Failed to add customer");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-950 mb-1.5">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
          className="w-full px-3 py-2 text-sm border border-neutral-500 rounded-md focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-950 mb-1.5">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          className="w-full px-3 py-2 text-sm border border-neutral-500 rounded-md focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-950 mb-1.5">
          Phone
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          className="w-full px-3 py-2 text-sm border border-neutral-500 rounded-md focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 h-9 rounded-md text-sm font-medium border border-neutral-500 bg-white text-neutral-900 hover:border-neutral-700 hover:text-neutral-950 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="px-3 h-9 rounded-md text-sm font-medium bg-neutral-950 text-white hover:bg-neutral-925 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Adding..." : "Add customer"}
        </button>
      </div>
    </form>
  );
}
