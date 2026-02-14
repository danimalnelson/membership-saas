"use client";

import { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@wine-club/ui";
import { Dashboard } from "@/components/icons/Dashboard";
import { Lifebuoy } from "@/components/icons/Lifebuoy";
import { Users } from "@/components/icons/Users";
import {
  ArrowLeftRight,
  ChartPie,
  SettingsGear,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Logout,
  Plus,
  Layers,
} from "geist-icons";

interface Business {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface LinearSidebarProps {
  businessId: string;
  business: Business;
  allBusinesses: Business[];
  userEmail?: string;
  userName?: string;
}

const mainNavItems = [
  { href: "", label: "Dashboard", icon: Dashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { href: "/plans", label: "Plans", icon: Layers },
  { href: "/reports", label: "Reports", icon: ChartPie },
];

const settingsNavItems = [
  { href: "/settings", label: "General" },
  { href: "/settings/branding", label: "Branding" },
];

export const LinearSidebar = memo(function LinearSidebar({ 
  businessId, 
  business, 
  allBusinesses, 
  userEmail,
  userName,
}: LinearSidebarProps) {
  const pathname = usePathname();
  const basePath = `/app/${business.slug}`;
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine if we're on a settings page
  const isOnSettingsPage = pathname.startsWith(`${basePath}/settings`);
  const [showSettingsNav, setShowSettingsNav] = useState(isOnSettingsPage);

  // Sync with route changes
  useEffect(() => {
    setShowSettingsNav(isOnSettingsPage);
  }, [isOnSettingsPage]);

  const isActive = (href: string) => {
    if (href === "") {
      return pathname === basePath;
    }
    const fullPath = `${basePath}${href}`;
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  const isSettingsActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    // Exact match for /settings (General), startsWith for sub-pages
    if (href === "/settings") {
      return pathname === fullPath;
    }
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBusinessDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const otherBusinesses = allBusinesses.filter(b => b.id !== businessId);

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-[241px] flex flex-col bg-neutral-50 border-r border-neutral-400 overflow-hidden">
      {/* Workspace Header — stays fixed at top */}
      <div className="px-3 py-3 shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setIsBusinessDropdownOpen(!isBusinessDropdownOpen)}
          className="w-full flex items-center gap-1.5 px-2 h-9 rounded-md hover:bg-neutral-100 transition-colors"
        >
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="h-5 w-5 rounded object-cover"
            />
          ) : (
            <div className="h-5 w-5 rounded bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-[10px]">
                {business.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-semibold text-neutral-950 truncate flex-1 text-left">
            {business.name}
          </span>
          <ChevronDown className={cn(
            "h-3.5 w-3.5 text-neutral-800 transition-transform",
            isBusinessDropdownOpen && "rotate-180"
          )} />
        </button>

        {/* Workspace Dropdown */}
        {isBusinessDropdownOpen && (
          <div className="absolute left-3 right-3 top-14 bg-white rounded-lg shadow-lg border border-neutral-400 z-50 divide-y divide-neutral-400">
            {/* User Info */}
            {(userName || userEmail) && (
              <div className="p-1.5">
                <Link
                  href={`${basePath}/account`}
                  onClick={() => setIsBusinessDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-neutral-100 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    {userName && (
                      <p className="text-[14px] font-medium text-neutral-950 truncate">{userName}</p>
                    )}
                    {userEmail && (
                      <p className="text-[14px] font-normal text-neutral-900 truncate">{userEmail}</p>
                    )}
                  </div>
                  <SettingsGear className="h-4 w-4 text-neutral-900 shrink-0" />
                </Link>
              </div>
            )}

            {/* Businesses */}
            <div className="p-1.5 flex flex-col gap-0.5">
              {/* Current Business */}
              <div className="flex items-center gap-2.5 px-2 h-9 rounded-md bg-neutral-200">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.name} className="h-5 w-5 rounded object-cover" />
                ) : (
                  <div className="h-5 w-5 rounded bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-[10px]">{business.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-neutral-950 truncate flex-1">{business.name}</span>
              </div>

              {/* Other Businesses */}
              {otherBusinesses.map((b) => (
                <Link
                  key={b.id}
                  href={`/app/${b.slug}`}
                  onClick={() => setIsBusinessDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-2 h-9 rounded-md text-sm font-medium text-neutral-900 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                >
                  {b.logoUrl ? (
                    <img src={b.logoUrl} alt={b.name} className="h-5 w-5 rounded object-cover" />
                  ) : (
                    <div className="h-5 w-5 rounded bg-neutral-400 flex items-center justify-center">
                      <span className="text-neutral-900 font-semibold text-[10px]">{b.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="truncate">{b.name}</span>
                </Link>
              ))}
            </div>

            {/* Add Business & Sign Out */}
            <div className="p-1.5 flex flex-col gap-0.5">
              <Link
                href="/onboarding"
                onClick={() => setIsBusinessDropdownOpen(false)}
                className="w-full flex items-center gap-2.5 px-2 h-9 rounded-md text-sm font-medium text-neutral-900 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add business
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-2 h-9 rounded-md text-sm font-medium text-neutral-900 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
              >
                <Logout className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav panels — crossfade with subtle 24px shift */}
      <div className="relative flex-1 overflow-hidden">
        {/* ============ Panel 1: Main Nav ============ */}
        <div
          className="absolute inset-0 flex flex-col transition-all duration-200 ease-in-out"
          style={{
            opacity: showSettingsNav ? 0 : 1,
            transform: showSettingsNav ? "translateX(-24px)" : "translateX(0)",
            pointerEvents: showSettingsNav ? "none" : "auto",
          }}
        >
          <nav className="px-3 py-1 flex flex-col gap-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  className={cn(
                    "flex items-center gap-2.5 px-2 h-9 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-neutral-200 text-neutral-950"
                      : "text-neutral-900 hover:text-neutral-950 hover:bg-neutral-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="border-t border-neutral-400 mt-[4px] mb-[4px]" />

            <button
              onClick={() => setShowSettingsNav(true)}
              className={cn(
                "flex items-center gap-2.5 px-2 h-9 rounded-md text-sm font-medium transition-colors w-full",
                isOnSettingsPage
                  ? "bg-neutral-200 text-neutral-950"
                  : "text-neutral-900 hover:text-neutral-950 hover:bg-neutral-100"
              )}
            >
              <SettingsGear className="h-4 w-4" />
              <span className="flex-1 text-left">Settings</span>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-800" />
            </button>
            <a
              href="mailto:support@example.com"
              className="flex items-center gap-2.5 px-2 h-9 rounded-md text-sm font-medium text-neutral-900 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
            >
              <Lifebuoy className="h-4 w-4" />
              <span>Help & Support</span>
            </a>
          </nav>

          <div className="flex-1" />
        </div>

        {/* ============ Panel 2: Settings Nav ============ */}
        <div
          className="absolute inset-0 flex flex-col transition-all duration-200 ease-in-out"
          style={{
            opacity: showSettingsNav ? 1 : 0,
            transform: showSettingsNav ? "translateX(0)" : "translateX(24px)",
            pointerEvents: showSettingsNav ? "auto" : "none",
          }}
        >
          {/* Settings Header — full-width back button */}
          <div className="px-2 pt-1 pb-1">
            <button
              onClick={() => setShowSettingsNav(false)}
              className="w-full flex items-center px-2 h-9 rounded-md hover:bg-neutral-100 transition-colors text-sm font-medium text-neutral-950 relative"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-800 absolute left-2" />
              <span className="flex-1 text-center">Settings</span>
            </button>
          </div>

          {/* Settings Nav Items */}
          <nav className="px-3 py-1 flex flex-col gap-0.5">
            {settingsNavItems.map((item) => {
              const active = isSettingsActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  className={cn(
                    "flex items-center px-2 h-9 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-neutral-200 text-neutral-950"
                      : "text-neutral-900 hover:text-neutral-950 hover:bg-neutral-100"
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />
        </div>
      </div>
    </aside>
  );
});
