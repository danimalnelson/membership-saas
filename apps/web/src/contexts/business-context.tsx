"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Role } from "@/lib/permissions";

interface BusinessContextValue {
  businessId: string;
  businessSlug: string;
  userRole: Role;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({
  children,
  businessId,
  businessSlug,
  userRole,
}: {
  children: ReactNode;
  businessId: string;
  businessSlug: string;
  userRole: Role;
}) {
  return (
    <BusinessContext.Provider value={{ businessId, businessSlug, userRole }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error("useBusinessContext must be used within a BusinessProvider");
  }
  return ctx;
}
