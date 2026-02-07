"use client";

import { ReactNode } from "react";
import { LinearSidebar } from "./linear-sidebar";
import { LinearMobileSidebar } from "./linear-mobile-sidebar";

interface Business {
  id: string;
  name: string;
  slug: string | null;
  logoUrl?: string | null;
}

interface LinearLayoutProps {
  children: ReactNode;
  businessId: string;
  business: Business;
  allBusinesses: Business[];
  userEmail?: string;
}

export function LinearLayout({
  children,
  businessId,
  business,
  allBusinesses,
  userEmail,
}: LinearLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0e0f11] dark">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <LinearSidebar
          businessId={businessId}
          business={business}
          allBusinesses={allBusinesses}
          userEmail={userEmail}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <LinearMobileSidebar
          businessId={businessId}
          business={business}
          allBusinesses={allBusinesses}
          userEmail={userEmail}
        />
      </div>

      {/* Main Content Area */}
      <main className="lg:pl-[220px] min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

