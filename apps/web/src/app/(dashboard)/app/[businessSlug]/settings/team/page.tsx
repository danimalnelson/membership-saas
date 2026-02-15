"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@wine-club/ui";
import { useBusinessContext } from "@/contexts/business-context";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { hasPermission, getRoleLabel, ASSIGNABLE_ROLES, type Role } from "@/lib/permissions";

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  createdAt: string;
}

export default function TeamSettingsPage() {
  const { businessId, userRole } = useBusinessContext();
  const { allowed } = useRequirePermission("settings.team");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("STAFF");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const canInvite = hasPermission(userRole, "team.invite");
  const canChangeRole = hasPermission(userRole, "team.changeRole");
  const canRemove = hasPermission(userRole, "team.remove");

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/business/${businessId}/team`);
      if (!res.ok) throw new Error("Failed to fetch team");
      const data = await res.json();
      setMembers(data.members);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      const res = await fetch(`/api/business/${businessId}/team/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite");

      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("STAFF");
      setShowInvite(false);
      fetchMembers();
      setTimeout(() => setInviteSuccess(""), 4000);
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(
        `/api/business/${businessId}/team/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleRemove = async (memberId: string, memberName: string | null) => {
    const label = memberName || "this team member";
    if (!confirm(`Remove ${label} from the team?`)) return;

    try {
      const res = await fetch(
        `/api/business/${businessId}/team/${memberId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(""), 4000);
    }
  };

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading team...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-20 font-semibold text-gray-950">Team</h1>
          <p className="text-14 text-gray-600 mt-1">
            Manage who has access to this business and what they can do.
          </p>
        </div>
        {canInvite && (
          <Button
            onClick={() => setShowInvite(!showInvite)}
            className="shrink-0"
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Invite Form */}
      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="mb-6 rounded-lg border border-gray-300 bg-white p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-13 font-medium text-gray-950 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 placeholder:text-gray-500 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
              />
            </div>
            <div className="w-full sm:w-40">
              <label className="block text-13 font-medium text-gray-950 mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-14 text-gray-950 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={inviting} className="shrink-0">
              {inviting ? "Sending..." : "Send Invite"}
            </Button>
          </div>
          {inviteError && (
            <p className="mt-2 text-13 text-red-600">{inviteError}</p>
          )}
        </form>
      )}

      {/* Success / Error banners */}
      {inviteSuccess && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-14 text-green-800">
          {inviteSuccess}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-14 text-red-800">
          {error}
        </div>
      )}

      {/* Team List */}
      <div className="rounded-lg border border-gray-300 bg-white overflow-hidden">
        {members.map((member, index) => (
          <div
            key={member.id}
            className={`flex items-center justify-between px-4 py-3 ${
              index < members.length - 1
                ? "border-b border-gray-300"
                : ""
            }`}
          >
            {/* Avatar + Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                {member.image ? (
                  <img
                    src={member.image}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-13 font-medium text-gray-600">
                    {(member.name || member.email)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-14 font-medium text-gray-950 truncate">
                  {member.name || member.email}
                </p>
                {member.name && (
                  <p className="text-13 text-gray-600 truncate">
                    {member.email}
                  </p>
                )}
              </div>
            </div>

            {/* Role + Actions */}
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {member.role === "OWNER" ? (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-13 font-medium text-gray-700">
                  Owner
                </span>
              ) : canChangeRole ? (
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.id, e.target.value)
                  }
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-13 text-gray-950 focus:border-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-950"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-13 font-medium text-gray-700">
                  {getRoleLabel(member.role)}
                </span>
              )}

              {canRemove && member.role !== "OWNER" && (
                <button
                  onClick={() =>
                    handleRemove(member.id, member.name)
                  }
                  className="rounded-md p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Remove from team"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <line x1="4" y1="4" x2="12" y2="12" />
                    <line x1="12" y1="4" x2="4" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="px-4 py-8 text-center text-14 text-gray-500">
            No team members yet. Invite someone to get started.
          </div>
        )}
      </div>

      {/* Role Explanation */}
      <div className="mt-6 rounded-lg border border-gray-300 bg-white p-4">
        <h3 className="text-14 font-semibold text-gray-950 mb-3">
          Role Permissions
        </h3>
        <div className="space-y-2">
          <div className="flex gap-3">
            <span className="text-13 font-medium text-gray-950 w-20 shrink-0">
              Owner
            </span>
            <span className="text-13 text-gray-600">
              Full access. Can manage team roles, billing, and all settings.
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-13 font-medium text-gray-950 w-20 shrink-0">
              Admin
            </span>
            <span className="text-13 text-gray-600">
              Can edit settings, manage plans, members, and transactions. Can
              invite and remove team members.
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-13 font-medium text-gray-950 w-20 shrink-0">
              Employee
            </span>
            <span className="text-13 text-gray-600">
              Read-only access to the dashboard, members, and transactions.
              Can manage their own notification preferences.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
