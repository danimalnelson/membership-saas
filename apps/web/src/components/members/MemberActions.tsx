"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MenuContainer, Menu, MenuItem, MenuIconTrigger } from "@wine-club/ui";
import { MoreHorizontal } from "geist-icons";

interface MemberActionsProps {
  memberId: string;
  memberName: string;
  businessSlug: string;
}

export function MemberActions({
  memberId,
  memberName,
  businessSlug,
}: MemberActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete member "${memberName}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to delete member");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Delete member error:", error);
      alert("Failed to delete member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <MenuContainer>
        <MenuIconTrigger><MoreHorizontal className="h-4 w-4" /></MenuIconTrigger>
        <Menu width={192} align="end">
          <MenuItem href={`/app/${businessSlug}/members/${memberId}`}>
            View member details
          </MenuItem>
          <MenuItem onClick={handleDelete} disabled={loading} type="error">
            Delete member
          </MenuItem>
        </Menu>
      </MenuContainer>
    </div>
  );
}
