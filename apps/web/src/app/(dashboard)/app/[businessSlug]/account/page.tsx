"use client";

import { useState, useEffect } from "react";
import { Button } from "@wine-club/ui";

export default function AccountProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setName(data.user?.name || "");
        setEmail(data.user?.email || "");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
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
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
        {/* Name */}
        <div className="px-4 py-4">
          <label className="block text-13 font-medium text-gray-950 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSuccess(false);
            }}
            placeholder="Your name"
            className="w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 placeholder:text-gray-500 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
          />
        </div>

        {/* Email (read-only) */}
        <div className="px-4 py-4 border-t border-gray-300">
          <label className="block text-13 font-medium text-gray-950 mb-1">
            Email
          </label>
          <p className="text-14 text-gray-600">{email}</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-14 text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-14 text-green-800">
          Profile saved.
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
