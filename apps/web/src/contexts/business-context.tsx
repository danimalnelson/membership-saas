"use client";

import { createContext, useContext, ReactNode } from "react";

interface BusinessContextValue {
  businessId: string;
  businessSlug: string;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({
  children,
  businessId,
  businessSlug,
}: {
  children: ReactNode;
  businessId: string;
  businessSlug: string;
}) {
  return (
    <BusinessContext.Provider value={{ businessId, businessSlug }}>
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
