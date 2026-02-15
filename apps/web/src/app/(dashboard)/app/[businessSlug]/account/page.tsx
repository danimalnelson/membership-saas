"use client";

import { useState, useEffect } from "react";
import { Button } from "@wine-club/ui";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function AccountProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

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

  const allPwRequirementsMet = PASSWORD_REQUIREMENTS.every((r) =>
    r.test(newPassword)
  );
  const pwMatch =
    newPassword === confirmNewPassword && confirmNewPassword !== "";
  const canChangePw =
    currentPassword && allPwRequirementsMet && pwMatch && !pwSaving;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canChangePw) return;

    setPwSaving(true);
    setPwError("");
    setPwSuccess(false);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPwError(data.error || "Failed to change password");
        return;
      }

      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch {
      setPwError("Something went wrong. Please try again.");
    } finally {
      setPwSaving(false);
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
    <div className="space-y-8">
      {/* Profile Section */}
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

        <div className="flex justify-end mt-4">
          <Button onClick={handleSave} disabled={saving} className="min-w-32">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Change Password Section */}
      <div>
        <h2 className="text-14 font-semibold text-gray-950 mb-3">
          Change Password
        </h2>
        <form onSubmit={handleChangePassword}>
          <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
            {/* Current Password */}
            <div className="px-4 py-4">
              <label
                htmlFor="currentPassword"
                className="block text-13 font-medium text-gray-950 mb-1"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPwError("");
                  setPwSuccess(false);
                }}
                autoComplete="current-password"
                className="w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 placeholder:text-gray-500 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                placeholder="Enter current password"
              />
            </div>

            {/* New Password */}
            <div className="px-4 py-4 border-t border-gray-300">
              <label
                htmlFor="newPassword"
                className="block text-13 font-medium text-gray-950 mb-1"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPwError("");
                  setPwSuccess(false);
                }}
                autoComplete="new-password"
                className="w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 placeholder:text-gray-500 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                placeholder="Enter new password"
              />
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_REQUIREMENTS.map((req) => {
                    const met = req.test(newPassword);
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
            </div>

            {/* Confirm New Password */}
            <div className="px-4 py-4 border-t border-gray-300">
              <label
                htmlFor="confirmNewPassword"
                className="block text-13 font-medium text-gray-950 mb-1"
              >
                Confirm New Password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  setPwError("");
                  setPwSuccess(false);
                }}
                autoComplete="new-password"
                className="w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 placeholder:text-gray-500 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                placeholder="Confirm new password"
              />
              {confirmNewPassword && !pwMatch && (
                <p className="mt-1 text-12 text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>
          </div>

          {pwError && (
            <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-14 text-red-800">
              {pwError}
            </div>
          )}

          {pwSuccess && (
            <div className="mt-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-14 text-green-800">
              Password changed successfully.
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              type="submit"
              disabled={!canChangePw}
              className="min-w-32"
            >
              {pwSaving ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
