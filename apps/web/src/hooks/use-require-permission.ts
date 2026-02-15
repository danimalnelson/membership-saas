"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusinessContext } from "@/contexts/business-context";
import { hasPermission, type Permission } from "@/lib/permissions";

/**
 * Client-side permission gate.
 * Checks whether the current user has the given permission.
 * If not, redirects to the dashboard root.
 *
 * Returns `{ allowed: boolean }` so the page can render
 * a loading/blank state while the redirect is pending.
 */
export function useRequirePermission(permission: Permission) {
  const { userRole, businessSlug } = useBusinessContext();
  const router = useRouter();
  const allowed = hasPermission(userRole, permission);

  useEffect(() => {
    if (!allowed) {
      router.replace(`/app/${businessSlug}`);
    }
  }, [allowed, businessSlug, router]);

  return { allowed };
}
