"use client";

import { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@wine-club/ui";
import {
  LayoutDashboard,
  Users,
  Receipt,
  BarChart3,
  PieChart,
  Settings,
  HelpCircle,
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
  Check,
  Search,
  Plus,
  Inbox,
  Layers,
  Compass,
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
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/plans", label: "Plans", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: PieChart },
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
  const [isTeamExpanded, setIsTeamExpanded] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === "") {
      return pathname === basePath;
    }
    return pathname.startsWith(`${basePath}${href}`);
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
    <aside className="fixed left-0 top-0 bottom-0 z-40 w-[220px] flex flex-col bg-[#0e0f11] border-r border-white/[0.06]">
      {/* Workspace Header */}
      <div className="px-3 pt-3 pb-2" ref={dropdownRef}>
        <button
          onClick={() => setIsBusinessDropdownOpen(!isBusinessDropdownOpen)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
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
          <span className="text-[13px] font-medium text-white/90 truncate flex-1 text-left">
            {business.name}
          </span>
          <ChevronDown className={cn(
            "h-3.5 w-3.5 text-white/40 transition-transform",
            isBusinessDropdownOpen && "rotate-180"
          )} />
        </button>

        {/* Workspace Dropdown */}
        {isBusinessDropdownOpen && (
          <div className="absolute left-2 right-2 top-12 bg-[#1c1d1f] rounded-lg shadow-xl border border-white/[0.08] overflow-hidden z-50">
            {/* User Info */}
            {userEmail && (
              <div className="px-3 py-2.5 border-b border-white/[0.06]">
                <p className="text-[11px] text-white/40">Signed in as</p>
                <p className="text-[13px] text-white/80 truncate">{userEmail}</p>
              </div>
            )}

            {/* Current Business */}
            <div className="py-1">
              <div className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.04]">
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt={business.name} className="h-5 w-5 rounded object-cover" />
                ) : (
                  <div className="h-5 w-5 rounded bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-[10px]">{business.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <span className="text-[13px] text-white/90 truncate flex-1">{business.name}</span>
                <Check className="h-4 w-4 text-blue-400" />
              </div>
            </div>

            {/* Other Businesses */}
            {otherBusinesses.length > 0 && (
              <div className="py-1 border-t border-white/[0.06]">
                <p className="px-3 py-1 text-[11px] text-white/40 uppercase tracking-wide">Switch workspace</p>
                {otherBusinesses.map((b) => (
                  <Link
                    key={b.id}
                    href={`/app/${b.slug}`}
                    onClick={() => setIsBusinessDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors"
                  >
                    {b.logoUrl ? (
                      <img src={b.logoUrl} alt={b.name} className="h-5 w-5 rounded object-cover" />
                    ) : (
                      <div className="h-5 w-5 rounded bg-white/10 flex items-center justify-center">
                        <span className="text-white/60 font-semibold text-[10px]">{b.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="text-[13px] text-white/70 truncate">{b.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Sign Out */}
            <div className="py-1 border-t border-white/[0.06]">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-white/70 hover:bg-white/[0.04] hover:text-white/90 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search & New */}
      <div className="px-3 pb-2 flex gap-1">
        <button className="flex-1 flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-white/50 hover:text-white/70 hover:bg-white/[0.04] rounded-md transition-colors">
          <Search className="h-4 w-4" />
          <span>Search</span>
        </button>
      </div>

      {/* Quick Navigation */}
      <nav className="px-2 py-1">
        <Link
          href={`${basePath}`}
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors",
            pathname === basePath
              ? "bg-white/[0.08] text-white"
              : "text-white/60 hover:text-white/90 hover:bg-white/[0.04]"
          )}
        >
          <Inbox className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      </nav>

      {/* Your Business Section */}
      <div className="px-2 pt-4">
        <button
          onClick={() => setIsTeamExpanded(!isTeamExpanded)}
          className="w-full flex items-center gap-1 px-2 py-1 text-[11px] text-white/40 uppercase tracking-wide hover:text-white/60 transition-colors"
        >
          <ChevronRight className={cn(
            "h-3 w-3 transition-transform",
            isTeamExpanded && "rotate-90"
          )} />
          <span>Your Business</span>
        </button>

        {isTeamExpanded && (
          <div className="mt-1">
            {/* Business Item with expandable nav */}
            <div className="space-y-0.5">
              {mainNavItems.slice(1).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={`${basePath}${item.href}`}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors",
                      active
                        ? "bg-white/[0.08] text-white"
                        : "text-white/60 hover:text-white/90 hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Section */}
      <div className="px-2 pb-3 space-y-0.5">
        <Link
          href={`${basePath}/settings`}
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors",
            isActive("/settings")
              ? "bg-white/[0.08] text-white"
              : "text-white/60 hover:text-white/90 hover:bg-white/[0.04]"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <a
          href="mailto:support@example.com"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] text-white/60 hover:text-white/90 hover:bg-white/[0.04] transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help & Support</span>
        </a>
      </div>
    </aside>
  );
});

