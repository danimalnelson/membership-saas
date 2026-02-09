"use client";

import { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@wine-club/ui";
import {
  Users,
  ArrowLeftRight,

  BarChart3,
  PieChart,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Check,
  Inbox,
} from "lucide-react";

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
}

const mainNavItems = [
  { href: "", label: "Dashboard", icon: Inbox },
  { href: "/members", label: "Members", icon: Users },
  { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { href: "/plans", label: "Plans", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: PieChart },
];

const settingsNavItems = [
  { href: "/settings", label: "General" },
  { href: "/settings/branding", label: "Branding" },
];

export const LinearSidebar = memo(function LinearSidebar({ 
  businessId, 
  business, 
  allBusinesses, 
  userEmail 
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
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-[241px] flex flex-col bg-[#fafafa] border-r border-[#eaeaea] overflow-hidden">
      {/* Workspace Header — stays fixed at top */}
      <div className="px-3 pt-3 pb-2 shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setIsBusinessDropdownOpen(!isBusinessDropdownOpen)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#f5f5f5] transition-colors"
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
          <span className="text-sm font-medium text-[#171717] truncate flex-1 text-left">
            {business.name}
          </span>
          <ChevronDown className={cn(
            "h-3.5 w-3.5 text-[#999] transition-transform",
            isBusinessDropdownOpen && "rotate-180"
          )} />
        </button>

        {/* Workspace Dropdown */}
        {isBusinessDropdownOpen && (
          <div className="absolute left-2 right-2 top-12 bg-white rounded-lg shadow-lg border border-[#eaeaea] overflow-hidden z-50">
            {/* User Info */}
            {userEmail && (
              <div className="px-3 py-2.5 border-b border-[#eaeaea]">
                <p className="text-[11px] text-[#999]">Signed in as</p>
                <p className="text-sm text-[#444] truncate">{userEmail}</p>
              </div>
            )}

            {/* Current Business */}
            <div className="py-1">
              <div className="flex items-center gap-2.5 px-3 py-2 bg-[#fafafa]">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.name} className="h-5 w-5 rounded object-cover" />
                ) : (
                  <div className="h-5 w-5 rounded bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-[10px]">{business.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <span className="text-sm text-[#171717] truncate flex-1">{business.name}</span>
                <Check className="h-4 w-4 text-[#171717]" />
              </div>
            </div>

            {/* Other Businesses */}
            {otherBusinesses.length > 0 && (
              <div className="py-1 border-t border-[#eaeaea]">
                <p className="px-3 py-1 text-[11px] text-[#999] uppercase tracking-wide">Switch workspace</p>
                {otherBusinesses.map((b) => (
                  <Link
                    key={b.id}
                    href={`/app/${b.slug}`}
                    onClick={() => setIsBusinessDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#fafafa] transition-colors"
                  >
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt={b.name} className="h-5 w-5 rounded object-cover" />
                    ) : (
                      <div className="h-5 w-5 rounded bg-[#eaeaea] flex items-center justify-center">
                        <span className="text-[#666] font-semibold text-[10px]">{b.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="text-sm text-[#666] truncate">{b.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Sign Out */}
            <div className="py-1 border-t border-[#eaeaea]">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#666] hover:bg-[#fafafa] hover:text-black transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sliding container for main nav and settings nav */}
      <div
        className="flex w-[482px] flex-1 transition-transform duration-200 ease-in-out"
        style={{ transform: showSettingsNav ? "translateX(-241px)" : "translateX(0)" }}
      >
        {/* ============ Panel 1: Main Nav ============ */}
        <div className="w-[241px] h-full flex flex-col shrink-0">
          {/* Main Nav Items */}
          <nav className="px-2 py-1 flex flex-col gap-0.5">
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
                      ? "bg-[#f0f0f0] text-[#171717]"
                      : "text-[#666] hover:text-black hover:bg-[#f5f5f5]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="border-t border-[#eaeaea] mt-[4px] mb-[4px]" />

            <button
              onClick={() => setShowSettingsNav(true)}
              className={cn(
                "flex items-center gap-2.5 px-2 h-9 rounded-md text-sm font-medium transition-colors w-full",
                isOnSettingsPage
                  ? "bg-[#f0f0f0] text-[#171717]"
                  : "text-[#666] hover:text-black hover:bg-[#f5f5f5]"
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="flex-1 text-left">Settings</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#999]" />
            </button>
            <a
              href="mailto:support@example.com"
              className="flex items-center gap-2.5 px-2 h-9 rounded-md text-sm font-medium text-[#666] hover:text-black hover:bg-[#f5f5f5] transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help & Support</span>
            </a>
          </nav>

          <div className="flex-1" />
        </div>

        {/* ============ Panel 2: Settings Nav ============ */}
        <div className="w-[241px] h-full flex flex-col shrink-0">
          {/* Settings Header — full-width back button */}
          <div className="px-2 pt-1 pb-1">
            <button
              onClick={() => setShowSettingsNav(false)}
              className="w-full flex items-center px-2 h-9 rounded-md hover:bg-[#f5f5f5] transition-colors text-sm font-medium text-[#171717] relative"
            >
              <ChevronLeft className="h-4 w-4 text-[#999] absolute left-2" />
              <span className="flex-1 text-center">Settings</span>
            </button>
          </div>

          {/* Settings Nav Items */}
          <nav className="px-2 py-1 flex flex-col gap-0.5">
            {settingsNavItems.map((item) => {
              const active = isSettingsActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  className={cn(
                    "flex items-center px-2 h-9 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-[#f0f0f0] text-[#171717]"
                      : "text-[#666] hover:text-black hover:bg-[#f5f5f5]"
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
